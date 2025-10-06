import React from "react";

const DayMob = ({day, count}) => {
  return (
    <div className="w-full px-3 flex justify-between bg-black h-16 items-center rounded-[8px]">
      <p className="font-semibold">{day}</p>
      <div className="w-6 h-6 bg-drop-yellow rounded-full flex justify-center items-center">
        <p className="text-yellow">{count}</p>
      </div>
    </div>
  );
};

export default DayMob;
