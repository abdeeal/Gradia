import Badges from "@/components/Bagdes";
import React from "react";

const Card = ({ date, time, title, course, desc, priority, status, onClick }) => {
  return (
    <div onClick={onClick} className="bg-background rounded-[8px] px-2 py-5 flex flex-col gap-5 font-normal border border-border/50">
      <div className="flex gap-2.5 items-center">
        <div
          className={`w-[12px] h-[12px] rounded-full ${
            status == "Not started"
              ? "bg-gray"
              : status == "In progress"
              ? "bg-cyan"
              : status == "Completed"
              ? "bg-green"
              : "bg-red"
          }`}
        />
        <p className="text-foreground-secondary font-light">
          {date}, {time}
        </p>
      </div>
      <div className="flex flex-col w-[90%]">
        <p className="font-semibold mb-2">{title}</p>
        <p className="font-semibold text-foreground-secondary mb-1 line-clamp-1">
          {course}
        </p>
        <p className="line-clamp-1 text-foreground-secondary font-light">
          {desc}
        </p>
      </div>
      <div className="flex gap-2">
        <Badges
          title={priority}
          color={
            priority == "High"
              ? "red"
              : priority == "Medium"
              ? "yellow"
              : "cyan"
          }
        />
        <Badges
          title={status}
          color={
            status.toLowerCase() === "not started"
              ? "gray"
              : status.toLowerCase() === "in progress"
              ? "cyan"
              : status.toLowerCase() === "completed"
              ? "green"
              : "red"
          }
        />
      </div>
    </div>
  );
};

export default Card;
