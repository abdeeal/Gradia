import React, { useEffect, useState } from "react";
import Background from "../../Login/components/Background";
import Logo from "@/components/Logo";
import { Button } from "@/components/Button";
import { Link, useNavigate } from "react-router-dom";
import OtpInput from "../components/OtpInput";
import SuccessMsg from "../../Success-msg/SuccessMsg";
import NewPassword from "../../Reset-Password/Layout/NewPassword";

const Mobile = ({
  title = "Verify Your Email Address",
  expiredAt,
  email,
  from,
  user,
  purpose,
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPass, setResetPass] = useState(false);
  const [localExpiredAt, setLocalExpiredAt] = useState(expiredAt);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();

  // ⏱️ Hitung mundur waktu OTP
  useEffect(() => {
    if (!localExpiredAt) return;

    const target = new Date(localExpiredAt).getTime();
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
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [localExpiredAt]);

  const handleVerify = async () => {
    setErrorMsg("");
    setLoading(true);

    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter a valid 6-digit OTP");
      setLoading(false);
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
        setLoading(false);
        if (from === "login") {
          localStorage.setItem("user", JSON.stringify(user));
          navigate("/workspaces");
        } else if (from === "verification") {
          setSuccess("verification");
        } else {
          setResetPass(true);
          setSuccess("reset-password");
        }
      } else {
        setErrorMsg(data.error || "Failed to verify OTP");
        setLoading(false);
      }
    } catch (err) {
      console.error("VERIFY ERROR:", err);
      setErrorMsg("An error occurred while verifying OTP.");
      setLoading(false);
    }
  };

  // 🔁 Resend OTP
  const handleResendCode = async () => {
    setResending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/sendOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      // ✅ update expiredAt baru
      setLocalExpiredAt(data.expires_at);
      setOtp("");
      setErrorMsg("");
    } catch (err) {
      console.error("RESEND ERROR:", err);
      setErrorMsg("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (resetPass) return <NewPassword success={success} email={email} />;
  if (success !== "") return <SuccessMsg type={success} />;

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
              Enter the 6-digit code sent to your email
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
              <button
                onClick={handleResendCode}
                disabled={resending}
                className={`underline ${
                  resending ? "opacity-50 cursor-not-allowed" : "text-logo"
                }`}
              >
                {resending ? "Resending..." : "Resend Code"}
              </button>
            </span>

            <Button
              icon={loading ? "ri-loader-4-line animate-spin" : "noIcon"}
              title={`${loading ? "Verifying..." : "Verify"}`}
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
