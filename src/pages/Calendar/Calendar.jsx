// src/pages/Calendar/Calendar.jsx
import React, { useState } from "react";
import { useMediaQuery } from "react-responsive";

import Mobile from "./Layout/Mobile";
import MonthCalendar from "./components/CalendarCard";
import EventDetailsPanel from "./components/Detail";
import Sidebar from "@/components/Sidebar";

const Calendar = () => {
  // breakpoint responsive
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  // elemen search yang sejajar dengan header calendar
  const SearchInHeader = (
    <div className="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70">
        <path
          fill="currentColor"
          d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 0 0 1.57-4.23A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49L21.49 20zM9.5 14A4.5 4.5 0 1 1 14 9.5A4.5 4.5 0 0 1 9.5 14"
        />
      </svg>
      <input
        type="text"
        placeholder="Search"
        className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-56"
      />
    </div>
  );

  // kalau mobile / tablet langsung pakai layout Mobile
  if (isMobile || isTablet) return <Mobile />;

  // desktop layout
  return (
    // 🔥 min-h-screen biar sidebar selalu sepanjang viewport
    <div className="flex min-h-screen">
      {/* sidebar di kiri tanpa gap */}
      <Sidebar className="mr-0" />

      {/* area konten; tetap pakai grid 2 kolom seperti semula */}
      <div className="flex-1 ml-0">
        <div
          className="
            grid 
            grid-cols-[70%_30%]
            gap-[20px] 
            items-start
          "
        >
          {/* ======= CALENDAR ======= */}
          <div className="relative w-full">
            <MonthCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              tasksApi="/api/tasks"
              onOpenDetails={(date, evs) => {
                setSelectedDate(date);
                setEvents(evs || []);
              }}
              // kalau CalendarCard support headerRight
              headerRight={SearchInHeader}
            />

            {/* FALLBACK kalau belum support headerRight */}
            <div className="pointer-events-none absolute right-4 top-4 hidden">
              <div className="pointer-events-auto">{SearchInHeader}</div>
            </div>
          </div>

          {/* ======= EVENT PANEL ======= */}
          <EventDetailsPanel
            selectedDate={selectedDate}
            events={events}
            onOpenTask={(id) => {
              console.log("open task:", id);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
