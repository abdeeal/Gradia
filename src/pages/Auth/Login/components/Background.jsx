import React from "react";
import bubble1 from "@/assets/images/bubble-1.png";
import bubble2 from "@/assets/images/bubble-2.png";
import bubble3 from "@/assets/images/bubble-3.png";
import bubble4 from "@/assets/images/bubble-4.png";
import { useMediaQuery } from "react-responsive";

const Background = () => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  return (
    <div className="w-full h-dvh fixed top-0 left-0 z-0 pointer-events-none">
      <div className="absolute top-0 right-0">
        <img src={isTablet ? bubble3 : bubble1} alt="bubble-1" />
      </div>
      <div className="absolute bottom-0 left-0">
        <img src={isTablet ? bubble4 : bubble2} alt="bubble-1" />
      </div>
    </div>
  );
};

export default Background;
