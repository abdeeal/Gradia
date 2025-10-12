import React, { useEffect, useMemo, useRef, useState } from "react";

const PresenceCard = ({ courses = [], onOpenPopup }) => {
  // Tampilkan hanya 3 card
  const visibleCourses = useMemo(() => courses.slice(0, 3), [courses]);

  // Tinggi dinamis berdasarkan card tertinggi
  const cardsWrapRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(0);

  useEffect(() => {
    if (!cardsWrapRef.current) return;

    const measure = () => {
      const cards = cardsWrapRef.current.querySelectorAll(".presence-card");
      let maxH = 0;
      cards.forEach((el) => {
        const h = el.offsetHeight || 0;
        if (h > maxH) maxH = h;
      });
      setCardHeight(maxH);
    };

    // ukur awal
    measure();

    // observe perubahan ukuran
    const ro = new ResizeObserver(measure);
    ro.observe(cardsWrapRef.current);
    // observe masing-masing card juga (kalau konten berubah)
    cardsWrapRef.current
      .querySelectorAll(".presence-card")
      .forEach((el) => ro.observe(el));

    // re-measure bila window resize
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [visibleCourses]);

  return (
    <div className="font-[Montserrat]">
      <div className="flex gap-4">
        {/* Kartu-kartu: grid 3 kolom */}
        <div ref={cardsWrapRef} className="grid grid-cols-3 gap-4 flex-1">
          {visibleCourses.map((c) => {
            const isOngoing = c.status === "On Going";
            const circleColor = isOngoing ? "bg-yellow-400" : "bg-gray-500";

            return (
              <div
                key={c.id}
                className="presence-card bg-[#1c1c1c] rounded-xl border border-[#2c2c2c] flex flex-col h-full px-3.5 py-3"
              >
                {/* TOP: waktu + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${circleColor}`} />
                    <p className="text-[11px] text-gray-300">{c.time}</p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-[2px] rounded-md ${
                      isOngoing
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-zinc-700/30 text-zinc-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                {/* MIDDLE: judul + rek — TENGAH secara vertikal */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-[13px] font-semibold leading-snug text-white line-clamp-2 break-words">
                    {c.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Rek - {c.rek}
                  </p>
                </div>

                {/* BOTTOM: tombol */}
                <button
                  onClick={() => onOpenPopup?.(c)}
                  className="bg-gradient-to-l from-[#28073B] to-[#34146C] hover:opacity-90 transition-all px-3 py-1.5 rounded-md text-[11px] flex items-center gap-1 self-start mt-2"
                >
                  Log Presence
                  <i className="ri-logout-circle-r-line text-sm ml-1" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Garis vertikal + Total Presence — tinggi mengikuti kartu */}
        <div className="ml-4 flex items-start gap-4">
          {/* Garis vertikal mengikuti tinggi */}
          <div
            className="w-px bg-[#2c2c2c] transition-[height] duration-200"
            style={{ height: cardHeight ? `${cardHeight}px` : "0px" }}
          />

          <div
            className="w-[160px] flex flex-col items-center text-center transition-[height] duration-200"
            style={{ height: cardHeight ? `${cardHeight}px` : "auto" }}
          >
            <h4 className="text-[15px] font-semibold text-white mt-1 mb-6">
              Total Presence
            </h4>

            <div className="flex flex-col items-center mb-5">
              <div className="bg-[#22C55E]/20 text-[#4ADE80] text-[13px] font-semibold px-3 py-1 rounded-md mb-1">
                20
              </div>
              <span className="text-[12px] text-gray-300">Presence</span>
            </div>

            <div className="flex flex-col items-center mt-auto">
              <div className="bg-[#EF4444]/20 text-[#F87171] text-[13px] font-semibold px-3 py-1 rounded-md mb-1">
                2
              </div>
              <span className="text-[12px] text-gray-300">Absent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresenceCard;
