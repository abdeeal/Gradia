import React from "react";
import bubble1 from "@/assets/images/bubble-1.png";
import bubble2 from "@/assets/images/bubble-2.png";

const Background = () => {
  return (
    <div className="w-full h-dvh fixed top-0 left-0 z-0 pointer-events-none">
      <div className="absolute top-0 right-0">
        <img src={bubble1} alt="bubble-1" />
      </div>
      <div className="absolute bottom-0 left-0">
        <img src={bubble2} alt="bubble-1" />
      </div>
    </div>
  );
};

export default Background;
