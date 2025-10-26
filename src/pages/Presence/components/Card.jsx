import { Button } from "@/components/Button";
import React from "react";

const Card = ({ sks, start, end, title, room, className, btn = true }) => {
  let dotColor;
  if (sks == "3") {
    dotColor = "bg-red";
  } else if (sks == "2") {
    dotColor = "bg-yellow";
  } else {
    dotColor = "bg-cyan";
  }

  return (
    <div
      className={`bg-gradient-to-t from-[#141414] to-[#070707] rounded-[8px] p-3 group focus-within:border focus-within:border-border border border-[#464646]/50 ${className} flex flex-col justify-between`}
    >
      <div className="flex flex-col justify-between md:gap-2 gap-4 md:w-full w-[90%]">
        <div className="flex gap-[10px] items-center">
          <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
          <p className="text-foreground-secondary">
            {start} - {end}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-start line-clamp-2 text-[20px]">
            {title}
          </p>
          <p className="text-foreground-secondary line-clamp-1 uppercase text-sm">
            {room}
          </p>
        </div>
      </div>
      {btn ? (
        <Button
        className={"w-fit flex-row-reverse px-3 mt-4"}
        title="Log presence"
        icon="ri-login-circle-line"
      />
      ) : ""}
    </div>
  );
};

export default Card;
