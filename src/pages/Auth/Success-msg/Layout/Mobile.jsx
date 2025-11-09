import React, { useEffect, useState } from "react";
import Background from "../../Login/components/Background";
import Logo from "@/components/Logo";
import { Link } from "react-router-dom";

const Mobile = ({ type }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    const actualType = type?.type || type;
    if (actualType === "verification") {
      setTitle("Email Verified Successfully");
      setDesc(
        "Your email has been successfully verified. You can now log in and start managing your goals with Gradia."
      );
    } else {
      setTitle("Password Reset Successfully");
      setDesc(
        "Your password has been successfully updated. You can now log in and continue managing your goals with Gradia."
      );
    }
  }, [type]); 


  return (
    <div className="text-foreground min-h-dvh relative flex flex-col">
      <Background />
      <Logo />

      <div
        id="hero"
        className="flex flex-col w-full flex-1 items-center z-10 relative pb-6 justify-center"
      >
        <div className="w-full">
          <div className="flex flex-col items-center mt-4 md:gap-8">
            <p className="font-montserrat font-bold text-[32px] text-center bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent md:text-[48px] md:w-[75%]">
              {title}
            </p>
            <p className="text-center text-foreground-secondary mt-8 px-4 md:text-[24px] md:w-[65%]">
              {desc}
            </p>
          </div>
        </div>

        <div
          id="body-section"
          className="flex flex-col w-full py-9 px-3 gap-8 rounded-[12px] mt-8 text-center text-foreground-secondary"
        >
          <p className="md:text-[20px]">
            Back to{" "}
            <Link to={"/auth/login"} className="text-logo">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
