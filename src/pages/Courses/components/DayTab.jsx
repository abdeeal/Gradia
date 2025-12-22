import React from "react";

export const DayTab = ({ day, count }) => {
  return (
    <div className="bg-background-secondary pr-3 sticky left-0">
      <div className="h-full w-[61px] flex flex-col justify-between bg-background items-center p-3 rounded-[8px]">
        <p className="font-semibold">{day}</p>
        <div className="w-6 h-6 bg-drop-yellow rounded-full flex justify-center items-center">
          <p className="text-yellow">{count}</p>
        </div>
      </div>
    </div>
  );
};
