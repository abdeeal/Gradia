// src/tests/Task.test.jsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, beforeEach, vi } from "vitest";
import Mobile from "@/pages/Tasks/layouts/Mobile";

// Mock fetch global
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ courses: [] }),
    })
  );
});

// Mock Drawer agar menerima task
vi.mock("@/pages/Tasks/components/Drawer", () => ({
  default: ({ task }) => (
    <div data-testid="drawer">
      {task ? <p>{task.name}</p> : <p>Empty Drawer</p>}
    </div>
  ),
}));

// Mock icon library supaya tidak error saat render
vi.mock("react-icons/ri", () => ({
  RiAddLine: () => <span>Icon</span>,
  RiFileEditLine: () => <span>Icon</span>,
  RiProgress2Line: () => <span>Icon</span>,
  RiFolderCheckLine: () => <span>Icon</span>,
  RiAlarmWarningLine: () => <span>Icon</span>,
  RiArrowDownSFill: () => <span>Icon</span>,
}));

describe("Tasks Mobile Component", () => {
  const tasks = [
    { name: "Task A", status: "Not started" },
    { name: "Task B", status: "In progress" },
  ];

  test("renders header Tasks", async () => {
    await act(async () => {
      render(<Mobile tasks={tasks} />);
    });
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(
      screen.getByText("Keep track of your tasks all in one place.")
    ).toBeInTheDocument();
  });

  test("fetches and groups tasks correctly", async () => {
    await act(async () => {
      render(<Mobile tasks={tasks} />);
    });
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  test("click Category toggles its content (collapsed/expanded)", async () => {
    await act(async () => {
      render(<Mobile tasks={tasks} />);
    });
    const notStartedBtn = screen.getByText("Not started");
    await act(async () => {
      fireEvent.click(notStartedBtn);
    });
    const drawer = screen.getByTestId("drawer");
    expect(drawer).toBeInTheDocument();
  });
  //   await act(async () => {
  //     render(<Mobile tasks={tasks} />);
  //   });

  //   // Klik Task A
  //   await act(async () => {
  //     fireEvent.click(screen.getByText("Task A"));
  //   });

  //   // Drawer harus menampilkan Task A
  //   const drawerTask = await screen.findByText("Task A");
  //   expect(drawerTask).toBeInTheDocument();
  // });

  test("Add tasks button renders correctly", async () => {
    await act(async () => {
      render(<Mobile tasks={tasks} />);
    });
    const addBtn = screen.getByText("Add tasks");
    expect(addBtn).toBeInTheDocument();
  });
});
