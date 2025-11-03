import React from "react";

export default function TaskSummary({
  completed = 24,
  pending = 2,
  inProgress = 8,
}) {
  const cards = [
    { label: "Tasks Pending", value: pending, width: 231, high: 177 },
    { label: "Tasks On Progress", value: inProgress, width: 251, high: 177 },
    { label: "Tasks Completed", value: completed, width: 231, high: 177 },
  ];

  return (
    <div className="flex justify-start gap-4 flex-wrap">
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            width: `${card.width}px`,
            height: "161px",
            fontFamily: "Montserrat, sans-serif",
            borderColor: "rgba(70,70,70,0.5)",
            backgroundImage: "linear-gradient(to bottom, #070707, #141414)",
          }}
          className="rounded-2xl border bg-clip-padding"
        >
          <div className="h-full p-5 flex flex-col items-start text-left">
            <p className="text-white text-[20px] leading-none font-semibold">
              {card.label}
            </p>
            <span className="mt-4 text-[#FFEB3B] text-[64px] leading-none font-bold">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
