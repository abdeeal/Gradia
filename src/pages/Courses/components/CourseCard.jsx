import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import gsap from "gsap";

const CourseCard = ({ course, onClick }) => {
  const ref = useRef(null);

  /* ===== Fade-in animation ===== */
  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  /* ===== ONGOING checker ===== */
  const onNow = (() => {
    const t = course?.time;
    if (!t) return false;

    const [s, e] = t.split(" - ").map((v) => v.trim());
    if (!s || !e) return false;

    const now = new Date();

    const toDate = (hm) => {
      const [h, m] = hm.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0);
      return d;
    };

    return now >= toDate(s) && now < toDate(e);
  })();

  /* ===== Circle color ===== */
  const dot = onNow ? "bg-[#FDE047]" : "bg-[#F87171]";

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl px-[12px] py-4 hover:border-purple-500 transition-all duration-200 relative"
    >
      <div className="pr-[32px]">
        {/* Time + Circle */}
        <div className="flex items-center text-gray-400 mb-3">
          <span className={`w-2.5 h-2.5 rounded-full mr-2 ${dot}`} />
          {course.time}
        </div>

        {/* Title */}
        <h4 className="text-white font-semibold leading-snug mb-3">
          {course.title} <span className="uppercase">({course.alias})</span>
        </h4>

        {/* Room & Lecturer */}
        <div className="flex flex-col gap-[1px] text-gray-400">
          <p className="flex items-center mb-1 font-semibold">
            <i className="ri-building-line text-[#643EB2] mr-1" />
            {course.room}
          </p>
          <p className="flex items-center line-clamp-1">
            <i className="ri-graduation-cap-line text-[#643EB2] mr-1" />
            <span className="line-clamp-1">{course.lecturer}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ===== PropTypes (buat eslint) ===== */
CourseCard.propTypes = {
  course: PropTypes.shape({
    time: PropTypes.string,
    title: PropTypes.string,
    alias: PropTypes.string,
    room: PropTypes.string,
    lecturer: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
};

export default CourseCard;
