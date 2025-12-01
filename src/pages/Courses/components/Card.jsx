import { Link } from "react-router-dom";
import React from "react";

export const CourseCard = ({
  start,
  end,
  title,
  alias,
  room,
  lecturer,
  sks,
  setDrawer,
  idCourse,
}) => {
  const dotColor = sks == 3 ? "bg-red" : sks == 2 ? "bg-yellow" : "bg-blue";

  const openDrawer = () => {
    setDrawer(true);
  };

  return (
    <Link
      to={`/courses?c=${idCourse}`}
      onClick={openDrawer}
      className="md:w-[251px] 2xl:w-[344px] h-full bg-background rounded-[8px] p-3 group focus-within:border focus-within:border-border"
    >
      <div className="flex flex-col justify-between md:gap-2 gap-4 2xl:gap-6 md:w-full w-[90%]">
        <div className="flex gap-[10px] items-center">
          <div className={`w-3 h-3 2xl:w-4 2xl:h-4 rounded-full ${dotColor}`}></div>
          <p className="text-foreground-secondary 2xl:text-[20px]">
            {start} - {end}
          </p>
        </div>
        <p className="font-semibold text-start line-clamp-2 2xl:text-[20px]">
          {title} <span className="uppercase">({alias})</span>
        </p>
        <div className="flex flex-col gap-1 text-foreground-secondary text-start">
          <div className="flex gap-[10px] 2xl:gap-[12px]">
            <i className="ri-building-line text-icon 2xl:text-[20px]"></i>
            <p className="font-semibold line-clamp-1 2xl:text-[20px] uppercase">{room}</p>
          </div>
          <div className="flex gap-[10px] 2xl:gap-[12px]">
            <i className="ri-graduation-cap-line text-icon 2xl:text-[20px]"></i>
            <p className="line-clamp-1 2xl:text-[20px]">{lecturer}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;