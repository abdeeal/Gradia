import React, { useEffect, useState } from "react";

const MIN_SKELETON_MS = 6000; // minimal waktu skeleton

export default function WeatherCard({ dateText, now }) {
  const [city, setCity] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  // ================== WAKTU (update tiap detik) ==================
  const [timeHM, setTimeHM] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const current = new Date();

      // kalau prop now dikirim, pakai itu, kalau tidak pakai current
      const base = now ? new Date(now) : current;

      const formattedTime = base
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(":", " : ");

      const formattedDate =
        dateText ?? 
        base.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

      setTimeHM(formattedTime);
      setDateLabel(formattedDate);
    };

    updateTime(); // set awal
    const id = setInterval(updateTime, 1000); // update tiap detik
    return () => clearInterval(id);
  }, [dateText, now]);

  // untuk tema siang/malam
  const refDate = now ? new Date(now) : new Date();
  const hour = refDate.getHours();
  const isNight = hour >= 18 || hour < 6;

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

  // ================== LOKASI (SAMA PERSIS SEPERTI MOBILE) ==================
  useEffect(() => {
    let active = true;
    const startTime = Date.now();

    const safeSetCity = (val) => {
      if (active) setCity(val);
    };
    const safeSetLoading = (val) => {
      if (active) setLoading(val);
    };

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const done = () => safeSetLoading(false);
      if (elapsed < MIN_SKELETON_MS) {
        setTimeout(done, MIN_SKELETON_MS - elapsed);
      } else {
        done();
      }
    };

    const getCityFromCoords = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const cityName =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "Unknown location";
        safeSetCity(cityName);
      } catch {
        // sama seperti Mobile: fallback ke "Gradia"
        safeSetCity("Gradia");
      } finally {
        finishLoading();
      }
    };

    const getCityFromIP = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        safeSetCity(data.city || data.region || "Unknown");
      } catch {
        safeSetCity("Unknown");
      } finally {
        finishLoading();
      }
    };

    if (typeof window === "undefined") {
      safeSetCity("Unknown");
      finishLoading();
      return () => {
        active = false;
      };
    }

    safeSetLoading(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // fallback ke IP sama persis seperti di Mobile
          getCityFromIP();
        }
      );
    } else {
      // kalau geolocation nggak ada, langsung ke IP
      getCityFromIP();
    }

    return () => {
      active = false;
    };
  }, []);

  /* ================= LOADING: kartu kosong + shimmer ================= */
  if (loading) {
    return (
      <>
        <style>{`
          .gradia-shimmer {
            position: absolute;
            inset: 0;
            background-image: linear-gradient(
              90deg,
              rgba(15, 15, 15, 0) 0%,
              rgba(250, 250, 250, 0.25) 50%,
              rgba(15, 15, 15, 0) 100%
            );
            transform: translateX(-100%);
            animation: gradia-shimmer-move 1.2s infinite;
            background-size: 200% 100%;
            pointer-events: none;
            border-radius: 24px; /* rounded-3xl */
          }

          @keyframes gradia-shimmer-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div
          className={`relative overflow-hidden rounded-3xl shadow ${containerGradient} text-white`}
          role="status"
          aria-live="polite"
          aria-label="Loading weather..."
          style={{ width: 754, height: 161 }}
        >
          <div className="gradia-shimmer" />
        </div>
      </>
    );
  }

  /* ================= NORMAL STATE ================= */
  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow ${containerGradient} text-white`}
      style={{ width: 754, height: 161 }}
    >
      {/* Dekorasi */}
      <div
        className={`absolute rounded-full ${circleAColor}`}
        style={{ left: -109, top: 60, width: 218, height: 218 }}
      />
      <div
        className={`absolute rounded-full ${circleBColor}`}
        style={{ left: 560, top: -118, width: 326, height: 326 }}
      />
      <div
        className={`absolute rounded-full ${circleCColor}`}
        style={{ left: 607, top: -106, width: 265, height: 267 }}
      />
      <div
        className={`absolute rounded-full ${circleDColor}`}
        style={{ left: 643, top: -97, width: 218, height: 218 }}
      />
      <div
        className={`absolute rounded-full ${circleEGradient}`}
        style={{ left: 691, top: -27, width: 1100, height: 100 }}
      />

      {/* Konten kiri: tanggal + kota */}
      <div
        className="absolute"
        style={{ left: 347.5, top: 56.5, width: 210, height: 48 }}
      >
        <div
          className="h-full flex flex-col justify-center"
          style={{
            ...montserrat,
            fontSize: 15,
            lineHeight: 1.2,
            borderLeft: "1px solid #FAFAFA",
            paddingLeft: 8,
          }}
        >
          <div>{dateLabel}</div>
          <div style={{ marginTop: 8, opacity: 0.95 }}>{city}</div>
        </div>
      </div>

      {/* Jam besar */}
<div
  className="absolute flex items-center tabular-nums"
  style={{
    left: 235.5,
    top: 61,
    width: 774 - 240.5 - 405.5,
    height: 161 - 61 - 61,
    fontFamily: "Montserrat, ui-sans-serif",   // ← DITAMBAHKAN
    fontSize: 30,
    fontWeight: 600,
    lineHeight: 1,
  }}
>
  {timeHM}
</div>
    </div>
  );
}
