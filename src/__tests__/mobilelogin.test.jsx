import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Mobile from "../pages/Auth/Login/Layout/Mobile";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/pages/Verify-otp/VerifyOtp", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="verify-otp">VERIFY OTP - {props.email}</div>
  ),
}));

vi.mock("../src/pages/Auth/Login/components/Background", () => ({
  __esModule: true,
  default: () => <div data-testid="background" />,
}));

vi.mock("../src/components/Logo", () => ({
  __esModule: true,
  default: () => <div data-testid="logo" />,
}));

vi.mock("../src/components/Button", () => ({
  __esModule: true,
  Button: (props) => (
    <button onClick={props.onClick} disabled={props.disabled}>
      {props.title}
    </button>
  ),
}));

describe("Mobile Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.clear();
  });

  const setup = () => {
    return render(
      <MemoryRouter>
        <Mobile />
      </MemoryRouter>
    );
  };

  it("Berhasil menampilkan UI milik login di tampilan mobile", () => {
    setup();
    expect(screen.getByPlaceholderText("your-email@mail.com")).toBeDefined();
    expect(screen.getByPlaceholderText("********")).toBeDefined();
    expect(screen.getByRole("button", { name: /login/i })).toBeDefined();
  });

  it("Menampilkan error jika field kosong", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText("Please fill all fields.")).toBeDefined();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("Redirect ke halaman workspaces apabila login sukses", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { id: 1, email: "test@mail.com" },
      }),
    });
    setup();
    fireEvent.change(screen.getByPlaceholderText("your-email@mail.com"), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/workspaces");
    });
  });

  it("Menampilkan pesan error apabila login gagal", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });
    setup();

    fireEvent.change(screen.getByPlaceholderText("your-email@mail.com"), {
      target: { value: "wrong@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeDefined();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});