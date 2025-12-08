
import React, { useState } from "react";
import PropTypes from "prop-types";
import { useMediaQuery } from "react-responsive";
import { useNavigate, useLocation } from "react-router-dom";
import Mobile from "./Layout/Mobile";

const PURPOSE_RESET_PASSWORD = "reset-password";
const VERIFY_OTP_ROUTE = "/auth/verify-otp";
const RESET_PASSWORD_NEW_ROUTE = "/auth/reset-password/newpassword";
const RESET_PASSWORD_SUCCESS_ROUTE = "/auth/success/reset";

export default function ResetPassword({ initialStep = "email" }) {
  const isSm = useMediaQuery({ maxWidth: 767 });
  const isMd = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  const nav = useNavigate();
  const loc = useLocation();

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  // email dibawa dari VerifyOtp (state) atau fallback kosong
  const [email, setEmail] = useState(loc.state?.email || "");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

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
        className="absolute inset-0 z-5"
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

  const isEmailMode = initialStep === "email";
  const isNewPwMode = initialStep === "newPw";

  /* ============================
     MODE EMAIL: kirim OTP
     ============================ */
  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!email.trim()) return setErr("Email tidak boleh kosong.");
    if (!email.includes("@")) return setErr("Format email tidak valid.");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/sendOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: PURPOSE_RESET_PASSWORD,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("ResetPassword sendOtp error payload:", data);
        throw new Error(data?.message || "Gagal mengirim OTP.");
      }

      setInfo("Kode OTP telah dikirim ke email kamu.");

      // lempar ke halaman VerifyOtp khusus reset password
      nav(VERIFY_OTP_ROUTE, {
        state: {
          email,
          type: "reset-password",
          purpose: PURPOSE_RESET_PASSWORD,
          nextRoute: RESET_PASSWORD_NEW_ROUTE,
        },
        replace: true,
      });
    } catch (error) {
      console.error(error);
      setErr(error.message || "Terjadi kesalahan saat mengirim OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     MODE NEW PASSWORD
     ============================ */
  const handleSubmitNewPw = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!newPw.trim()) return setErr("Password tidak boleh kosong.");
    if (newPw.length < 8)
      return setErr("Password harus minimal 8 karakter.");
    if (newPw !== confirmPw)
      return setErr("Konfirmasi password tidak sama.");

    const emailForReset = loc.state?.email || email;
    if (!emailForReset) {
      return setErr("Email tidak ditemukan. Ulangi proses reset password.");
    }

    try {
      setLoading(true);

      // ✅ Samakan payload dengan mobile (NewPassword mobile)
      const payload = {
        action: "change-password",
        email: emailForReset,
        new_password: newPw,
      };

      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("ResetPassword resetPassword error payload:", data);
        throw new Error(
          data?.error || data?.message || "Gagal mengubah password."
        );
      }

      // backend kirim { message, status: "success" } -> langsung ke halaman success
      nav(RESET_PASSWORD_SUCCESS_ROUTE, {
        replace: true,
      });
    } catch (error) {
      console.error(error);
      setErr(error.message || "Terjadi kesalahan saat mengubah password.");
    } finally {
      setLoading(false);
    }
  };

  if (isSm || isMd) {
    // mobile tetap pakai komponen Mobile yang sudah ada
    return <Mobile initialStep={initialStep} />;
  }

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
            className="font-bold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#949494]"
            style={{ fontSize: "48px", lineHeight: 1.3 }}
          >
            {isEmailMode && "Forgot Password"}
            {isNewPwMode && "Set New Password"}
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
            {isEmailMode && "Enter your email to reset password"}
            {isNewPwMode && "Enter your new password here"}
          </p>
        </div>

        {/* card */}
        <div
          className="mt-16 w-[540px] min-h-[210px]"
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
          {/* MODE EMAIL */}
          {isEmailMode && (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#A3A3A3" }}
                  >
                    Email
                  </label>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-md bg-transparent px-3 outline-none text-[15px]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#EAEAEA",
                  }}
                />
              </div>

              {err && <p className="text-sm text-red-400">{err}</p>}
              {info && <p className="text-sm text-emerald-400">{info}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-md h-[46px] shadow-md transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={btnStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                <span className="font-semibold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#B9B9B9]">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </span>
              </button>

              {/* Back to Login */}
              <p
                className="text-center"
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#A3A3A3",
                }}
              >
                Back to{" "}
                <span
                  onClick={() => nav("/auth/login")}
                  style={{
                    color: "#643EB2",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Login
                </span>
              </p>
            </form>
          )}

          {/* MODE NEW PASSWORD */}
          {isNewPwMode && (
            <form onSubmit={handleSubmitNewPw} className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#A3A3A3" }}
                  >
                    New Password
                  </label>
                </div>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 rounded-md bg-transparent px-3 outline-none text-[15px]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#EAEAEA",
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#A3A3A3" }}
                  >
                    Confirm New Password
                  </label>
                </div>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 rounded-md bg-transparent px-3 outline-none text-[15px]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#EAEAEA",
                  }}
                />
              </div>

              {err && <p className="text-sm text-red-400">{err}</p>}
              {info && <p className="text-sm text-emerald-400">{info}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-md h-[46px] shadow-md transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={btnStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                <span className="font-semibold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#B9B9B9]">
                  {loading ? "Changing..." : "Change Password"}
                </span>
              </button>

              {/* Back to Login */}
              <p
                className="text-center mt-3"
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#A3A3A3",
                }}
              >
                Back to{" "}
                <span
                  onClick={() => nav("/auth/login")}
                  style={{
                    color: "#643EB2",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Login
                </span>
              </p>
            </form>
          )}
        </div>

        {/* footer */}
        <p
          className="text-center text-[14px] mt-16"
          style={{ color: "#A3A3A3" }}
        >
          © {new Date().getFullYear()} Gradia. All rights reserved.
        </p>
      </div>
    </div>
  );
}

ResetPassword.propTypes = {
  initialStep: PropTypes.oneOf(["email", "otp", "newPw"]),
};
