import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Mobile from "../pages/Workspaces/Layout/Mobile"; // ⬅️ path sesuai lokasi kamu
import { vi } from "vitest";
import React from "react";

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(() =>
    JSON.stringify({
      id_user: 1,
      fullname: "Testing User",
      email: "test@mail.com",
    })
  ),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock navigate
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Mobile Workspace Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state first", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(
      <BrowserRouter>
        <Mobile />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test("shows Create new workspace button after fetch", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(
      <BrowserRouter>
        <Mobile />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Create new workspace/i)
      ).toBeInTheDocument()
    );
  });

  test("can open add workspace mode", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(
      <BrowserRouter>
        <Mobile />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Create new workspace/i)
      ).toBeInTheDocument()
    );

   fireEvent.click(screen.getByRole("button", { name: "" }));

    expect(
      screen.getByPlaceholderText(/Your workspace's name/i)
    ).toBeInTheDocument();
  });
});
