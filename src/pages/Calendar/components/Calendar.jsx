import Card from "@/pages/Calendar/components/Card";
import React, { useState, useEffect } from "react";

const Calendar = ({ searchTerm }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  const idWorkspace = sessionStorage.getItem("id_workspace");

  const BADGE_COLORS = {
    Blue: "#60a5fa",
    Green: "#4ade80",
    Purple: "#c084fc",
    Orange: "#fb923c",
    Yellow: "#fde047",
    Red: "#f87171",
    Cyan: "#22d3ee",
    Pink: "#f472b6",
    Gray: "#d4d4d8",
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?idWorkspace=${idWorkspace}`);
      const data = await response.json();
      const coloredTasks = data.map((task) => ({
        ...task,
        color: getBadgeColor(task),
      }));
      setTasks(coloredTasks);
    } catch (error) {
      console.log(error);
    }
  };

  const getBadgeColor = (task) => {
    const st = task.status?.toLowerCase();
    const pr = task.priority?.toLowerCase();
    const isOverdue = new Date(task.deadline) < new Date();

    if (st === "completed" || st === "done" || st === "selesai")
      return BADGE_COLORS.Green;

    if (pr === "high") {
      if (st === "in progress" || st === "ongoing" || st === "progress")
        return BADGE_COLORS.Purple;
      if (st === "not started" || st === "todo" || st === "backlog")
        return BADGE_COLORS.Pink;
      if (isOverdue) return BADGE_COLORS.Red;
    }

    if (pr === "medium") {
      if (st === "in progress" || st === "ongoing" || st === "progress")
        return BADGE_COLORS.Blue;
      if (st === "not started" || st === "todo" || st === "backlog")
        return BADGE_COLORS.Yellow;
      if (isOverdue) return BADGE_COLORS.Orange;
    }

    if (pr === "low") {
      if (st === "in progress" || st === "ongoing" || st === "progress")
        return BADGE_COLORS.Cyan;
      if (st === "not started" || st === "todo" || st === "backlog")
        return BADGE_COLORS.Gray;
    }

    return BADGE_COLORS.Gray;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Senin = 0
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTasksForDate = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return tasks.filter((task) => task.deadline?.split("T")[0] === dateStr);
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);

  const prevMonthDays = startingDayOfWeek;
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const shortMonthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const today = new Date();

  // === Task yang sesuai tanggal dipilih + filter pencarian ===
  const selectedDayTasks = getTasksForDate(selectedDate).filter((task) =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Kalender */}
      <div className="flex gap-4 bg-black w-full border border-border/50 rounded-[12px]">
        <div className="pt-3 w-full rounded-[12px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 px-4">
            <div className="flex items-center gap-2">
              <div className="w-[64px] h-[64px] text-white rounded-md px-1 py-2 text-center border border-border/50 flex flex-col gap-1">
                <div className="text-foreground-secondary font-semibold text-[14px]">
                  {shortMonthNames[month]}
                </div>
                <div className="font-semibold bg-[#643EB2] rounded-[4px]">
                  {today.getDate()}
                </div>
              </div>

              <div className="h-[64px] flex flex-col justify-between py-3 md:ml-3">
                <div className="text-[#FFEB3B] font-medium">
                  {monthNames[month]} {year}
                </div>
                <div className="text-zinc-500">
                  1 {monthNames[month]} - {daysInMonth} {monthNames[month]}
                </div>
              </div>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 mt-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-foreground border border-border/50 text-center py-2 font-semibold"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Previous month days */}
            {Array.from({ length: prevMonthDays }).map((_, i) => {
              const day = prevMonthLastDay - prevMonthDays + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-[64px] w-full flex flex-col px-1 py-1 text-foreground-secondary text-[14px] border border-border/50 bg-[#242424] font-semibold"
                >
                  {day}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;

              // ✅ Filter task berdasarkan tanggal & search
              const dayTasks = getTasksForDate(day).filter((task) =>
                task.title?.toLowerCase().includes(searchTerm.toLowerCase())
              );

              const isSelected = day === selectedDate;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`h-[64px] w-full flex flex-col p-1 cursor-pointer relative border border-border/50 font-semibold text-[14px]
      ${isToday ? "border-[#FFEB3B] !text-black" : ""} ${
                    isSelected
                      ? "ring-1 ring-border font-semibold z-10"
                      : "text-foreground-secondary hover:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`${
                      isToday ? "px-1 rounded-full bg-[#FFEB3B] w-fit" : ""
                    }`}
                  >
                    {day}
                  </span>

                  {/* ✅ titik penanda task mengikuti hasil pencarian */}
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayTasks.slice(0, 3).map((task, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-[6px] rounded-full border border-border/50"
                          style={{ backgroundColor: task.color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Next month days */}
            {Array.from({
              length: (7 - ((prevMonthDays + daysInMonth) % 7)) % 7,
            }).map((_, i) => {
              const day = i + 1;
              return (
                <div
                  key={`next-${i}`}
                  className="h-[64px] w-full flex flex-col text-[14px] p-1 text-foreground-secondary bg-[#242424] border border-border/50 font-semibold"
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="w-full flex justify-between mt-2">
        <button onClick={() => changeMonth(-1)} id="prevMonth">
          <i className="ri-arrow-left-s-line text-[20px]"></i>
        </button>
        <p>
          {monthNames[month]} {year}
        </p>
        <button onClick={() => changeMonth(1)} id="nextMonth">
          <i className="ri-arrow-right-s-line text-[20px]"></i>
        </button>
      </div>

      {/* === Penjelasan task untuk tanggal yang dipilih === */}
      <div className="w-full flex flex-col gap-3 mb-6">
        <div className="flex flex-col">
          <p className="font-semibold text-[20px]">
            Event for {selectedDate}. {monthNames[month]}
          </p>
          <p className="text-[14px] text-foreground-secondary">
            {selectedDayTasks.length > 0
              ? "Don't miss scheduled events"
              : "No events for this date"}
          </p>
        </div>

        {/* List task */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {selectedDayTasks.length > 0 ? (
            selectedDayTasks.map((task, idx) => (
              <Card
                key={idx}
                date={task.deadline?.split("T")[0]}
                time={new Date(task.deadline).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                course={task.course?.name || "No Course"}
                desc={task.description || "No Description"}
                priority={task.priority}
                status={task.status}
                color={task.color}
                title={task.title}
              />
            ))
          ) : (
            <div className="bg-gradient-to-t from-[#141414] to-[#070707] rounded-[8px] px-2 py-5 flex flex-col gap-2 font-normal border border-border/50 h-[178px] items-center justify-center text-foreground-secondary md:col-span-2">
              <p>No tasks scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Calendar;
