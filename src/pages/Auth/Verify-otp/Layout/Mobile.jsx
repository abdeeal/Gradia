import React, { useEffect, useState } from "react";
import Background from "../../Login/components/Background";
import Logo from "@/components/Logo";
import { Button } from "@/components/Button";
import { Link, useNavigate } from "react-router-dom";
import OtpInput from "../components/OtpInput";
import SuccessMsg from "../../Success-msg/SuccessMsg";

const Mobile = ({
  title = "Verify Your Email Address",
  expiredAt,
  email,
  from,
  user,
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); // <--- state untuk error

  const navigate = useNavigate();

  // Hitung mundur waktu
  useEffect(() => {
    if (!expiredAt) return;

    const target = new Date(expiredAt).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [expiredAt]);

  const handleVerify = async () => {
    setErrorMsg(""); // reset error sebelum verifikasi

    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const res = await fetch("/api/auth/verifyOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otp }),
      });

      const data = await res.json();

      if (res.ok) {
        if (from === "login") {
          console.log("user before storage:", user); // cek dulu, harus object
          localStorage.setItem("user", JSON.stringify(user));
          navigate("/dashboard");
        } else if (from === "verification") {
          setSuccess("verification");
        } else {
          setSuccess("reset-password");
        }
      } else {
        setErrorMsg(data.error || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("VERIFY ERROR:", err);
      setErrorMsg("An error occurred while verifying OTP.");
    }
  };

  if (success !== "") {
    return <SuccessMsg type={success} />;
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
              {title}
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4 md:text-[20px]">
              Enter the 6-digits code sent to your email{" "}
            </p>
          </div>
        </div>

        <div
          id="body-section"
          className="flex flex-col w-full py-9 bg-white/5 px-3 gap-8 rounded-[12px] mt-8 md:w-[75%] md:px-12"
        >
          <div>
            <OtpInput length={6} onChange={(code) => setOtp(code)} />
            <p
              id="errormsg"
              className={`text-[14px] text-red-400 mt-2 transition-all duration-200 ${
                errorMsg ? "opacity-100" : "opacity-0"
              }`}
            >
              {errorMsg || "error"}
            </p>
          </div>

          <div className="w-full text-center">
            <span id="countdown" className="text-foreground-secondary">
              {timeLeft || "--:--"}
            </span>
          </div>

          <div className="flex flex-col gap-4 md:gap-8">
            <span className="text-[14px] text-foreground-secondary">
              Didn’t receive the code?{" "}
              <Link to={"/auth/register"} className="underline text-logo">
                Resend Code
              </Link>
            </span>

            <Button
              icon="noIcon"
              title={"Verify"}
              className={"w-full text-center justify-center py-4"}
              onClick={handleVerify}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
