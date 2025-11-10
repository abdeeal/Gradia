import { Button } from "@/components/Button";
import Logo from "@/components/Logo";
import Background from "@/pages/Auth/Login/components/Background";
import React from "react";

const Mobile = () => {
  return (
    <div className="text-foreground min-h-dvh relative flex flex-col">
      <Background />
      <Logo />

      <div
        id="hero"
        className="flex flex-col w-full flex-1 items-center z-10 relative pb-6 justify-center"
      >
        <div className="w-full">
          <div className="flex flex-col items-center mt-4 md:gap-6">
            <p className="font-montserrat font-bold text-[32px] text-center bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent md:text-[48px] md:w-[75%]">
              Welcome to <br />
              Gradia Workspace
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4 md:text-[24px] md:w-[65%]">
              Your personal space to plan, grow, and achieve more.
            </p>
          </div>
        </div>

        <div
          id="body-section"
          className="flex flex-col w-full py-9 px-3 gap-3 rounded-[12px] mt-8 text-center text-foreground bg-white/5 md:w-[75%]"
        >
          <div className="flex p-3 bg-[#141414] rounded-[8px] justify-between md:p-5">
            <div className="flex items-center gap-2">
              <i className="ri-more-2-fill text-[24px]"></i>
              <div className="w-[42px] h-[35px] flex items-center justify-center bg-gradient-to-tl from-[#6a6a6a] to-[#141414] rounded-[4px]">
                <span>S5</span>
              </div>
              <p className="font-semibold ml-1">Semester 5</p>
            </div>
            <Button
              title="noText"
              icon="ri-login-circle-line"
              className={"flex-row-reverse !px-3"}
            />
          </div>

          <div className="flex p-3 bg-[#141414] rounded-[8px] justify-between md:p-5">
            <div className="flex items-center gap-2">
              <div className="w-[42px] h-[35px] flex items-center justify-center bg-[#393939] rounded-[4px]">
                <i className="ri-add-line text-[24px]"></i>
              </div>
              <p className="font-semibold ml-1 text-foreground-secondary">Create new workspace</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Mobile;
