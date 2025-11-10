// src/pages/Loginpage/VerifyOtp.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Mobile from "./Layout/Mobile";
import { useMediaQuery } from "react-responsive";

const RESET_PASSWORD_ROUTE = "/login/reset-password";
const REGISTER_SUCCESS_ROUTE = "/register/success";

const VerifyOtp = ({ email, expiredAt, from, user }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  const location = useLocation();
  const navigate = useNavigate();

  const mode = useMemo(() => {
    const byProp = from;
    const byState = location.state?.type;
    const byQuery = new URLSearchParams(location.search).get("type");
    const raw = (byProp || byState || byQuery || "").toLowerCase();
    if (raw === "register") return "register";
    if (raw === "reset" || raw === "forgot" || raw === "login") return "reset";
    return "reset";
  }, [from, location.state, location.search]);

  const OTP_LENGTH = 6;
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const inputsRef = useRef([]);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((p) => (p <= 1 ? 5 * 60 : p - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const timerLabel = `${mm}:${ss}`;

  const onChange = (i, val) => {
    const v = val.replace(/\D/g, "");
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "Enter") handleVerify();
  };

  const emailFromNav = location.state?.email;
  const emailRegister =
    email ||
    emailFromNav ||
    (typeof window !== "undefined" ? sessionStorage.getItem("registerEmail") : "");

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (mode === "register" && !emailRegister) {
      navigate("/register", { replace: true });
    }
  }, [mode, emailRegister, navigate]);

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      const firstEmpty = digits.findIndex((d) => !d);
      if (firstEmpty >= 0) inputsRef.current[firstEmpty]?.focus();
      return;
    }

    if (mode === "reset") {
      navigate(RESET_PASSWORD_ROUTE);
      return;
    }

    try {
      setSubmitting(true);
      // === IMPORTANT: gunakan API yang ada ===
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailRegister,
          otp_code: code, // API expects otp_code
        }),
      });

      if (res.ok) {
        try {
          sessionStorage.removeItem("registerEmail");
        } catch {}
        navigate(REGISTER_SUCCESS_ROUTE, { replace: true });
      }
    } catch (_) {
      // silent fail per UI lama
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailRegister) return;
    try {
      setResending(true);
      // === IMPORTANT: gunakan API yang ada ===
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailRegister }),
      });
      if (res.ok) {
        setDigits(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
        setSecondsLeft(5 * 60);
      }
    } catch (_) {
    } finally {
      setResending(false);
    }
  };

  // Mobile/Tablet pakai layout lama
  if (isMobile || isTablet)
    return <Mobile email={email} expiredAt={expiredAt} from={from} user={user} />;

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  // === Register UI ===
  const RegisterUI = () => {
    const CARD_W = 818, CARD_H = 291;
    const TITLE_TOP = 80, SUB_TO_CARD = 62, CARD_PAD_X = 37;
    const OTP_TOP = 32, OTP_W = 99, OTP_H = 111, OTP_GAP = 30;
    const TIMER_TOP = 12, BTN_TOP = 8, RESEND_TOP = 8;
    const BTN_W = OTP_W * 4 + OTP_GAP * 3; // 486

    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black text-white" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
        {/* BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img src="/Asset 1.svg" alt="Asset 1" className="absolute z-0"
            style={{ width: vw(1410.82), height: vh(1185.82), left: vw(300.13), top: vh(20), transform: "rotate(-360deg)", opacity: 0.9 }} />
          <img src="/Asset 2.svg" alt="Asset 2" className="absolute z-0"
            style={{ width: vw(778), height: vh(871), left: vw(58), bottom: vh(114), opacity: 1 }} />
          <img src="/Asset 4.svg" alt="Asset 3" className="absolute z-0"
            style={{ width: vw(861), height: vh(726), right: vw(904), top: vh(322), opacity: 0.9 }} />
        </div>

        <div className="absolute inset-0 z-[5]"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)" }} />

        {/* CONTENT */}
        <div className="relative z-10 flex h-full w-full flex-col items-center">
          <div style={{ marginTop: `${TITLE_TOP}px` }} className="text-center">
            <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#949494]" style={{ fontSize: "48px", lineHeight: 1.3 }}>
              Verify Your Email Address
            </h1>
            <p className="mx-auto font-semibold" style={{ width: "540px", fontSize: "20px", marginTop: "4px", color: "#A3A3A3" }}>
              Enter the 6-digits code sent to your email.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
            style={{ width: `${CARD_W}px`, height: `${CARD_H}px`, marginTop: `${SUB_TO_CARD}px` }}>
            <div className="h-full w-full" style={{ paddingLeft: `${CARD_PAD_X}px`, paddingRight: `${CARD_PAD_X}px` }}>
              <div className="flex justify-between" style={{ marginTop: `${OTP_TOP}px`, gap: `${OTP_GAP}px` }}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i]}
                    onChange={(e) => onChange(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    ref={(el) => (inputsRef.current[i] = el)}
                    className="text-center text-2xl outline-none focus:ring-0"
                    style={{
                      width: `${OTP_W}px`,
                      height: `${OTP_H}px`,
                      background: "rgba(101,101,101,0.05)",
                      border: "1px solid rgba(101,101,101,0.5)",
                      borderRadius: "0px",
                      color: "#A3A3A3",
                    }}
                  />
                ))}
              </div>

              <div className="text-center text-[14px]" style={{ marginTop: `${TIMER_TOP}px`, color: "#A3A3A3" }}>
                {timerLabel}
              </div>

              <div className="w-full flex justify-center" style={{ marginTop: `${BTN_TOP}px` }}>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={submitting}
                  className="rounded-2xl shadow-md transition hover:opacity-95 flex items-center justify-center disabled:opacity-60"
                  style={{ width: `${BTN_W}px`, height: "55px", background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)" }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9] font-bold" style={{ fontSize: "20px", lineHeight: "1.5" }}>
                    {submitting ? "Verifying..." : "Verify"}
                  </span>
                </button>
              </div>

              <div className="text-center text-[14px]" style={{ marginTop: `${RESEND_TOP}px` }}>
                <span style={{ color: "#A3A3A3" }}>Didn’t receive the code?</span>{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ color: "#643EB2" }}
                  className="hover:opacity-90 font-bold disabled:opacity-60"
                >
                  {resending ? "Resending..." : "Resend code"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[14px] mt-[56px]" style={{ color: "#A3A3A3" }}>
            © {new Date().getFullYear()} Gradia. All rights reserved.
          </p>
        </div>
      </div>
    );
  };

  // === Forgot/Reset UI (tetap ada jika dibutuhkan nanti) ===
  const ForgotUI = () => {
    const CARD_W = 720, CARD_H = 281;
    const TITLE_TOP = 80, SUB_TO_CARD = 62, CARD_PAD_X = 32;
    const OTP_TOP = 28, OTP_W = 88, OTP_H = 100, OTP_GAP = 24;
    const TIMER_TOP = 10, BTN_TOP = 8, RESEND_TOP = 8;

    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black text-white" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
        {/* Background sama seperti di atas, dipersingkat */}
        <div className="relative z-10 flex h-full w-full flex-col items-center">
          <div style={{ marginTop: `${TITLE_TOP}px` }} className="text-center">
            <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#949494]" style={{ fontSize: "48px", lineHeight: 1.3 }}>
              Forgot Password?
            </h1>
            <p className="mx-auto" style={{ width: "540px", fontSize: "20px", marginTop: "4px", color: "#A3A3A3" }}>
              Enter the 6-digits code sent to your email.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
            style={{ width: `${CARD_W}px`, height: `${CARD_H}px`, marginTop: `${SUB_TO_CARD}px` }}>
            <div className="h-full w-full" style={{ paddingLeft: `${CARD_PAD_X}px`, paddingRight: `${CARD_PAD_X}px` }}>
              <div className="flex justify-between" style={{ marginTop: `${OTP_TOP}px`, gap: `${OTP_GAP}px` }}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i]}
                    onChange={(e) => onChange(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    ref={(el) => (inputsRef.current[i] = el)}
                    className="text-center text-2xl outline-none focus:ring-0"
                    style={{
                      width: `${OTP_W}px`,
                      height: `${OTP_H}px`,
                      background: "rgba(101,101,101,0.05)",
                      border: "1px solid rgba(101,101,101,0.5)",
                      borderRadius: "8px",
                      color: "#A3A3A3",
                    }}
                  />
                ))}
              </div>

              <div className="text-center text-[14px]" style={{ marginTop: `${TIMER_TOP}px`, color: "#A3A3A3" }}>
                {timerLabel}
              </div>

              <div className="w-full flex justify-center" style={{ marginTop: `${BTN_TOP}px` }}>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={submitting}
                  className="rounded-2xl shadow-md transition hover:opacity-95 flex items-center justify-center disabled:opacity-60"
                  style={{ width: `${OTP_W * 4 + OTP_GAP * 3}px`, height: "55px", background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)" }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9] font-bold" style={{ fontSize: "20px", lineHeight: "1.5" }}>
                    {submitting ? "Verifying..." : "Verify"}
                  </span>
                </button>
              </div>

              <div className="text-center text-[14px]" style={{ marginTop: `${RESEND_TOP}px` }}>
                <span style={{ color: "#A3A3A3" }}>Didn’t receive the code?</span>{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ color: "#643EB2" }}
                  className="hover:opacity-90 font-bold disabled:opacity-60"
                >
                  {resending ? "Resending..." : "Resend code"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[14px] mt-[64px]" style={{ color: "#A3A3A3" }}>
            © {new Date().getFullYear()} Gradia. All rights reserved.
          </p>
        </div>
      </div>
    );
  };

  return mode === "register" ? <RegisterUI /> : <ForgotUI />;
};

export default VerifyOtp;
