// src/pages/Dashboard/index.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useMediaQuery } from "react-responsive";

import Sidebar from "@/components/Sidebar";
import Mobile from "./Layout/Mobile";
import DueToday from "../Dashboard/components/duetoday";
import CoursesToday from "../Dashboard/components/coursetoday";
import Weather from "../Dashboard/components/weather";
import TotalTask from "../Dashboard/components/totaltask";
import TaskProgress from "../Dashboard/components/taskprogress";
import TaskSummary from "../Dashboard/components/progresstask";

export default function Dashboard() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;

  const now = useMemo(() => new Date(), []);
  const isNight = now.getHours() >= 18 || now.getHours() < 6;

  // User state
  const [username, setUsername] = useState("User");
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref untuk kolom kiri
  const leftRef = useRef(null);

  // Load username
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem("username");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      let finalName = storedUsername || storedUser.username || storedUser.name;

      if (!finalName && storedUser.email) {
        finalName = storedUser.email.split("@")[0];
      }

      if (finalName) {
        setUsername(finalName);
        localStorage.setItem("username", finalName);
      }
    } catch (e) {
      console.error(e);
    }

    setIsLoaded(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <main className="flex-1 pt-5 pb-6 overflow-y-auto">
        <div className="px-0 pr-6 max-w-full mx-auto">

          <header className="mb-4">
            <h1 className="text-2xl font-bold">
              Welcome in,{" "}
              <span className="text-foreground-300">
                {isLoaded ? `${username}!` : "..."}
              </span>
            </h1>
            <p className="text-gray-400">Track your learning progress, courses and tasks for today</p>
          </header>

          {/* ==== WRAPPER RELATIVE ==== */}
          <div className="relative w-full">

            {/* GRID → KIRI (FLEXIBLE) + SLOT KANAN */}
            <div className="grid grid-cols-[minmax(0,1.6fr)_308px] gap-4 items-start">

              {/* KIRI */}
              <div ref={leftRef} className="min-w-0 flex flex-col gap-[22px]">

                <div className="flex flex-col lg:flex-row gap-[10px]">
                  <div className="w-full lg:w-[259px]">
                    <DueToday />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CoursesToday variant={isNight ? "night" : "auto"} />
                  </div>
                </div>

                <Weather />
                <TaskSummary />
              </div>

              {/* SLOT KANAN (kosong hanya untuk grid structure) */}
              <div className="invisible"></div>

            </div>

            {/* ==== KANAN ABSOLUTE, JARAK 16px DARI KIRI ==== */}
            <div
              className="absolute top-0"
              style={{
                left: "calc((100% - 308px) - 16px)"
              }}
            >
              <div className="w-[308px] flex flex-col gap-[10px]">
                <TaskProgress />
                <TotalTask />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
