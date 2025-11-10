import React, { useState } from "react";
import Background from "../../Login/components/Background";
import Logo from "@/components/Logo";
import { Button } from "@/components/Button";
import Input from "../../Login/components/Input";
import VerifyOtp from "../../Verify-otp/VerifyOtp";

const Mobile = () => {
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [expiredAt, setExpiredAt] = useState("");
  const [emailToVerify, setEmailToVerify] = useState("");

  const handleNext = async () => {
    setErrorMsg("");
    if (!text) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: text, action: "send-otp" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send reset password email.");
        return;
      }

      // Jika berhasil kirim OTP
      setEmailToVerify(text);
      setExpiredAt(
        data.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString()
      );
      setShowVerify(true);
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showVerify) {
    return (
      <VerifyOtp
        email={emailToVerify}
        expiredAt={expiredAt}
        from="reset-password"
      />
    );
  }

  return (
    <div className="text-foreground min-h-dvh relative flex flex-col">
      <Background />
      <Logo />

      <div
        id="hero"
        className="flex flex-col w-full flex-1 items-center z-10 relative pb-6 justify-center"
      >
        <div className="w-full">
          <div className="flex flex-col items-center mt-4">
            <p className="font-montserrat font-bold text-[32px] text-center bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent w-[70%] md:text-[48px] md:w-[50%]">
              Forgot Password?
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4 md:text-[20px]">
              Enter your email to reset password
            </p>
          </div>
        </div>

        <div
          id="body-section"
          className="flex flex-col w-full py-9 bg-white/5 px-3 gap-8 rounded-[12px] mt-8 md:w-[75%] md:px-12"
        >
          <div>
            <Input
              placeholder={"your-email@mail.com"}
              title={"Email"}
              value={text}
              type="email"
              onChange={(e) => setText(e.target.value)}
            />
            <p
              id="errormsg"
              className={`text-[14px] text-red-400 mt-2 transition-all duration-200 ${
                errorMsg ? "opacity-100" : "opacity-0"
              }`}
            >
              {errorMsg || "Placeholder"}
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-8">
            <Button
               icon={loading ? "ri-loader-4-line animate-spin" : "noIcon"}
              title={loading ? "Sending..." : "Next"}
              className={"w-full text-center justify-center py-4"}
              onClick={handleNext}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
