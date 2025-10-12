import React from "react";

const TaskCard = ({
  color,
  title,
  subtitle,
  priority,
  status,
  deadline,
  time,
  onClick,
}) => {
  // Format tanggal deadline ke bentuk "12 Oct 2025"
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  // Format jam
  const formattedTime = time.includes("-") ? time.split("-")[1].trim() : time;

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
      className="w-full cursor-pointer bg-[#000000] border border-[#464646]/50 rounded-xl p-[12px] hover:border-purple-500 transition-all duration-200 font-[Montserrat]"
    >
      {/* Baris atas: lingkaran + tanggal */}
      <div className="flex items-center gap-[6px] mb-[10px] pl-[14px] text-[10px] text-gray-400 relative">
        <span
          className={`w-2 h-2 rounded-full absolute left-0 top-1/2 -translate-y-1/2 ${circleColor}`}
        ></span>

        <span className="pl-[6px] whitespace-nowrap">
          {formatDate(deadline)}, {formattedTime}
        </span>
      </div>

      {/* Judul dan subjudul */}
      <div className="pl-[14px] mb-[10px]">
        <h3 className="font-semibold text-white text-[13px] leading-snug mb-[2px]">
          {title}
        </h3>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>

      {/* Baris bawah: Priority & Status sejajar horizontal */}
      <div className="flex justify-between items-center px-[8px] mt-[4px]">
        <span
          className={`text-[10.5px] px-[7px] py-[2px] rounded-md font-medium ${priorityColor.bg} ${priorityColor.text}`}
        >
          {priority}
        </span>
        <span
          className={`text-[10.5px] px-[7px] py-[2px] rounded-md font-medium ${statusColor.bg} ${statusColor.text}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
