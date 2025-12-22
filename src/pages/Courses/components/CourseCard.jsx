import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import gsap from "gsap";

/**
 * CourseCard
 * - Komponen kartu untuk menampilkan 1 course di list/grid
 * - Bisa diklik (onClick) untuk membuka detail course
 * - Ada animasi fade-in saat pertama kali muncul
 * - Ada indikator warna (dot) untuk menandakan course sedang berlangsung atau tidak
 */
const CourseCard = ({ course, onClick }) => {
  /**
   * ref untuk mengakses DOM element card
   * dipakai oleh GSAP untuk animasi
   */
  const ref = useRef(null);

  /* ===== Fade-in animation ===== */
  /**
   * useEffect: animasi saat komponen pertama kali render (mount)
   * - dari opacity 0 + posisi turun sedikit (y: 15)
   * - menjadi opacity 1 + kembali ke posisi normal (y: 0)
   */
  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  /* ===== ONGOING checker ===== */
  /**
   * onNow (IIFE)
   * - Mengecek apakah course sedang berlangsung saat ini berdasarkan `course.time`
   * - Format time diasumsikan: "HH:MM - HH:MM"
   * - Return true jika sekarang berada di antara start dan end time
   */
  const onNow = (() => {
    const t = course?.time;
    if (!t) return false;

    // Ambil start & end dari string waktu "start - end"
    const [s, e] = t.split(" - ").map((v) => v.trim());
    if (!s || !e) return false;

    // Waktu sekarang
    const now = new Date();

    /**
     * toDate
     * - Mengubah "HH:MM" menjadi objek Date (hari ini) dengan jam & menit tersebut
     * - Detik diset 0 agar perbandingan lebih rapi
     */
    const toDate = (hm) => {
      const [h, m] = hm.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0);
      return d;
    };

    // true jika sekarang >= start dan sekarang < end
    return now >= toDate(s) && now < toDate(e);
  })();

  /* ===== Circle color ===== */
  /**
   * dot
   * - Warna indikator bulat di samping time
   * - Kuning jika course sedang berlangsung (onNow true)
   * - Merah jika tidak berlangsung
   */
  const dot = onNow ? "bg-[#FDE047]" : "bg-[#F87171]";

  /**
   * Render UI card
   * - Wrapper div bisa diklik
   * - Menampilkan: time + dot, title (dengan alias), room, dan lecturer
   */
  return (
    <div
      ref={ref}
      onClick={onClick}
      className="cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl px-3 py-4 hover:border-purple-500 transition-all duration-200 relative xl:text-[14px] 2xl:text-[16px]"
    >
      <div className="pr-8">
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
        <div className="flex flex-col gap-px text-gray-400">
          <p className="flex items-center mb-1 font-semibold">
            <i className="ri-building-line text-icon mr-1" />
            {course.room}
          </p>
          <p className="flex items-center line-clamp-1">
            <i className="ri-graduation-cap-line text-icon mr-1" />
            <span className="line-clamp-1">{course.lecturer}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ===== PropTypes (buat eslint) ===== */
/**
 * PropTypes CourseCard
 * - course wajib ada dan berbentuk object dengan field yang dipakai pada UI
 * - onClick opsional: fungsi yang dipanggil saat card diklik
 */
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
