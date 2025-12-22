import React from "react";

const Core = () => {
  return (
    <section id="features" className="w-full xl:h-dvh h-fit pt-16 xl:pt-0 flex flex-col items-center justify-center bg-white text-black pb-12 xl:px-16 2xl:px-40 font-montserrat max-md:px-8">
      <p className="font-semibold text-[48px] pb-6 font-montserrat max-md:text-[36px]">Core Features</p>
      <p className="-mt-2 text-center text-gray-600 px-6 xl:px-0 2xl:text-[20px]">Built to Support Every Aspect of Your Academic Journey.</p>
      <div className="w-full xl:grid grid-cols-4 flex flex-col xl:flex-none gap-10 md:gap-[60px] xl:gap-10 xl:gap-0 items-center xl:items-start  px-6 pt-16">
        <div className="flex flex-col w-full md:w-[60%] xl:w-full text-center">
          <img src="./images/courseFeatures.png" alt="" />
          <p className="font-semibold text-[20px] md:text-[24px] xl:text-[20px]">Courses</p>
          <p className="text-[16px] 2xl:text-[20px] 2xl:mt-2 text-gray-600 mt-1">
            All your semester courses, organized and easy to navigate.
          </p>
        </div>
        <div className="flex flex-col w-full md:w-[60%] xl:w-full text-center col-span-2">
          <img src="./images/dashboardFeatures.png" alt="" />
          <p className="font-semibold text-[20px] md:text-[24px] xl:text-[20px] pt-4">Dashboard</p>
          <p className="text-[16px] 2xl:text-[20px] 2xl:mt-2 text-gray-600 mt-1">
            Built to Support Every Aspect of Your Academic Journey.
          </p>
        </div>
        <div className="flex flex-col w-full md:w-[60%] xl:w-full text-center">
          <img src="./images/calendarFeatures.png" alt="" />
          <p className="font-semibold text-[20px] md:text-[24px] xl:text-[20px]">Calendar</p>
          <p className="text-[16px] 2xl:text-[20px] 2xl:mt-2 text-gray-600 mt-1">
            Your entire academic life, visualized beautifully in one place.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Core;
