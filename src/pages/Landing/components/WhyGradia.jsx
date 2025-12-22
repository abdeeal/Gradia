import { Button } from "@/components/Button";
import React from "react";
import { useMediaQuery } from "react-responsive";

const Card = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  return (
    <div className="flex flex-col px-5 py-6 bg-white/10 rounded-[8px] border border-border/50 gap-3 max-xl:mt-12">
      <div className="flex gap-6 items-center px-5 py-6 bg-[#141414] border border-white/20 rounded-[8px]">
        {!isMobile && <i className="ri-check-line text-[34px] text-logo"></i>}
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-[20px]">Reduce Academic Stress</p>
          <span className="text-foreground-secondary text-sm">
            Clear schedules, smart reminders, and an organized workspace make
            your university life calmer and more manageable.
          </span>
        </div>
      </div>

      <div className="flex gap-6 items-center px-5 py-6 bg-[#141414] border border-white/20 rounded-[8px]">
        {!isMobile && <i className="ri-check-line text-[34px] text-logo"></i>}
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-[20px]">
            Improve Your Academic Performance
          </p>
          <span className="text-foreground-secondary text-sm">
            With everything structured and prioritized correctly, you have more
            time to actually focus on learning.
          </span>
        </div>
      </div>

      <div className="flex gap-6 items-center px-5 py-6 bg-[#141414] border border-white/20 rounded-[8px]">
        {!isMobile && <i className="ri-check-line text-[34px] text-logo"></i>}
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-[20px]">
            Built for University Students
          </p>
          <span className="text-foreground-secondary text-sm">
            Every feature is created based on real student needs: assignments,
            courses, attendance, deadlines, and campus life
          </span>
        </div>
      </div>
    </div>
  );
};

const WhyGradia = () => {
  const isMobile = useMediaQuery({ maxWidth: 1024 });

  return (
    <section
      id="whygradia"
      className="w-full min-h-dvh 2xl:min-h-[70dvh] relative flex justify-center items-center"
    >
      <div className="w-[85%] relative flex justify-center items-center">
        <div className="grid xl:grid-cols-2 grid-cols-1">
          <div className="flex flex-col h-full justify-center gap-2">
            <p className="text-[48px] font-semibold max-xl:text-center max-xl:mt-16">
              Why Choose Gradia?
            </p>
            <span className="text-foreground-secondary max-xl:text-center max-xl:pt-4">
              Built to Support Every Aspect of Your Academic Journey
            </span>


            {isMobile && <Card />}


            <p className="text-[48px] font-semibold 2xl:mt-12 mt-8 max-xl:text-center">
              199K+ Students
            </p>
            <span className="text-foreground-secondary max-xl:text-center">
              Around the world!
            </span>

            <div className="max-xl:justify-center flex w-full">
              <Button
                icon="noIcon"
                className={"mt-12 w-fit px-16 py-4"}
                title="Try Now"
              />
            </div>
          </div>
          {!isMobile && <Card />}
        </div>
      </div>
    </section>
  );
};

export default WhyGradia;
