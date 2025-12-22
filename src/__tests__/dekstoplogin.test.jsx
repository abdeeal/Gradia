import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Auth/Login/Login";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock untuk lock tampilan desktop
vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

// mock alert
const showAlertMock = vi.fn();
vi.mock("@/hooks/useAlert", () => ({
  useAlert: () => ({
    showAlert: showAlertMock,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  window.localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderDesktopLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe("Desktop Login Page", () => {
  it("Berhasil menampilkan UI Login Page di desktop", () => {
    renderDesktopLogin();

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("Berhasil login dan redirect ke /workspaces", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id_user: "123",
        username: "john",
        email: "john@example.com",
      }),
    });

    const { container } = renderDesktopLogin();

    fireEvent.change(container.querySelector('input[type="email"]'), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/workspaces");
    });

    const user = JSON.parse(localStorage.getItem("user"));
    expect(user).toEqual({
      id_user: "123",
      username: "john",
      email: "john@example.com",
    });
  });

  it("Jika response error tampilkan error message dan alert Login Failed", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "Invalid credentials",
      }),
    });

    const { container } = renderDesktopLogin();

    fireEvent.change(container.querySelector('input[type="email"]'), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    expect(showAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Login Failed",
        variant: "destructive",
      })
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("Menampilkan error apabila terjadi Network Error (catch error)", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const { container } = renderDesktopLogin();

    fireEvent.change(container.querySelector('input[type="email"]'), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/login failed\. please try again\./i)
      ).toBeInTheDocument();
    });

    expect(showAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Login Error",
        variant: "destructive",
      })
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("Jika gagal login melalui google akan menampilkan alert Google Login Error", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderDesktopLogin();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(showAlertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Google Login Error",
          variant: "destructive",
        })
      );
    });
  });
});