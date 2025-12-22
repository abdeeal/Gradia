import { render, screen, waitFor } from "@testing-library/react";
import Mobile from "../pages/Presence/layouts/Mobile";
import React from "react";

// Mock sessionStorage
beforeAll(() => {
  Storage.prototype.getItem = vi.fn(() => "123"); // id_workspace = 123
});

// Mock fetch API
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes("/api/courses")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id_courses: 1,
              name: "Math",
              start: "08:00",
              end: "10:00",
              room: "A101",
              sks: 2,
            },
          ]),
      });
    }

    if (url.includes("/api/presences")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id_presence: 1,
              id_course: 1,
              course_name: "Math",
              presences_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              status: "Present",
              note: null,
              course_room: "A101",
              course_sks: 2,
              course_start: "08:00",
              course_end: "10:00",
            },
          ]),
      });
    }

    return Promise.reject("Unknown API");
  });
});

// Mock komponen anak
vi.mock("@/components/Bagdes", () => ({
  default: () => <div data-testid="Badges" />,
}));

vi.mock("@/components/Search", () => ({
  Search: ({ datatestid }) => (
    <input data-testid={datatestid || "Search"} />
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="Skeleton" />,
}));

vi.mock("../components/Card", () => ({
  default: () => <div data-testid="Card" />,
}));

vi.mock("../components/Pagination", () => ({
  default: () => <div data-testid="Pagination" />,
}));

vi.mock("../components/HeaderWithSizeMenu", () => ({
  default: () => <div data-testid="HeaderMenu" />,
}));

vi.mock("../components/Popup", () => ({
  default: () => <div data-testid="Popup" />,
}));

// ---------------------------
// TEST CASES
// ---------------------------

describe("Mobile Presence Page", () => {
  test("renders header 'Presences'", async () => {
    render(<Mobile />);
    expect(await screen.findByText("Presences")).toBeInTheDocument();
  });

  test("fetches courses & presences", async () => {
    render(<Mobile />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/courses?q=today&idWorkspace=123")
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/presences?idWorkspace=123")
      );
    });
  });

  test("renders SearchTab (desktop search)", async () => {
    render(<Mobile />);
    expect(await screen.findByTestId("SearchTab")).toBeInTheDocument();
  });

  test("renders SearchMobile (mobile search)", async () => {
    render(<Mobile />);
    expect(await screen.findByTestId("SearchMobile")).toBeInTheDocument();
  });
});
