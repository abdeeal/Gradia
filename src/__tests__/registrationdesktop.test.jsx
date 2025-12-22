import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import Registration from "../pages/Auth/Registration/Registration.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(),
}));

vi.mock("@/hooks/useAlert", () => ({
  __esModule: true,
  useAlert: () => ({
    showAlert: vi.fn(),
  }),
}));

const mockedUseMediaQuery = useMediaQuery;

const setDesktopScreen = () => {
  mockedUseMediaQuery.mockImplementation((query) => {
    if (query?.maxWidth === 767) return false; // isMobile
    if (query?.minWidth === 768 && query?.maxWidth === 1024) return false; // isTablet
    return false;
  });
};

describe("Registration desktop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDesktopScreen();
    global.fetch = vi.fn(); 
  });

  it("Berhasil Registrasi dan terhubung ke BE", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purpose: "register",
        expires_at: "2025-01-01T00:00:00Z",
      }),
    });

    const { container } = render(
      <MemoryRouter>
        <Registration />
      </MemoryRouter>
    );

    const [emailInput, usernameInput] = screen.getAllByRole("textbox");
    const passwordInput = container.querySelector('input[type="password"]');
    expect(passwordInput).not.toBeNull();

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "gradiauser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    const btnRegister = screen.getByRole("button", { name: /register now/i });
    fireEvent.click(btnRegister);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }); 
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/auth");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      email: "user@test.com",
      username: "gradiauser",
      password: "secret123",
      action: "register",
    });
  });

  it("Menampilkan error ketika gagal Registrasi", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email already used" }),
    });

    const { container } = render(
      <MemoryRouter>
        <Registration />
      </MemoryRouter>
    );

    const [emailInput, usernameInput] = screen.getAllByRole("textbox");
    const passwordInput = container.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "gradiauser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    const btnRegister = screen.getByRole("button", { name: /register now/i });
    fireEvent.click(btnRegister);

    expect(
      await screen.findByText(/Email already used/i)
    ).toBeInTheDocument();
  });

  it("Redirect ke halaman Verify OTP", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purpose: "register",
        expires_at: "2025-01-01T00:00:00Z",
      }),
    });

    const { container } = render(
      <MemoryRouter>
        <Registration />
      </MemoryRouter>
    );

    const [emailInput, usernameInput] = screen.getAllByRole("textbox");
    const passwordInput = container.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(usernameInput, { target: { value: "gradiauser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    const btnRegister = screen.getByRole("button", { name: /register now/i });

    expect(screen.getByText(/Let’s Register/i)).toBeInTheDocument();

    fireEvent.click(btnRegister);

    await waitFor(() => {
      expect(screen.queryByText(/Let’s Register/i)).not.toBeInTheDocument();
    });
  });
  
  it("navigate ke /auth/login ketika tombol Login diklik", () => {
    render(
      <MemoryRouter>
        <Registration />
      </MemoryRouter>
    );

    const loginButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
  });
});