import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, test, beforeEach, vi, afterEach } from "vitest";
import { Tab } from "@/pages/Courses/layouts/Tab";
import { MemoryRouter } from "react-router-dom";

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store = { id_workspace: "123" };
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => (store[key] = value.toString()),
    clear: () => (store = { id_workspace: "123" }),
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

beforeEach(() => {
  // Mock fetch dengan delay untuk simulasi real fetch
  global.fetch = vi.fn(() =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id_courses: 1,
                name: "Course A",
                alias: "CA",
                lecturer: "John Doe",
                day: "Monday",
                start: "08:00:00",
                end: "10:00:00",
                room: "101",
                sks: 3,
              },
              {
                id_courses: 2,
                name: "Course B",
                alias: "CB",
                lecturer: "Jane Smith",
                day: "Tuesday",
                start: "10:00:00",
                end: "12:00:00",
                room: "102",
                sks: 2,
              },
            ]),
        });
      }, 100); // simulasi delay network
    })
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

// Mock Drawer
vi.mock("@/pages/Courses/components/Drawer", () => ({
  Drawer: ({ data, empty }) => (
    <div data-testid="drawer">
      {empty ? <p>Empty Drawer</p> : <p>{data?.name || "No Course"}</p>}
    </div>
  ),
}));

// Mock CourseCard
vi.mock("@/pages/Courses/components/Card", () => ({
  CourseCard: ({ title, setDrawer, idCourse }) => (
    <button onClick={() => setDrawer(true)} data-testid={`course-${idCourse}`}>
      {title}
    </button>
  ),
}));

// Mock DayMob
vi.mock("@/pages/Courses/components/DayMob", () => ({
  default: ({ day, count }) => (
    <div data-testid="day-mob">
      {day}: {count}
    </div>
  ),
}));

// Mock DayTab
vi.mock("@/pages/Courses/components/DayTab", () => ({
  DayTab: ({ day, count }) => (
    <div data-testid="day-tab">
      {day}: {count}
    </div>
  ),
}));

// Mock Skeleton
vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }) => (
    <div data-testid="skeleton" className={className}>
      Loading...
    </div>
  ),
}));

// Mock Search
vi.mock("@/components/Search", () => ({
  Search: ({ value, onChange, className }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  ),
}));

// Mock Button
vi.mock("@/components/Button", () => ({
  Button: ({ onClick }) => (
    <button onClick={onClick} data-testid="add-course-btn">
      Add courses
    </button>
  ),
}));

// Mock react-responsive
vi.mock("react-responsive", () => ({
  useMediaQuery: ({ maxWidth }) => {
    if (maxWidth && maxWidth <= 767) return true; // mobile
    return false;
  },
}));

describe("Tab Component", () => {
  const renderWithRouter = (ui) =>
    render(<MemoryRouter initialEntries={["/"]}>{ui}</MemoryRouter>);

  test("renders header and search", async () => {
    renderWithRouter(<Tab />);
    
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(
      screen.getByText("Keep track of your courses all in one place.")
    ).toBeInTheDocument();
  });

  test("renders courses after fetch", async () => {
    renderWithRouter(<Tab />);
    
    // Tunggu skeleton hilang dan courses muncul
    await waitFor(
      () => {
        expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    
    // Tunggu courses muncul
    await waitFor(
      () => {
        expect(screen.getByText("Course A")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    
    expect(screen.getByText("Course B")).toBeInTheDocument();
  });

  test("click CourseCard opens drawer", async () => {
    renderWithRouter(<Tab />);
    
    // Tunggu course muncul
    const courseBtn = await waitFor(
      () => screen.getByTestId("course-1"),
      { timeout: 2000 }
    );
    
    // Click course card
    fireEvent.click(courseBtn);
    
    // Tunggu state update
    await waitFor(() => {
      const drawer = screen.getByTestId("drawer");
      // Drawer terbuka, tapi karena tidak ada searchParams, tetap "No Course"
      expect(drawer).toBeInTheDocument();
    });
  });

  test("drawer shows empty when emptyDrawer true", async () => {
    renderWithRouter(<Tab />);
    
    // Tunggu component selesai loading
    await waitFor(
      () => {
        expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    
    // Click "Add courses" button
    const addButton = screen.getByTestId("add-course-btn");
    fireEvent.click(addButton);
    
    // Drawer harus menampilkan "Empty Drawer"
    await waitFor(
      () => {
        expect(screen.getByTestId("drawer")).toHaveTextContent("Empty Drawer");
      },
      { timeout: 1000 }
    );
  });
});