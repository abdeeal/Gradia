import React from "react";

const CourseCard = ({ start, end, title, alias, room, lecturer, sks }) => {
  const dotColor = sks == 3 ? "bg-red" : sks == 2 ? "bg-yellow" : "bg-blue";

  return (
    <div
      className="bg-background-secondary rounded-[8px] p-3 group focus-within:border focus-within:border-border flex-shrink-0 w-full md:w-[250px]"
    >
      <div className="flex flex-col justify-between gap-3 w-full">
        <div className="flex gap-[10px] items-center">
          <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
          <p className="text-foreground-secondary">
            {start} - {end}
          </p>
        </div>

        <p className="font-semibold text-start line-clamp-2">
          {title} <span className="uppercase">({alias})</span>
        </p>

        <div className="flex flex-col gap-1 text-foreground-secondary text-start">
          <div className="flex gap-[10px]">
            <i className="ri-building-line text-icon"></i>
            <p className="font-semibold line-clamp-1 uppercase">{room}</p>
          </div>
          <div className="flex gap-[10px]">
            <i className="ri-graduation-cap-line text-icon"></i>
            <p className="line-clamp-1">{lecturer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
