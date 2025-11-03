// src/pages/Dashboard/index.jsx
import React, { useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import DueToday from "./components/duetoday";
import CoursesToday from "./components/coursetoday";
import Weather from "./components/weather";
import TotalTask from "./components/totaltask";
import TaskProgress from "./components/taskprogress";
import TaskSummary from "./components/progresstask";

export default function Dashboard() {
  const now = useMemo(() => new Date(), []);
  // Night = 18:00–05:59
  const isNight = now.getHours() >= 18 || now.getHours() < 6;

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 pt-5 pb-6 overflow-y-auto">
        {/* Header */}
        <header className="mb-4 px-0 pr-6">
          <h1 className="text-2xl font-bold">
            Welcome in, <span className="text-amber-300">Abdee Alamsyah</span>
          </h1>
          <p className="text-gray-400">
            Track your learning progress, courses and tasks for today
          </p>
        </header>

        {/* Content grid: Left (main) + Right (task widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_308px] lg:gap-[8px] px-0 pr-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-[22px]">
            {/* Row 1: Due Today + Courses Today */}
            <div className="flex flex-col lg:flex-row gap-[10px]">
              <div className="w-full lg:w-[259px]">
                <DueToday />
              </div>
              <div className="flex-1">
                <CoursesToday variant={isNight ? "night" : "auto"} />
              </div>
            </div>

            {/* Row 2: Weather */}
            <Weather />

            {/* Row 3: Task Summary */}
            <TaskSummary />
          </div>

          {/* RIGHT COLUMN */}
          <aside className="flex flex-col gap-[10px] lg:w-[308px] mr-[10px]">
            <TaskProgress />
            <TotalTask />
          </aside>
        </div>
      </main>
    </div>
  );
}
