import React from "react";

const Mobile = () => {
  return (
    <div className="flex flex-col gap-8 text-foreground">
      <div className="flex flex-col gap-2">
        <p className="font-montserrat text-[20px] font-semibold">
          Welcome in, Abdee Alamsyah
        </p>
        <span className="text-foreground-secondary">
          Track your learning progress, courses and tasks for today
        </span>
      </div>

      <div className={`w-full h-[160px] bg-gradient-to-tl from-[#539d88] to-[#164a7b] rounded-2xl`}>

      </div>
    </div>
  );
};

export default Mobile;
