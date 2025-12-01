import { Button } from "@/components/Button";
import bubble1 from "@/assets/images/bubble-1.png";
import bubble2 from "@/assets/images/bubble-2.png";
import bubble3 from "@/assets/images/bubble-3.png";
import bubble4 from "@/assets/images/bubble-4.png";
import React from "react";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";

const Hero = () => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center gap-5 relative">
      <div className="w-full h-full absolute z-0 pointer-events-none">
        <div className="absolute top-0 right-0">
          <img src={isTablet ? bubble3 : bubble1} alt="bubble-1" />
        </div>
        <div className="absolute bottom-0 left-0">
          <img src={isTablet ? bubble4 : bubble2} alt="bubble-1" />
        </div>
      </div>
      <div className="w-full flex flex-col md:h-[50%] h-[60%] justify-between items-center px-6 md:px-24 xl:px-0">
        <div className="flex flex-col items-center xl:gap-6 gap-10">
          <p className="font-montserrat md:text-[48px] text-[28px] text-center font-semibold ">
            Manage Your Courses, Tasks, and <br className="xl:flex hidden" />{" "}
            Campus Life — All in One Place
          </p>
          <span className="font-inter text-foreground-secondary md:text-[20px] text-center text-[16px] ">
            Gradia helps students stay organized, productive, and balanced with
            a <br className="xl:flex hidden" />
            powerful dashboard tailored for your academic journey.
          </span>
        </div>

        <Link to={"/auth/login"}>
          <Button
            icon="noIcon"
            title="Try Now"
            className={"text-[16px] font-semibold px-16 py-4"}
          />
        </Link>
      </div>
    </div>
  );
};

export default Hero;
