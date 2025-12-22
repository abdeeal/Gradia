import React from "react";
import { describe, it, expect, vi, beforeEach,  afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Mobile from "../pages/Auth/Reset-password/Layout/Mobile";
import NewPassword from "../pages/Auth/Reset-password/Layout/NewPassword";

vi.mock("../pages/Auth/Login/components/Background", () => ({
  __esModule: true,
  default: () => <div data-testid="background" />,
}));

vi.mock("@/components/Logo", () => ({
  __esModule: true,
  default: () => <div data-testid="logo" />,
}));

vi.mock("@/components/Button", () => ({
  __esModule: true,
  Button: (props) => (
    <button
      data-testid="button"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.title}
    </button>
  ),
}));

vi.mock("../pages/Auth/Verify-otp/VerifyOtp", () => ({
  __esModule: true,
  default: ({ email, expiredAt, from, purpose }) => (
    <div data-testid="verify-otp">
      VERIFY OTP - {email} - {expiredAt} - {from} - {purpose}
    </div>
  ),
}));

vi.mock("../pages/Auth/Success-msg/SuccessMsg.jsx", () => ({
  __esModule: true,
  default: ({ type }) => (
    <div data-testid="success-msg">SUCCESS PAGE - {type}</div>
  ),
}));

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn();
  global.fetch = fetchMock;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Reset Password Mobile - minta OTP", () => {
  it("Menampilkan error ketika klik next tanpa menginput email", async () => {
    render(<Mobile />);
    const button = screen.getByTestId("button");
    fireEvent.click(button);
    const error = await screen.findByText(
      "Please enter your email address."
    );
    expect(error).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Menampilkan error dari backend ketika res.ok = false", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "User not found" }),
    });

    render(<Mobile />);
    const emailInput = screen.getByPlaceholderText("your-email@mail.com");
    fireEvent.change(emailInput, {
      target: { value: "user@test.com" },
    });

    const button = screen.getByTestId("button");
    fireEvent.click(button);

    const error = await screen.findByText("User not found");
    expect(error).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Berhasil mengirim OTP dan redirect ke halaman VerifyOtp", async () => {
    const expiresAtMock = "2025-01-01T00:00:00.000Z";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ expires_at: expiresAtMock }),
    });
    render(<Mobile />);

    const emailInput = screen.getByPlaceholderText("your-email@mail.com");
    fireEvent.change(emailInput, {
      target: { value: "user@test.com" },
    });
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    const verifyOtp = await screen.findByTestId("verify-otp");
    expect(verifyOtp).toBeInTheDocument();
    expect(verifyOtp.textContent).toContain("user@test.com");
    expect(verifyOtp.textContent).toContain(expiresAtMock);
    expect(verifyOtp.textContent).toContain("reset-password");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/resetPassword",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@test.com",
          action: "send-otp",
        }),
      })
    );
  });

  it("Menampilkan error apabila fetch mengalami error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    render(<Mobile />);
    const emailInput = screen.getByPlaceholderText("your-email@mail.com");
    fireEvent.change(emailInput, {
      target: { value: "user@test.com" },
    });
    const button = screen.getByTestId("button");
    fireEvent.click(button);
    const error = await screen.findByText(
      "An error occurred. Please try again."
    );
    expect(error).toBeInTheDocument();
  });
});

describe("NewPassword - ganti password", () => {
  const baseProps = {
    email: "user@test.com",
    otp: "123456",
    success: "reset-password",
  };

  it("Menampilkan pesan error apabila field new password dan conffirm password kosong", async () => {
    render(<NewPassword {...baseProps} />);
    const button = screen.getByTestId("button");
    fireEvent.click(button);
    const error = await screen.findByText(
      "Please fill in both fields."
    );
    expect(error).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Menampilkan pesan error jika password dan confirm beda", async () => {
    render(<NewPassword {...baseProps} />);
    const [newPassInput, confirmPassInput] =
      screen.getAllByPlaceholderText("********");
    fireEvent.change(newPassInput, {
      target: { value: "abc123" },
    });
    fireEvent.change(confirmPassInput, {
      target: { value: "xyz" },
    });
    const button = screen.getByTestId("button");
    fireEvent.click(button);
    const error = await screen.findByText(
      "Passwords do not match."
    );
    expect(error).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Menampilkan error dari backend jika res.ok = false", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "Failed to change password",
      }),
    });
    render(<NewPassword {...baseProps} />);
    const [newPassInput, confirmPassInput] =
      screen.getAllByPlaceholderText("********");
    fireEvent.change(newPassInput, {
      target: { value: "abc123" },
    });
    fireEvent.change(confirmPassInput, {
      target: { value: "abc123" },
    });
    const button = screen.getByTestId("button");
    fireEvent.click(button);
    const error = await screen.findByText(
      "Failed to change password"
    );
    expect(error).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Jika berhasil menyimpan password baru, akan redirect ke SuccessMsg dan form akan hilang", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "success" }),
    });
    render(<NewPassword {...baseProps} />);
    const [newPassInput, confirmPassInput] =
      screen.getAllByPlaceholderText("********");
    fireEvent.change(newPassInput, {
      target: { value: "abc123" },
    });
    fireEvent.change(confirmPassInput, {
      target: { value: "abc123" },
    });

    const button = screen.getByTestId("button");
    fireEvent.click(button);

    const successPage = await screen.findByTestId("success-msg");
    expect(successPage).toBeInTheDocument();
    expect(successPage.textContent).toContain("reset-password");
  });
});