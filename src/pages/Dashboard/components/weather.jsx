import React, { useEffect, useState } from "react";

export default function WeatherCard({ dateText, now }) {
  // Dummy city (di-update dari geolocation/IP)
  const [city, setCity] = useState("Loading...");

  const refDate = now ? new Date(now) : new Date();

  // Format tanggal "Monday, 14 January"
  const fallbackDate = refDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const dateLabel = dateText ?? fallbackDate;

  // Tentukan siang/malam
  const hour = refDate.getHours();
  const isNight = hour >= 18 || hour < 6;

  // HH:MM
  const hh = String(hour).padStart(2, "0");
  const mm = String(refDate.getMinutes()).padStart(2, "0");
  const timeHM = `${hh}:${mm}`;

  // Gradient latar
  const containerGradient = isNight
    ? "bg-gradient-to-bl from-[#000000] to-[#272727]"
    : "bg-gradient-to-bl from-[#164A7B] to-[#539DB8]";

  // Warna dekorasi
  const circleAColor = isNight ? "bg-[#656565]/[0.22]" : "bg-[#50D0F4]/[0.22]";
  const circleBColor = isNight ? "bg-[#656565]/[0.13]" : "bg-[#50D0F4]/[0.13]";
  const circleCColor = isNight ? "bg-[#656565]/[0.39]" : "bg-[#50D0F4]/[0.39]";
  const circleDColor = isNight ? "bg-[#656565]/[0.67]" : "bg-[#50D0F4]/[0.67]";
  const circleEGradient = "bg-gradient-to-b from-[#FFE478] to-[#DFA62B]";
  const montserrat = { fontFamily: '"Montserrat", sans-serif' };

  useEffect(() => {
    let active = true;
    const abort = new AbortController();

    const safeSetCity = (val) => {
      if (active) setCity(val);
    };

    const getCityFromCoords = async (lat, lon) => {
      try {
        // pakai backticks + encode
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
        const res = await fetch(url, {
          signal: abort.signal,
          headers: {
            // sebagian server suka minta header ini; aman diabaikan jika ditolak
            "Accept-Language": "en",
            // Note: User-Agent tak bisa diubah di browser
          },
        });
        const data = await res.json();
        const cityName =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          data?.address?.state ||
          "Unknown location";
        safeSetCity(cityName);
      } catch {
        safeSetCity("Gradia");
      }
    };

    const getCityFromIP = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: abort.signal });
        const data = await res.json();
        safeSetCity(data?.city || data?.region || "Unknown");
      } catch {
        safeSetCity("Unknown");
      }
    };

    // SSR/Non-browser guard
    if (typeof window === "undefined") {
      safeSetCity("Unknown");
      return () => {
        active = false;
        abort.abort();
      };
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // jika user blokir/ gagal → fallback IP
          getCityFromIP();
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 5 * 60 * 1000, // cache posisi 5 menit
        }
      );
    } else {
      // perangkat tidak support geolocation → fallback IP
      getCityFromIP();
    }

    return () => {
      active = false;
      abort.abort();
    };
  }, []);

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

      {/* ===== Konten ===== */}
      <div className="absolute" style={{ left: 347.5, top: 56.5, width: 200, height: 48 }}>
        <div
          className="h-full flex flex-col justify-center"
          style={{
            ...montserrat,
            fontSize: 16,
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

      {/* Elemen besar 32px: selalu JAM (baik siang maupun malam) */}
      <div
        className="absolute flex items-center tabular-nums"
        style={{
          left: 235.5,
          top: 61,
          width: 754 - 235.5 - 416.5,
          height: 161 - 61 - 61,
          ...montserrat,
          fontSize: 32,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {timeHM}
      </div>
    </div>
  );
}
