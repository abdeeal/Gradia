import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPassword from "../pages/Auth/Reset-Password/ResetPassword.jsx";

const mockNavigate = vi.fn();
let mockLocation = { state: undefined };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    Link: ({ children, ...rest }) => <a {...rest}>{children}</a>,
  };
});

const mockUseMediaQuery = vi.fn();
vi.mock("react-responsive", () => ({
  __esModule: true,
  useMediaQuery: (...args) => mockUseMediaQuery(...args),
}));

vi.mock(
  "../pages/Auth/Reset-Password/Layout/Mobile.jsx",
  () => ({
    __esModule: true,
    default: () => <div data-testid="mobile-reset-password" />,
  })
);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMediaQuery.mockReturnValue(false); // force desktop
  mockLocation = { state: undefined };
  global.fetch = vi.fn();
  window.localStorage.clear();
});

afterEach(() => {
  vi.resetAllMocks();
});

const renderDesktopResetPassword = (props = {}) => {
  return render(<ResetPassword {...props} />);
};

describe("ResetPassword - mode submit email", () => {
  it("Menyimpan data email ke localStorage dan redirect ke OTP saat submit email sukses", async () => {
    const email = "user@example.com";
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "OTP sent", status: "success" }),
    });

    renderDesktopResetPassword({ initialStep: "email" });
    const emailInput = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(emailInput, { target: { value: email } });
    const submitBtn = screen.getByRole("button", { name: /send otp/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/auth/verify-otp",
        expect.objectContaining({
          state: expect.objectContaining({
            email,
            type: "reset-password",
            purpose: "reset-password",
            nextRoute: "/auth/reset-password/newpassword",
          }),
          replace: true,
        })
      );
    });
    expect(window.localStorage.getItem("reset-email")).toBe(email);
  });

  it("Menampilkan alert apabila email yang dimasukkan belum terdaftar", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          message: "Email tidak terdaftar.",
        }),
    });
    renderDesktopResetPassword({ initialStep: "email" });
    const emailInput = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(emailInput, {
      target: { value: "notfound@example.com" },
    });
    const submitBtn = screen.getByRole("button", { name: /send otp/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Email tidak terdaftar.")
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith(
      "/auth/verify-otp",
      expect.anything()
    );
  });

  it("Navigasi ke /auth/login saat klik Back to login 'Login'", () => {
    renderDesktopResetPassword({ initialStep: "email" });
    const backToLoginLink = screen.getByText("Login");
    fireEvent.click(backToLoginLink);
    expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
  });
});

describe("ResetPassword - mode input newPw", () => {
  beforeEach(() => {
    mockLocation = {
      state: { email: "user@example.com" },
    };
  });

  const fillNewPasswordForm = ({
    newPassword,
    confirmPassword,
  }) => {
    const [newPwInput, confirmPwInput] =
      screen.getAllByPlaceholderText("••••••••");

    fireEvent.change(newPwInput, {
      target: { value: newPassword },
    });
    fireEvent.change(confirmPwInput, {
      target: { value: confirmPassword },
    });
    const submitBtn = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitBtn);
  };

  it("Berhasil menyimpan password baru dan redirect ke succes message", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          message: "Password changed",
          status: "success",
        }),
    });

    renderDesktopResetPassword({ initialStep: "newPw" });
    fillNewPasswordForm({
      newPassword: "passwordBaru",
      confirmPassword: "passwordBaru",
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/resetPassword",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "change-password",
            email: "user@example.com",
            new_password: "passwordBaru",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/auth/success/reset",
        { replace: true }
      );
    });
  });

  it("Menampilkan error bila password dan konfirmasi tidak sama", async () => {
    renderDesktopResetPassword({ initialStep: "newPw" });
    fillNewPasswordForm({
      newPassword: "passwordBaru",
      confirmPassword: "bedaPassword",
    });

    expect(
      await screen.findByText("Konfirmasi password tidak sama.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("Menampilkan error bila gagal menyimpan password baru", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          message: "Gagal menyimpan password baru",
        }),
    });
    renderDesktopResetPassword({ initialStep: "newPw" });

    fillNewPasswordForm({
      newPassword: "passwordBaru",
      confirmPassword: "passwordBaru",
    });

    expect(
      await screen.findByText("Gagal menyimpan password baru")
    ).toBeInTheDocument();

    expect(
      mockNavigate.mock.calls.some(
        ([path]) => path === "/auth/success/reset"
      )
    ).toBe(false);
  });

  it("Navigasi ke /auth/login saat klik 'Login' (mode new password)", () => {
    renderDesktopResetPassword({ initialStep: "newPw" });
    const backToLoginLink = screen.getByText("Login");
    fireEvent.click(backToLoginLink);

    expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
  });
});
