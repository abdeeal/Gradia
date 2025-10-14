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

  const circleColor =
    course.title.includes("Tata Tulis Ilmiah") ||
    course.alias.toLowerCase() === "tatul"
      ? "bg-[#FDE047]"
      : "bg-[#F87171]";

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl p-3 hover:border-purple-500 transition-all duration-200 relative"
    >
      {/* Waktu + Lingkaran */}
      <div className="flex items-center text-[13px] text-gray-400 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full mr-2 ${circleColor}`}></span>
        {course.time}
      </div>

      {/* Judul */}
      <h4 className="text-white font-semibold text-[14px] leading-snug mb-1">
        {course.title}
      </h4>

      {/* Ruangan & Dosen */}
      <div className="flex flex-col gap-[1px] text-gray-400">
        <p className="text-[11.5px] flex items-center">
          <i className="ri-building-line text-purple-400 mr-1 text-[14px]"></i>
          {course.room}
        </p>
        <p className="text-[11.5px] flex items-center">
          <i className="ri-graduation-cap-line text-purple-400 mr-1 text-[14px]"></i>
          {course.lecturer}
        </p>
      </div>
    </div>
  );
};

export default CourseCard;