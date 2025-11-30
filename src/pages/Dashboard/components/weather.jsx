import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const MIN_SKEL_MS = 6000;

function WeatherCard({ dateText, now }) {
  const [city, setCity] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  const [timeHM, setTimeHM] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const cur = new Date();
      const base = now ? new Date(now) : cur;

      const t = base
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(":", " : ");

      const d =
        dateText ??
        base.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

      setTimeHM(t);
      setDateLabel(d);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateText, now]);

  const refDate = now ? new Date(now) : new Date();
  const hour = refDate.getHours();
  const isNight = hour >= 18 || hour < 6;

  const bgClass = isNight
    ? "bg-gradient-to-bl from-[#000000] to-[#272727]"
    : "bg-gradient-to-bl from-[#164A7B] to-[#539DB8]";

  const circleA = isNight ? "bg-[#656565]/[0.22]" : "bg-[#50D0F4]/[0.22]";
  const circleB = isNight ? "bg-[#656565]/[0.13]" : "bg-[#50D0F4]/[0.13]";
  const circleC = isNight ? "bg-[#656565]/[0.39]" : "bg-[#50D0F4]/[0.39]";
  const circleD = isNight ? "bg-[#656565]/[0.67]" : "bg-[#50D0F4]/[0.67]";
  const circleE = "bg-gradient-to-b from-[#FFE478] to-[#DFA62B]";
  const mono = { fontFamily: '"Montserrat", sans-serif' };

  useEffect(() => {
    let active = true;
    const start = Date.now();

    const safeSetCity = (v) => {
      if (active) setCity(v);
    };
    const safeSetLoad = (v) => {
      if (active) setLoading(v);
    };

    const doneLoad = () => {
      const elapsed = Date.now() - start;
      const stop = () => safeSetLoad(false);

      if (elapsed < MIN_SKEL_MS) {
        setTimeout(stop, MIN_SKEL_MS - elapsed);
      } else {
        stop();
      }
    };

    const fromCoords = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const nm =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "Unknown location";
        safeSetCity(nm);
      } catch {
        safeSetCity("Gradia");
      } finally {
        doneLoad();
      }
    };

    const fromIp = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        safeSetCity(data.city || data.region || "Unknown");
      } catch {
        safeSetCity("Unknown");
      } finally {
        doneLoad();
      }
    };

    if (typeof window === "undefined") {
      safeSetCity("Unknown");
      doneLoad();
      return () => {
        active = false;
      };
    }

    safeSetLoad(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fromCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fromIp();
        }
      );
    } else {
      fromIp();
    }

    return () => {
      active = false;
    };
  }, []);

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
            border-radius: 24px;
          }

          @keyframes gradia-shimmer-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div
          className={`relative overflow-hidden rounded-3xl shadow ${bgClass} text-white`}
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

  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow ${bgClass} text-white`}
      style={{ width: 754, height: 161 }}
    >
      <div
        className={`absolute rounded-full ${circleA}`}
        style={{ left: -109, top: 60, width: 218, height: 218 }}
      />
      <div
        className={`absolute rounded-full ${circleB}`}
        style={{ left: 560, top: -118, width: 326, height: 326 }}
      />
      <div
        className={`absolute rounded-full ${circleC}`}
        style={{ left: 607, top: -106, width: 265, height: 267 }}
      />
      <div
        className={`absolute rounded-full ${circleD}`}
        style={{ left: 643, top: -97, width: 218, height: 218 }}
      />
      <div
        className={`absolute rounded-full ${circleE}`}
        style={{ left: 691, top: -27, width: 1100, height: 100 }}
      />

      <div
        className="absolute"
        style={{ left: 347.5, top: 56.5, width: 210, height: 48 }}
      >
        <div
          className="h-full flex flex-col justify-center"
          style={{
            ...mono,
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

      <div
        className="absolute flex items-center tabular-nums"
        style={{
          left: 235.5,
          top: 61,
          width: 774 - 240.5 - 405.5,
          height: 161 - 61 - 61,
          fontFamily: "Montserrat, ui-sans-serif",
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

WeatherCard.propTypes = {
  dateText: PropTypes.string,
  now: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
};

export default WeatherCard;
