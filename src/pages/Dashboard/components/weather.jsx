import React from "react";

/**
 * WeatherCard – tema Day/Night otomatis sesuai jam lokal.
 * Day: 06:00–17:59, Night: 18:00–05:59.
 *
 * Spesifikasi posisi/ukuran (container 754×161):
 *  - Kotak info (171×48) @ left: 347.5, top: 56.5, border-left #FAFAFA, padding-left 8, font 16.
 *    PAGI: baris-1 = Monday, 14 January ; baris-2 = City
 *    MALAM: baris-1 = Monday, 14 January ; baris-2 = 2025
 *  - SUHU (PAGI) 32px @ left: 280.5, right: 416.5, top: 61, bottom: 61
 *  - JAM (MALAM) 32px @ left: 235.5, right: 416.5, top: 61, bottom: 61
 */
export default function WeatherCard({
  temp = 32,
  city = "Purwokerto",
  dateText,
  now,
}) {
  const refDate = now ? new Date(now) : new Date();

  // Format "Monday, 14 January"
  const fallbackDate = refDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const dateLabel = dateText ?? fallbackDate;

  // Day/Night 18:00–05:59
  const hour = refDate.getHours();
  const isNight = hour >= 18 || hour < 6;

  // HH:MM
  const hh = String(hour).padStart(2, "0");
  const mm = String(refDate.getMinutes()).padStart(2, "0");
  const timeHM = `${hh}:${mm}`;

  // Background gradient
  const containerGradient = isNight
    ? "bg-gradient-to-bl from-[#000000] to-[#272727]"
    : "bg-gradient-to-bl from-[#164A7B] to-[#539DB8]";

  // Decorative circles
  const circleAColor = isNight ? "bg-[#656565]/[0.22]" : "bg-[#50D0F4]/[0.22]";
  const circleBColor = isNight ? "bg-[#656565]/[0.13]" : "bg-[#50D0F4]/[0.13]";
  const circleCColor = isNight ? "bg-[#656565]/[0.39]" : "bg-[#50D0F4]/[0.39]";
  const circleDColor = isNight ? "bg-[#656565]/[0.67]" : "bg-[#50D0F4]/[0.67]";
  const circleEGradient = "bg-gradient-to-b from-[#FFE478] to-[#DFA62B]";

  const montserrat = { fontFamily: '"Montserrat", sans-serif' };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow ${containerGradient} text-white`}
      style={{ width: 754, height: 161 }}
    >
      {/* ===== Dekorasi ===== */}
      <div className={`absolute rounded-full ${circleAColor}`} style={{ left: -109, top: 60, width: 218, height: 218 }} />
      <div className={`absolute rounded-full ${circleBColor}`} style={{ left: 560, top: -118, width: 326, height: 326 }} />
      <div className={`absolute rounded-full ${circleCColor}`} style={{ left: 607, top: -106, width: 265, height: 267 }} />
      <div className={`absolute rounded-full ${circleDColor}`} style={{ left: 643, top: -97, width: 218, height: 218 }} />
      <div className={`absolute rounded-full ${circleEGradient}`} style={{ left: 691, top: -27, width: 1100, height: 100 }} />

      {/* ===== Konten sesuai koordinat ===== */}

      {/* 1) Kotak 171×48 */}
      <div className="absolute" style={{ left: 347.5, top: 56.5, width: 171, height: 48 }}>
        <div
          className="h-full flex flex-col justify-center"
          style={{
            ...montserrat,
            fontSize: 16,               // <- sesuai spek
            lineHeight: 1.2,
            borderLeft: "1px solid #FAFAFA",
            paddingLeft: 8,
          }}
        >
          <div>{dateLabel}</div>
          <div style={{ marginTop: 8, opacity: 0.95 }}>
            {isNight ? refDate.getFullYear() : city}
          </div>
        </div>
      </div>

      {/* 2) Elemen besar 32px: SUHU (pagi) atau JAM (malam) */}
      {isNight ? (
        // JAM: left 235.5, right 416.5, top 61, bottom 61
        <div
          className="absolute flex items-center tabular-nums"
          style={{
            left: 235.5,
            top: 61,
            width: 754 - 235.5 - 416.5,
            height: 161 - 61 - 61,
            ...montserrat,
            fontSize: 32,              // <- 32px
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {timeHM}
        </div>
      ) : (
        // SUHU: left 280.5, right 416.5, top 61, bottom 61
        <div
          className="absolute flex items-center tabular-nums"
          style={{
            left: 280.5,
            top: 61,
            width: 754 - 280.5 - 416.5,
            height: 161 - 61 - 61,
            ...montserrat,
            fontSize: 32,              // <- 32px
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {temp}
          <span style={{ fontSize: 24, lineHeight: 1, marginLeft: 4 }}>°</span>
        </div>
      )}
    </div>
  );
}
