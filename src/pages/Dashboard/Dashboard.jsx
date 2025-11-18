// src/pages/Dashboard/index.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import Mobile from "./Layout/Mobile";

import Sidebar from "@/components/Sidebar";
import DueToday from "../Dashboard/components/duetoday";
import CoursesToday from "../Dashboard/components/coursetoday";
import Weather from "../Dashboard/components/weather";
import TotalTask from "../Dashboard/components/totaltask";
import TaskProgress from "../Dashboard/components/taskprogress";
import TaskSummary from "../Dashboard/components/progresstask";

export default function Dashboard() {
  // Breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) {
    return <Mobile />;
  }

  const now = useMemo(() => new Date(), []);
  const isNight = now.getHours() >= 18 || now.getHours() < 6;

  // state user
  const [username, setUsername] = useState("User"); // default
  const [id_user, setIdUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🔹 Ambil username & id_user langsung dari localStorage (tanpa fetch API)
  useEffect(() => {
    try {
      const storedId = localStorage.getItem("id_user");
      const storedUsername = localStorage.getItem("username");
      const storedUserRaw = localStorage.getItem("user");

      if (storedId) {
        const numericId = Number(storedId);
        if (!Number.isNaN(numericId)) {
          setIdUser(numericId);
        }
      }

      let finalUsername = storedUsername || null;

      // kalau key "username" kosong, coba ambil dari objek "user" atau dari email
      if (!finalUsername && storedUserRaw) {
        try {
          const u = JSON.parse(storedUserRaw) || {};

          // beberapa kemungkinan nama field
          finalUsername =
            u.username ||
            u.UserName ||
            u.name ||
            u.fullname ||
            null;

          // fallback terakhir: ambil dari email sebelum "@"
          if (!finalUsername && u.email) {
            const beforeAt = String(u.email).split("@")[0];
            if (beforeAt) {
              finalUsername = beforeAt;
            }
          }
        } catch (e) {
          console.error("Failed to parse localStorage user:", e);
        }
      }

      if (finalUsername) {
        setUsername(finalUsername);
        // simpan lagi supaya kedepannya cukup baca "username"
        localStorage.setItem("username", finalUsername);
      }

      setIsLoaded(true);
    } catch (e) {
      console.error("Error loading user from localStorage:", e);
      setIsLoaded(true);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 pt-5 pb-6 overflow-y-auto">
        {/* Header */}
        <header className="mb-4 px-0 pr-6">
          <h1 className="text-2xl font-bold">
            Welcome in,{" "} 
            <span className="text-foreground-300">
  {isLoaded ? `${username}!` : "..."}
</span>

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
