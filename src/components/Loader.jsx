import React from "react";

const Loader = () => {
  return (
    <div className="w-full h-dvh fixed top-0 left-0 bg-black/20 z-999 flex justify-center items-center">
      <div className="loader"></div>
    </div>
  );
};

export default Loader;
