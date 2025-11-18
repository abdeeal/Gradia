import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const CourseCard = ({ course, onClick }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  /* ===== Determine ONGOING status ===== */
  const isOnGoing = (() => {
    if (!course?.time) return false;

    const [startStr, endStr] = course.time.split(" - ").map((s) => s.trim());
    if (!startStr || !endStr) return false;

    const now = new Date();

    const parseHM = (hm) => {
      const [h, m] = hm.split(":").map(Number);
      const d = new Date();
      d.setHours(h);
      d.setMinutes(m);
      d.setSeconds(0);
      return d;
    };

    const start = parseHM(startStr);
    const end = parseHM(endStr);

    return now >= start && now < end;
  })();

  /* ===== Circle color ===== */
  const circleColor = isOnGoing ? "bg-[#FDE047]" : "bg-[#F87171]";

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl px-[12px] py-4 hover:border-purple-500 transition-all duration-200 relative"
    >
      <div className="pr-[32px]">
        {/* Waktu + Lingkaran */}
        <div className="flex items-center text-gray-400 mb-3">
          <span className={`w-2.5 h-2.5 rounded-full mr-2 ${circleColor}`}></span>
          {course.time}
        </div>

        {/* Judul */}
        <h4 className="text-white font-semibold leading-snug mb-3">
          {course.title} <span className="uppercase">({course.alias})</span>
        </h4>

        {/* Ruangan & Dosen */}
        <div className="flex flex-col gap-[1px] text-gray-400">
          <p className="flex items-center mb-1 font-semibold">
            <i className="ri-building-line text-[#643EB2] mr-1 "></i>
            {course.room}
          </p>
          <p className="flex items-center line-clamp-1">
            <i className="ri-graduation-cap-line text-[#643EB2] mr-1 "></i>
            <span className="line-clamp-1">{course.lecturer}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
