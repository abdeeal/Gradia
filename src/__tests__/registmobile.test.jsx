import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Mobile from "../pages/Auth/Registration/Layout/Mobile.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...rest }) => (
      <a
        href={to}
        onClick={(e) => {
          e.preventDefault();
          mockNavigate(to);
        }}
        {...rest}
      >
        {children}
      </a>
    ),
  };
});

vi.mock(
  "../pages/Auth/Login/components/Background",
  () => ({
    __esModule: true,
    default: () => <div data-testid="background" />,
  })
);

vi.mock("../components/Logo", () => ({
  __esModule: true,
  default: () => <div data-testid="logo">LOGO</div>,
}));

vi.mock("../pages/Auth/Login/components/Input", () => ({
  __esModule: true,
  default: ({ title, ...rest }) => (
    <div>
      <label>{title}</label>
      <input aria-label={title} {...rest} />
    </div>
  ),
}));

vi.mock("../components/Button", () => ({
  __esModule: true,
  Button: ({ title, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {title}
    </button>
  ),
}));

vi.mock("../pages/Auth/Verify-otp/VerifyOtp", () => ({
  __esModule: true,
  default: ({ email, expiredAt, purpose }) => (
    <div data-testid="verify-otp">
      VERIFY OTP - {email} - {expiredAt} - {purpose}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.resetAllMocks();
});

const renderMobile = () =>
  render(
    <MemoryRouter>
      <Mobile />
    </MemoryRouter>
  );

describe("Mobile Register Component", () => {
  it("Berhasil memuat UI Halaman Registration", () => {
    renderMobile();
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(screen.getByText(/let's register/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/login here/i)).toBeInTheDocument();
  });

  it("Berhasil menerima inputan pengguna pada email, username, dan password", () => {
    renderMobile();
    const emailInput = screen.getByLabelText(/email/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "myuser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    expect(emailInput.value).toBe("user@test.com");
    expect(usernameInput.value).toBe("myuser");
    expect(passwordInput.value).toBe("secret123");
  });

  it("Berhasil menyimpan data registrasi pengguna", async () => {
    renderMobile();
    const emailInput = screen.getByLabelText(/email/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole("button", { name: /register/i });
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "myuser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purpose: "register",
        expires_at: "2025-01-01T00:00:00Z",
      }),
    });
    fireEvent.click(registerButton);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@test.com",
        username: "myuser",
        password: "secret123",
        action: "register",
      }),
    });
  });

  it("Berhasil redirect ke VerifyOtp setelah registrasi sukses", async () => {
    renderMobile();
    const emailInput = screen.getByLabelText(/email/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole("button", { name: /register/i });
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "myuser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    const mockedPurpose = "register";
    const mockedExpire = "2025-01-01T00:00:00Z";
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purpose: mockedPurpose,
        expires_at: mockedExpire,
      }),
    });
    fireEvent.click(registerButton);
    const verifyOtp = await screen.findByTestId("verify-otp");
    expect(verifyOtp).toBeInTheDocument();
    expect(verifyOtp).toHaveTextContent("user@test.com");
    expect(verifyOtp).toHaveTextContent(mockedExpire);
    expect(verifyOtp).toHaveTextContent(mockedPurpose);
  });

  it("Berhasil redirect ke /auth/login saat link Login Here diklik", () => {
    renderMobile();
    const loginLink = screen.getByText(/login here/i);
    fireEvent.click(loginLink);
    expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
  });

  it("Menampilkan pesan error jika field kosong saat klik Register", async () => {
    renderMobile();
    const registerButton = screen.getByRole("button", { name: /register/i });
    fireEvent.click(registerButton);
    const errorMsg = await screen.findByText(/please fill all fields\./i);
    expect(errorMsg).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("Menampilkan pesan error jika API registrasi gagal", async () => {
    renderMobile();
    const emailInput = screen.getByLabelText(/email/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole("button", { name: /register/i });
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "myuser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email already exists" }),
    });
    fireEvent.click(registerButton);
    const errorMsg = await screen.findByText(/email already exists/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
