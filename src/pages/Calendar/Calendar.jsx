// src/pages/Calendar/Calendar.jsx

// import React dan hook useState untuk state management
import React, { useState } from "react";

// hook untuk mendeteksi ukuran layar (responsive)
import { useMediaQuery } from "react-responsive";

// layout khusus untuk mobile / tablet
import Mobile from "./Layout/Mobile";

// komponen kalender utama (tampilan bulan)
import MonthCalendar from "./components/CalendarCard";

// panel detail event di sebelah kanan
import EventDetailsPanel from "./components/Detail";

// sidebar utama aplikasi
import Sidebar from "@/components/Sidebar";

const Calendar = () => {
  // ===== RESPONSIVE BREAKPOINT =====

  // cek apakah layar mobile (<= 767px)
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // cek apakah layar tablet (768px - 1024px)
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  // ===== STATE =====

  // menyimpan tanggal yang sedang dipilih
  const [selectedDate, setSelectedDate] = useState(new Date());

  // menyimpan daftar event pada tanggal terpilih
  const [events, setEvents] = useState([]);

  // ===== SEARCH ELEMENT DI HEADER CALENDAR =====
  // komponen search yang akan ditampilkan sejajar dengan header calendar
  const SearchInHeader = (
    <div className="flex items-center gap-2">
      {/* icon search */}
      <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70">
        <path
          fill="currentColor"
          d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 0 0 1.57-4.23A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49L21.49 20zM9.5 14A4.5 4.5 0 1 1 14 9.5A4.5 4.5 0 0 1 9.5 14"
        />
      </svg>

      {/* input text untuk search */}
      <input
        type="text"
        placeholder="Search"
        className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-56"
      />
    </div>
  );

  // ===== CONDITIONAL RENDERING =====
  // jika mobile atau tablet, langsung pakai layout Mobile
  if (isMobile || isTablet) return <Mobile />;

  // ===== DESKTOP LAYOUT =====
  return (
    // container utama, flex horizontal
    <div className="flex h-full ">
      {/* sidebar di sisi kiri */}
      <Sidebar className="mr-0" />

      {/* area konten utama di kanan sidebar */}
      <div className="flex-1 ml-0">
        {/* grid 2 kolom: kalender (70%) dan detail event (30%) */}
        <div
          className="
            grid 
            grid-cols-[70%_30%]
            gap-5 
            items-start
          "
        >
          {/* ======= BAGIAN CALENDAR ======= */}
          <div className="relative w-full">
            {/* komponen kalender bulanan */}
            <MonthCalendar
              // tanggal yang sedang dipilih
              value={selectedDate}

              // handler saat tanggal berubah
              onChange={setSelectedDate}

              // endpoint API untuk mengambil data task
              tasksApi="/api/tasks"

              // callback saat user membuka detail tanggal
              onOpenDetails={(date, evs) => {
                // set tanggal terpilih
                setSelectedDate(date);

                // set event yang ada di tanggal tersebut
                setEvents(evs || []);
              }}

              // elemen tambahan di header calendar (search)
              headerRight={SearchInHeader}
            />

            {/* ===== FALLBACK =====
               digunakan jika CalendarCard belum support headerRight */}
            <div className="pointer-events-none absolute right-4 top-4 hidden">
              <div className="pointer-events-auto">
                {SearchInHeader}
              </div>
            </div>
          </div>

          {/* ======= EVENT DETAILS PANEL ======= */}
          <EventDetailsPanel
            // tanggal yang sedang aktif
            selectedDate={selectedDate}

            // daftar event pada tanggal tersebut
            events={events}

            // handler saat task diklik
            onOpenTask={(id) => {
              console.log("open task:", id);
            }}
          />
        </div>
      </div>
    </div>
  );
};

// export component Calendar
export default Calendar;