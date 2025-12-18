// src/pages/Dashboard/index.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  const isMb = useMediaQuery({ maxWidth: 767 });
  const isTab = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isMobileLayout = isMb || isTab;

  const now = useMemo(() => new Date(), []);
  const isNight = now.getHours() >= 18 || now.getHours() < 6;

  const [name, setName] = useState("User");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("username");
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

      let final = savedName || savedUser.username || savedUser.name;

      if (!final && savedUser.email) {
        final = savedUser.email.split("@")[0];
      }

      if (final) {
        setName(final);
        localStorage.setItem("username", final);
      }
    } catch (e) {
      console.error(e);
    }

    setReady(true);
  }, []);

  if (isMobileLayout) {
    return <Mobile />;
  }


  return (
    <div className="flex bg-black text-white w-full ">
      <Sidebar />

      <main className="pt-5 h-fit w-full 2xl:pr-8 pr-4">
        <div className="px-0 pr-6 max-w-full">
          <header className="mb-4">
            <h1 className="text-2xl font-bold">
              Welcome in,{" "}
              <span className="text-foreground-300">
                {ready ? `${name}!` : "..."}
              </span>
            </h1>
            <p className="text-gray-400">
              Track your learning progress, courses and tasks for today
            </p>
          </header>

          {/* GRID KIRI 80% — KANAN 20% (berlaku sama di 1440, 1960, dst) */}
          <div className="w-full pt-4">
            <div className="grid grid-cols-[70%_30%] gap-4 2xl:gap-6">
              {/* KIRI 80% */}
              <div className="w-full flex flex-col gap-4 2xl:gap-6 min-w-0">
                <div className="grid grid-cols-[35%_65%] gap-4 2xl:gap-6">
                  <div className="w-full">
                    <DueToday />
                  </div>

                  <div className="w-full min-w-0 pr-4 2xl:pr-6">
                    <CoursesToday variant={isNight ? "night" : "auto"} />
                  </div>
                </div>

                <Weather />
                <TaskSummary />
              </div>

              {/* KANAN 20% — TaskProgress (pie chart) & TotalTask lebar sama */}
              <div className="flex flex-col gap-4 2xl:gap-6 w-full">
                <div className="w-full">
                  <TaskProgress />
                </div>
                <div className="w-full">
                  <TotalTask />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
