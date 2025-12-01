import React from "react";
import ImageNotFound from "@/assets/images/notFound.png";
import Background from "../Auth/Login/components/Background";
import Logo from "@/components/Logo";
import { Link } from "react-router-dom";

const NotFound = () => {
  const gradientText = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <div className="fixed top-0 left-0 w-full h-dvh justify-center items-center flex flex-col">
      <Background />
      <div className="fixed top-[22px] left-6    z-10">
        <Link to={"/"} className="font-genos font-bold text-[36px]">
          <span className="text-logo">GRA</span>DIA
        </Link>
      </div>
      <div className="xl:h-[65%] md:h-[50%] h-[60%] flex flex-col justify-between items-center">
        <div className="flex flex-col items-center gap-3">
          <img src={ImageNotFound} alt="imagenotfound" />
          <p
            className="font-semibold md:text-[40px] text-[24px] lg:text-[48px] font-montserrat"
            style={gradientText}
          >
            404 Page Not Found
          </p>
          <p className="lg:text-[24px] md:text-[20px] text-[16px] text-center px-6 text-foreground-secondary">
            Sorry, the page you were looking for could not be found
          </p>
        </div>
        <p className="md:text-[16px] text-[14px]">
          © {new Date().getFullYear()} Gradia. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
