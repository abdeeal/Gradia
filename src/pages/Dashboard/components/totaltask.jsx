import React from "react";

export default function TotalTask({ total = 32, todayCompleted = 3, onOpen }) {
  return (
    <div
      className="relative rounded-2xl text-white shadow border border-white/5"
      style={{
        height: 254,
        padding: 20,
        backgroundImage: "linear-gradient(to bottom right, #34146C, #28073B)", // kiri atas → kanan bawah
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          style={{
            fontFamily: "Montserrat, ui-sans-serif",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Total Tasks
        </h3>

        {/* Tombol ikon */}
        <button
          onClick={onOpen}
          aria-label="Open total tasks"
          className="flex items-center justify-center rounded-full transition"
          style={{
            width: 32,
            height: 32,
            background: "#FAFAFA",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </button>
      </div>

      {/* Angka */}
      <div style={{ marginTop: 32 }}>
        <span
          style={{
            fontFamily: "Montserrat, ui-sans-serif",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {total}
        </span>
      </div>

      {/* Keterangan */}
      <p
        style={{
          marginTop: 32,
          fontFamily: "Inter, ui-sans-serif",
          fontSize: 14,
          color: "#FCD34D", // amber-300
        }}
      >
        {todayCompleted} tasks completed today
      </p>
    </div>
  );
}
