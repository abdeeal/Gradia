// src/pages/Dashboard/index.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";

import Sidebar from "@/components/Sidebar";
import Mobile from "./Layout/Mobile";
import DueToday from "../Dashboard/components/duetoday";
import CoursesToday from "../Dashboard/components/coursetoday";
import Weather from "../Dashboard/components/weather";
import TotalTask from "../Dashboard/components/totaltask";
import TaskProgress from "../Dashboard/components/taskprogress";
import TaskSummary from "../Dashboard/components/progresstask";

// lebar minimum wrapper: weather (754) + gap 16 + panel kanan 308
const MIN_WRAP_W = 754 + 16 + 308;

export default function Dashboard() {
  const isMb = useMediaQuery({ maxWidth: 767 });
  const isTab = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMb || isTab) return <Mobile />;

  const now = useMemo(() => new Date(), []);
  const isNight = now.getHours() >= 18 || now.getHours() < 6;

  const [name, setName] = useState("User");
  const [ready, setReady] = useState(false);

  const leftRef = useRef(null);
  const wrapRef = useRef(null);
  const [rightLeft, setRightLeft] = useState(null);

  // load username
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

  // sync posisi panel kanan: 16px dari sisi kanan kolom kiri
  useEffect(() => {
    const sync = () => {
      if (!wrapRef.current || !leftRef.current) return;

      const wrapRect = wrapRef.current.getBoundingClientRect();
      const leftRect = leftRef.current.getBoundingClientRect();

      const colRight = leftRect.right - wrapRect.left;
      const offset = colRight + 16; // jarak 16px

      setRightLeft(offset);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <main className="flex-1 pt-5 pb-6 overflow-y-auto">
        {/* overflow-x-auto supaya kalau viewport < MIN_WRAP_W muncul scroll, bukan nabrak */}
        <div className="px-0 pr-6 max-w-full mx-auto overflow-x-auto">
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

          {/* WRAPPER RELATIVE dengan minWidth dikunci */}
          <div
            className="relative w-full"
            ref={wrapRef}
            style={{ minWidth: MIN_WRAP_W }}
          >
            {/* GRID → KIRI (FLEXIBLE) + SLOT KANAN DUMMY */}
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

              {/* SLOT KANAN DUMMY (buat tinggi grid) */}
              <div className="invisible" />
            </div>

            {/* PANEL KANAN ABSOLUTE, POSISI DINAMIS 16px DARI KIRI */}
            <div
              className="absolute top-0"
              style={{
                left: rightLeft != null ? `${rightLeft}px` : undefined,
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
