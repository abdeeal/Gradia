import React from "react";

const TaskCard = ({
  color,
  title,
  course,        // nama mata kuliah
  relatedCourse, // course tambahan di antara judul & deskripsi
  description,   // deskripsi tugas
  priority,
  status,
  deadline,
  time,
  onClick,
}) => {
  // Format tanggal
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr || "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Warna badge
  const getColors = (type) => {
    switch (type) {
      case "High":
      case "Overdue":
        return { bg: "bg-[#EF4444]/20", text: "text-[#F87171]" };
      case "Medium":
        return { bg: "bg-[#EAB308]/25", text: "text-[#FDE047]" };
      case "Not started":
        return { bg: "bg-[#6B7280]/20", text: "text-[#D4D4D8]" };
      case "In Progress":
        return { bg: "bg-[#06B6D4]/20", text: "text-[#22D3EE]" };
      case "Completed":
        return { bg: "bg-[#22C55E]/20", text: "text-[#4ADE80]" };
      default:
        return { bg: "bg-[#6B7280]/20", text: "text-[#D4D4D8]" };
    }
  };

  const priorityColor = getColors(priority);
  const statusColor = getColors(status);

  const circleColor =
    status === "In Progress"
      ? "bg-[#22D3EE]"
      : status === "Completed"
      ? "bg-[#4ADE80]"
      : status === "Overdue"
      ? "bg-[#F87171]"
      : "bg-gray-400";

  return (
    <div
      onClick={onClick}
      className="w-full cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl p-4 px-2.5 hover:border-purple-500 transition-all duration-200 font-[Montserrat] min-h-[187px] flex flex-col justify-between"
    >
      {/* === Frame 1: Waktu === */}
      <div className="relative pl-5 text-gray-200 ">
        <span
          className={`w-[10px] h-[10px] rounded-full absolute left-0 top-1/2 -translate-y-1/2 ${circleColor}`}
        />
        <div className="flex items-center gap-1 text-foreground-secondary">
          {deadline && (
            <span className="text-[14px]">
              {formatDate(deadline)}
            </span>
          )}
          {time && (
            <span className="">
              {deadline ? "• " : "text-[14px]"}
              {time}
            </span>
          )}
        </div>
      </div>

      {/* === Frame 2: Body (judul, related course, deskripsi) === */}
      <div className="pl-0 pr-[8px]">
        <h3 className="text-[#FAFAFA] text-[15px] font-semibold mb-[12px]">
          {title}
        </h3>

        {/* Related Course di antara judul & deskripsi */}
        {relatedCourse && (
          <div className="text-[#A3A3A3] text-[13px] font-semibold leading-tight mb-[4px]">
            {relatedCourse}
          </div>
        )}

        {description && (
          <p
            className="text-[#A3A3A3] text-[13px] font-normal"
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

      {/* === Frame 3: Keterangan (Priority & Progress kiri bawah) === */}
      <div className="flex items-center gap-[8px]">
        <span
          className={`text-[12px] px-[10px] py-[4px] rounded-md font-medium ${priorityColor.bg} ${priorityColor.text}`}
        >
          {priority}
        </span>
        <span
          className={`text-[12px] px-[10px] py-[4px] rounded-md font-medium ${statusColor.bg} ${statusColor.text}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
