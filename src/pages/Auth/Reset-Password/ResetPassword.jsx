import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useMediaQuery } from "react-responsive";
import Mobile from "./Layout/Mobile";
import { useNavigate, useLocation } from "react-router-dom";

export default function ResetPassword({ initialStep = "email" }) {
  const isSm = useMediaQuery({ maxWidth: 767 });
  const isMd = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  const nav = useNavigate();
  const loc = useLocation();

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  // steps: 'email' | 'otp' | 'newPw' | 'success'
  const [step, setStep] = useState(initialStep === "newPw" ? "newPw" : "email");
  const [mail, setMail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill("")); // utk mobile / kompatibilitas
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false); // loading untuk kirim OTP
  const otpRefs = useRef([]);

  // === ROUTES ===
  const OTP_PATH = "/auth/verify-otp";
  const RESET_DONE_PATH = "/auth/success/reset";
  const LS_KEY = "reset_email";

  // Ambil email dari localStorage saat pertama kali mount
  useEffect(() => {
    try {
      const lsMail = window.localStorage.getItem(LS_KEY);
      if (lsMail && !mail) setMail(lsMail);
    } catch (e) {
      console.warn("Cannot read reset_email from localStorage:", e);
    }
   
  }, []);

  // detect return from Verify OTP: state: { verified: true, type: 'reset', email }
  useEffect(() => {
    const st = loc?.state || {};
    if (st?.verified === true && st?.type === "reset") {
      if (st?.email) {
        setMail(st.email);
        try {
          window.localStorage.setItem(LS_KEY, st.email);
        } catch (e) {
          console.warn("Cannot save reset_email to localStorage:", e);
        }
      }
      setStep("newPw");
      // bersihkan state agar tidak repeat saat refresh
      window.history.replaceState({}, document.title);
    }
  }, [loc?.state]);

  // === handlers ===
  const onMailSubmit = async (e) => {
    e.preventDefault();
    if (!mail.includes("@")) return setErr("Invalid email.");
    setErr("");

    try {
      setIsLoading(true);

      // simpan email ke localStorage
      try {
        window.localStorage.setItem(LS_KEY, mail);
      } catch (e) {
        console.warn("Cannot save reset_email to localStorage:", e);
      }

      // panggil API /api/auth/resetPassword -> action: send-otp
      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-otp",
          email: mail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send OTP.");

      // sukses -> pindah ke halaman Verify OTP
      nav(
        {
          pathname: OTP_PATH,
          search: "?type=reset",
        },
        {
          state: {
            email: mail,
            type: "reset",
          },
        }
      );
    } catch (e) {
      console.error("SEND OTP ERROR:", e);
      setErr(e.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // (Dipertahankan untuk mobile / kemungkinan reuse; desktop tidak pakai local 'otp' step)
  const onOtpChange = (val, i) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < otp.length - 1) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  // (Tidak dipakai untuk desktop route flow)
  const onOtpSubmit = (e) => {
    e.preventDefault();
    if (otp.join("").length < 6) return setErr("OTP must be 6 digits");
    setErr("");
    setStep("newPw");
  };

  const onNewPwSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Password must be at least 8 chars");
    if (pw !== cpw) return setErr("Passwords do not match");

    // pastikan email ada (ambil dari localStorage kalau perlu)
    let curMail = mail;
    if (!curMail) {
      try {
        const lsMail = window.localStorage.getItem(LS_KEY);
        if (lsMail) {
          curMail = lsMail;
          setMail(lsMail);
        }
      } catch (errLs) {
        console.warn("Cannot read reset_email from localStorage:", errLs);
      }
    }

    if (!curMail) {
      return setErr(
        "Session reset tidak valid, silakan ulangi dari halaman Forgot Password."
      );
    }

    try {
      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          email: curMail,
          new_password: pw,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to reset password.");

      // hapus email dari localStorage karena sudah selesai reset
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch (errRm) {
        console.warn("Cannot remove reset_email from localStorage:", errRm);
      }

      // New Password -> SuccessMsg
      nav(RESET_DONE_PATH, {
        state: {
          type: "reset",
          email: curMail,
        },
        replace: true,
      });
    } catch (e) {
      console.error("CHANGE PASSWORD ERROR:", e);
      setErr(e.message || "Failed to reset password.");
    }
  };

  const bg = () => (
    <>
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/Asset 1.svg"
          alt="Asset 1"
          className="absolute z-0"
          style={{
            width: vw(1410.82),
            height: vh(1185.82),
            left: vw(400.13),
            top: vh(30),
            transform: "rotate(-200deg)",
            transformOrigin: "50% 50%",
            opacity: 0.9,
          }}
        />
        <img
          src="/Asset 2.svg"
          alt="Asset 2"
          className="absolute z-10"
          style={{
            width: vw(778),
            height: vh(871),
            left: vw(58),
            bottom: vh(114),
            opacity: 0.9,
          }}
        />
        <img
          src="/Asset 4.svg"
          alt="Asset 3"
          className="absolute z-10"
          style={{
            width: vw(861),
            height: vh(726),
            right: vw(904),
            top: vh(322),
            opacity: 0.9,
          }}
        />
      </div>
      <div
        className="absolute inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </>
  );

  const btnStyle = {
    background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const MailForm = () => (
    <form onSubmit={onMailSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-mail-line" style={{ color: "#A3A3A3" }} />
          <label style={{ color: "#A3A3A3" }}>Email</label>
        </div>
        <input
          type="email"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full h-[44px] rounded-md bg-transparent px-3 outline-none text-[15px]"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#EAEAEA",
          }}
        />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button
        type="submit"
        className="w-full mt-2 rounded-md h-[46px] shadow-md transition hover:opacity-95"
        style={btnStyle}
        disabled={isLoading}
        onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      >
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9]">
          {isLoading ? "Verifying..." : "Reset Password"}
        </span>
      </button>
      <div className="text-center text-sm mt-3">
        <span style={{ color: "#A3A3A3" }}>Back to </span>
        <a
          href="/auth/login"
          className="font-bold hover:opacity-90"
          style={{ color: "#643EB2" }}
        >
          Login
        </a>
      </div>
    </form>
  );

  const OtpForm = () => (
    <form onSubmit={onOtpSubmit} className="space-y-4">
      <p className="text-sm text-[#A3A3A3] text-center mb-3">
        Enter the 6-digit OTP sent to <b>{mail}</b>
      </p>
      <div className="flex justify-center gap-3">
        {otp.map((d, i) => (
          <input
            key={i}
            type="text"
            value={d}
            maxLength={1}
            onChange={(e) => onOtpChange(e.target.value, i)}
            ref={(el) => (otpRefs.current[i] = el)}
            className="w-[48px] h-[58px] rounded-md text-center bg-transparent text-xl outline-none"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#FAFAFA",
            }}
          />
        ))}
      </div>
      {err && <p className="text-sm text-red-400 text-center">{err}</p>}
      <button
        type="submit"
        className="w-full mt-2 rounded-md h-[46px] shadow-md transition hover:opacity-95"
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      >
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9]">
          Verify OTP
        </span>
      </button>
    </form>
  );

  const NewPwForm = () => (
    <form onSubmit={onNewPwSubmit} className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-lock-2-line" style={{ color: "#A3A3A3" }} />
          <label style={{ color: "#A3A3A3" }}>New Password</label>
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full h-[44px] rounded-md bg-transparent px-3 outline-none text-[15px]"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#EAEAEA",
          }}
        />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <i
            className="ri-lock-password-line"
            style={{ color: "#A3A3A3" }}
          />
          <label style={{ color: "#A3A3A3" }}>Confirm Password</label>
        </div>
        <input
          type="password"
          value={cpw}
          onChange={(e) => setCpw(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full h-[44px] rounded-md bg-transparent px-3 outline-none text-[15px]"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#EAEAEA",
          }}
        />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button
        type="submit"
        className="w-full mt-3 rounded-md h-[46px] shadow-md transition hover:opacity-95"
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      >
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9]">
          Save New Password
        </span>
      </button>
    </form>
  );

  const SuccessView = () => (
    <div className="flex flex-col items-center">
      <i className="ri-check-line text-6xl text-[#8F6BD8] mb-4" />
      <h2 className="text-2xl font-semibold text-white mb-2">
        Password Reset Successful
      </h2>
      <p className="text-[#A3A3A3] mb-6">
        You can now log in with your new password.
      </p>
      <button
        onClick={() => nav("/auth/login")}
        className="px-10 py-3 rounded-md shadow-md transition hover:opacity-95"
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      >
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9]">
          Go to Login
        </span>
      </button>
    </div>
  );

  // NOTE: return <Mobile /> dipindah ke bawah supaya hooks selalu dipanggil konsisten
  if (isSm || isMd) return <Mobile />;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {bg()}
      <div className="relative z-10 flex h-full w-full flex-col items-center">
        {/* title */}
        <div style={{ marginTop: "110px" }} className="text-center">
          <h1
            className="font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#949494]"
            style={{ fontSize: "48px", lineHeight: 1.3 }}
          >
            {step === "email"
              ? "Forgot Password?"
              : step === "otp"
              ? "Verify OTP"
              : step === "newPw"
              ? "Set New Password"
              : "Success!"}
          </h1>
          <p
            className="mx-auto font-semibold"
            style={{
              width: "540px",
              fontSize: "20px",
              marginTop: "4px",
              color: "#A3A3A3",
            }}
          >
            {step === "email" && "Enter your email to reset password"}
            {step === "otp" && "Check your inbox for the verification code"}
            {step === "newPw" && "Create your new password"}
            {step === "success" &&
              "Your password has been reset successfully"}
          </p>
        </div>

        {/* card */}
        <div
          className="mt-[64px] w-[540px] min-h-[210px]"
          style={{
            width: `540px`,
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 0 25px rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
            padding: `22px 65px`,
          }}
        >
          {step === "email" && <MailForm />}
          {step === "otp" && <OtpForm /> /* kept for completeness */}
          {step === "newPw" && <NewPwForm />}
          {step === "success" && <SuccessView />}
        </div>

        {/* footer */}
        <p
          className="text-center text-[14px] mt-[64px]"
          style={{ color: "#A3A3A3" }}
        >
          © {new Date().getFullYear()} Gradia. All rights reserved.
        </p>
      </div>
    </div>
  );
}

ResetPassword.propTypes = {
  initialStep: PropTypes.oneOf(["email", "otp", "newPw", "success"]),
};
