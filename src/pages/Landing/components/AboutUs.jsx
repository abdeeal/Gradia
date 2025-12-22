import React from "react";

const AboutUs = () => {
  return (
    <div className="w-full bg-white justify-center items-center text-black grid grid-cols-2 max-xl:grid-cols-1 py-8 px-8 xl:px-20 xl:py-12 2xl:px-64 2xl:py-20 gap-8 max-md:px-6">
      <div className="flex flex-col rounded-[32px] h-full py-5 px-5 justify-between w-full max-md:w-full max-xl:w-[65%] max-xl:justify-self-center items-center">
        <h1 className="text-center max-md:text-[36px] text-[48px] xl:leading-14 font-semibold 2xl:text-[48px] 2xl:leading-20 2xl:w-[75%]">
          Where Productive Becomes Goal
        </h1>

        <p className="text-center text-gray-600 font-montserrat mt-8 2xl:text-[20px] ">
          Gradia is a student-centered academic management platform built to
          simplify the way university students manage their tasks, courses,
          schedules, and campus responsibilities
        </p>

        <div className="grid grid-cols-2 max-xl:grid-cols-1 gap-4 mt-8">
          <div className="w-full bg-[#f9f7fe] px-4 py-4 rounded-[12px] flex flex-col justify-between">
            <div className="px-3 py-3 rounded-full bg-[#E5D5FF] w-fit">
              <img src="./images/vision.png" alt="" width={32} />
            </div>

            <div className="flex flex-col gap-3 mt-10">
              <span className="font-semibold text-[28px] 2xl:text-[36px]">Vision</span>
              <span className="text-gray-600 2xl:text-[20px]">
                Become the most trusted productivity platform for students.
              </span>
            </div>
          </div>

          <div className="w-full bg-[#f9f7fe] px-4 py-4 rounded-[12px] flex flex-col justify-between">
            <div className="px-3 py-3 rounded-full bg-[#E5D5FF] w-fit">
              <img src="./images/mission.png" alt="" width={32} />
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <span className="font-semibold text-[28px] 2xl:text-[36px]">Mission</span>
              <span className="text-gray-600 2xl:text-[20px]">
                Transform overwhelming schedules into clear paths to success.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-md:w-full max-xl:w-[65%] max-xl:justify-self-center">
        <img
          src="./images/aboutus.jpg"
          alt="person"
          className="rounded-[32px]"
        />
      </div>
    </div>
  );
};

export default AboutUs;
