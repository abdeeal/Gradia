import React from "react";

const WhyUs = () => {
  return (
    <section
      id="whyus"
      className="w-full xl:h-[95dvh] 2xl:h-[65dvh] min-h-fit md:grid xl:grid-cols-[40%_60%] md:grid-cols-[50%_50%] flex flex-col md:flex-none bg-white text-black relative max-md:px-8"
    >
      <div className="flex flex-col h-full w-full xl:justify-center mt-16 xl:mt-0 items-start xl:pl-24 2xl:pl-48 px-6 md:px-">
        <p className="font-semibold text-[36px] md:text-[48px] xl:text-[48px] 2xl:text-[64px] pb-6 text-center max-md:w-full max-md:leading-12">
          Why Students <br />
          Need Gradia?
        </p>
        <div className="flex flex-col justify-center items-start w-full gap-6">
          {/* <p className='font-semibold text-[20px]'>Studying in university is more than just attending classes.</p> */}
          <p className="font-montserrat xl:text-[20px] text-gray-600 2xl:text-[20px] max-md:text-center">
            Assignments pile up, deadlines overlap, schedules shift, and your
            personal life competes for attention. Traditional planners can’t
            keep up. Notifications get lost. Stress builds.
          </p>
        </div>
      </div>

      <img src="/images/bgphone.png" alt="" className="absolute top-0 right-0 max-md:hidden" />
      <div className="relative h-fit mt-6 xl:mt-0">
        <img
          src="/images/whyUs.png"
          alt=""
          className="xl:w-[600px] xl:h-[600px] xl:absolute xl:top-[50%] xl:translate-y-[10%] xl:right-[10%] z-80"
        />
      </div>
    </section>
  );
};

export default WhyUs;
