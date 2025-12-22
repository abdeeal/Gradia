import React from "react";
import PropTypes from "prop-types";

/* ===== Helpers ===== */

/**
 * fmtDate
 * Fungsi untuk memformat tanggal menjadi format:
 * "DD Mon YYYY" (contoh: 23 Dec 2025)
 * Digunakan untuk menampilkan deadline di UI TaskCard
 */
const fmtDate = (value) => {
  const d = new Date(value);
  // kalau value bukan tanggal valid, kembalikan value as-is
  if (Number.isNaN(d.getTime())) return value || "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * normStat
 * Fungsi untuk menormalkan teks status task
 * Tujuannya supaya status dari API / input user konsisten
 * Contoh:
 * - "inprogress" -> "In progress"
 * - default -> "Not started"
 */
const normStat = (value) => {
  const s = String(value || "").trim().toLowerCase();

  if (s === "in progress" || s === "inprogress") return "In progress";
  if (s === "not started" || s === "notstarted") return "Not started";
  if (s === "completed") return "Completed";
  if (s === "overdue") return "Overdue";

  // fallback default status
  return value || "Not started";
};

/**
 * badgeCls
 * Fungsi mapping warna badge berdasarkan type
 * Dipakai untuk:
 * - Priority badge
 * - Status badge
 * Return berupa object { bg, text }
 */
const badgeCls = (type) => {
  switch (type) {
    case "High":
    case "Overdue":
      return { bg: "bg-[#EF4444]/20", text: "text-[#F87171]" };
    case "Medium":
      return { bg: "bg-[#EAB308]/25", text: "text-[#FDE047]" };
    case "Not started":
      return { bg: "bg-[#6B7280]/20", text: "text-[#D4D4D8]" };
    case "In progress":
      return { bg: "bg-[#06B6D4]/20", text: "text-[#22D3EE]" };
    case "Completed":
      return { bg: "bg-[#22C55E]/20", text: "text-[#4ADE80]" };
    default:
      return { bg: "bg-[#6B7280]/20", text: "text-[#D4D4D8]" };
  }
};

/**
 * dotCls
 * Fungsi menentukan warna bulatan kecil
 * di sebelah kiri waktu (indikator status visual)
 */
const dotCls = (statusLabel) => {
  switch (statusLabel) {
    case "In progress":
      return "bg-[#22D3EE]";
    case "Completed":
      return "bg-[#4ADE80]";
    case "Overdue":
      return "bg-[#F87171]";
    default:
      return "bg-gray-400";
  }
};

/**
 * TaskCard
 * Komponen UI kartu task
 * Digunakan untuk menampilkan ringkasan task di list:
 * - waktu / deadline
 * - judul
 * - related course
 * - deskripsi
 * - priority & status
 */
const TaskCard = ({
  title,
  relatedCourse, // nama course yang ditampilkan di bawah judul
  description,   // deskripsi singkat task
  priority,
  status,
  deadline,
  time,
  onClick,       // handler saat card diklik
}) => {
  // normalisasi status supaya konsisten
  const statLabel = normStat(status);

  // ambil warna badge priority
  const prioColor = badgeCls(priority);

  // ambil warna badge status
  const statColor = badgeCls(statLabel);

  // ambil warna dot indikator waktu
  const circleColor = dotCls(statLabel);

  return (
    <div
      onClick={onClick}
      className="w-full cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl p-4 px-2.5 hover:border-purple-500 transition-all duration-200 font-[Montserrat] min-h-[187px] flex flex-col"
    >
      {/* === Frame 1: Waktu / Deadline === */}
      {/* Menampilkan tanggal & jam dengan indikator warna status */}
      <div className="relative pl-5 text-gray-200 mb-5">
        <span
          className={`w-[10px] h-[10px] rounded-full absolute left-0 top-1/2 -translate-y-1/2 ${circleColor}`}
        />
        <div className="flex items-center gap-1 text-foreground-secondary">
          {deadline && (
            <span className="text-[16px]">{fmtDate(deadline)}</span>
          )}
          {time && (
            <span className="text-[16px]">
              {deadline && "• "}
              {time}
            </span>
          )}
        </div>
      </div>

      {/* === Frame 2: Body === */}
      {/* Berisi judul, related course, dan deskripsi */}
      <div className="pl-0 pr-[8px] mb-6 w-[90%]">
        <h3 className="text-[#FAFAFA] text-[16px] font-semibold mb-[8px]">
          {title}
        </h3>

        {/* Related Course ditampilkan di bawah judul */}
        {relatedCourse && (
          <div className="text-[#A3A3A3] text-[16px] font-semibold leading-tight mb-[4px] line-clamp-1">
            {relatedCourse}
          </div>
        )}

        {/* Deskripsi task (dibatasi 1 baris) */}
        {description && (
          <p
            className="text-[#A3A3A3] text-[16px] font-normal"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={description}
          >
            {description}
          </p>
        )}
      </div>

      {/* === Frame 3: Badge Priority & Status === */}
      {/* Ditampilkan di bagian kiri bawah card */}
      <div className="flex items-center gap-[8px]">
        <span
          className={`text-[16px] xl:text-[14px] 2xl:text-[16px] px-[10px] py-[4px] rounded-md font-medium ${prioColor.bg} ${prioColor.text}`}
        >
          {priority}
        </span>
        <span
          className={`text-[16px] xl:text-[14px] 2xl:text-[16px] px-[10px] py-[4px] rounded-md font-medium ${statColor.bg} ${statColor.text}`}
        >
          {statLabel}
        </span>
      </div>
    </div>
  );
};

TaskCard.propTypes = {
  // masih boleh dikirim dari luar walaupun tidak dipakai di UI
  color: PropTypes.string,
  course: PropTypes.string,

  title: PropTypes.string,
  relatedCourse: PropTypes.string,
  description: PropTypes.string,
  priority: PropTypes.string,
  status: PropTypes.string,
  deadline: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
  time: PropTypes.string,
  onClick: PropTypes.func,
};

export default TaskCard;
