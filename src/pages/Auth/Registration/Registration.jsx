// src/pages/Register/index.jsx
import React, { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import Mobile from "./Layout/Mobile";
import VerifyOtp from "../Verify-otp/VerifyOtp"; // ⬅️ tambahan: sama seperti di Mobile

const Registration = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return <RegisterDesktop />;
};

export default Registration;

function RegisterDesktop() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // 🔁 tambahan state supaya flow-nya sama dengan Mobile
  const [showVerify, setShowVerify] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [expiredAt, setExpiredAt] = useState("");
  const [purpose, setPurpose] = useState("");

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const DRAWER_W = 694;
  const PAD_X = 77;
  const TOP_HEADER = 80;

  const BORDER_GRADIENT =
    "linear-gradient(90deg, #656565 0%, #CBCBCB 52%, #989898 98%)";

  const gradientText = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const gradientBorderWrapper = { position: "relative", borderRadius: 8 };
  const gradientBorderOverlay = {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    padding: "1px",
    background: BORDER_GRADIENT,
    WebkitMask:
      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  };
  const inputStyle = {
    position: "relative",
    zIndex: 1,
    width: "100%",
    padding: "12px 16px",
    border: "none",
    borderRadius: 7,
    background: "rgba(0,0,0,0.35)",
    color: "white",
    outline: "none",
  };

  const handleRegister = async () => {
    setErrMsg("");

    // ✅ sama seperti Mobile: cek semua field
    if (!email || !username || !password) {
      setErrMsg("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          action: "register",
        }),
      });

      const data = await res.json(); // ✅ sama seperti Mobile

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // ✅ samakan dengan Mobile: pakai response backend untuk OTP
      setPurpose(data.purpose);
      setRegisteredEmail(email);
      setExpiredAt(data.expires_at);
      setShowVerify(true); // ganti halaman ke VerifyOtp (desktop)
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setErrMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ sama seperti Mobile: kalau sudah register sukses, langsung tampilkan VerifyOtp
  if (showVerify) {
    return (
      <VerifyOtp
        email={registeredEmail}
        expiredAt={expiredAt}
        purpose={purpose}
        from="verification"
      />
    );
  }

  // ⬇️ UI DESKTOP TETAP SAMA, tidak diubah
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/Asset 1.svg"
          alt="Asset 1"
          className="absolute z-0"
          style={{
            width: vw(1224.58),
            height: vh(739.76),
            left: vw(0.13),
            top: vh(200),
            transform: "rotate(4deg)",
            opacity: 0.9,
          }}
        />
        <img
          src="/Asset 2.svg"
          alt="Asset 2"
          className="absolute z-10"
          style={{
            width: vw(526),
            height: vh(589),
            left: vw(456),
            bottom: vh(400),
            opacity: 1,
          }}
        />
        <img
          src="/Asset 4.svg"
          alt="Asset 3"
          className="absolute z-10"
          style={{
            width: vw(632),
            height: vh(538),
            right: vw(1125),
            top: vh(100),
            transform: "rotate(-4deg)",
            opacity: 0.9,
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-20 flex h-full w-full">
        {/* LEFT */}
        <div className="flex h-full grow flex-col pt-[50px] pl-[52px]">
          <div
            className="inline-flex items-baseline gap-1 leading-none"
            style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700 }}
          >
            <span className="text-[128px] tracking-tight text-logo">
              GRA
            </span>
            <span className="text-[128px] tracking-tight text-white">
              DIA
            </span>
          </div>

          <p
            className="ml-2 -mt-2.5 font-[Inter] font-semibold leading-[1.2]"
            style={{ fontSize: 36 }}
          >
            <span
              style={{
                display: "inline-block",
                background:
                  "linear-gradient(180deg, #FAFAFA 0%, #8B8B8B 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Manage Smarter,
              <br />
              Achieve More
            </span>
          </p>
        </div>

        {/* RIGHT DRAWER */}
        <aside
          className="relative h-full flex flex-col font-[Inter]"
          style={{
            width: vw(DRAWER_W),
            background: "rgba(255,255,255,0.10)",
            border: "1px solid transparent",
            borderImageSlice: 1,
            borderImageSource: BORDER_GRADIENT,
            borderRadius: "18px",
            backdropFilter: "blur(10px)",
            color: "#A3A3A3",
            paddingLeft: PAD_X,
            paddingRight: PAD_X,
            paddingTop: TOP_HEADER,
            paddingBottom: 10,
            justifyContent: "space-between",
          }}
        >
          <div>
            <header className="text-center -mb-2.5">
              <h1
                className="text-[48px] font-extrabold leading-tight mb-2"
                style={gradientText}
              >
                Let’s Register
              </h1>
              <p className="text-[18px] leading-snug mb-10">
                Join Gradia and take control of your goals, time, and mindset —
                all in one app.
              </p>
            </header>

            {/* FORM */}
            <div>
              {/* Email */}
              <div className="mb-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <i className="ri-mail-line text-[16px]" />
                  <span className="text-[14px]">Email</span>
                </div>
                <div style={gradientBorderWrapper}>
                  <div style={gradientBorderOverlay} />
                  <input
                    type="email"
                    placeholder=" "
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="mb-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <i className="ri-account-circle-2-line text-1.5" />
                  <span className="text-[14px]">Username</span>
                </div>
                <div style={gradientBorderWrapper}>
                  <div style={gradientBorderOverlay} />
                  <input
                    type="text"
                    placeholder=" "
                    style={inputStyle}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <i className="ri-lock-2-line text-[16px]" />
                  <span className="text-[14px]">Password</span>
                </div>
                <div style={gradientBorderWrapper}>
                  <div style={gradientBorderOverlay} />
                  <input
                    type="password"
                    placeholder=" "
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {errMsg ? (
                <p className="text-red-400 text-[12px] mb-2">{errMsg}</p>
              ) : null}

              {/* REGISTER BUTTON */}
              <div className="flex justify-end mb-5">
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-1/2 px-4 py-3 text-[16px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(90deg, #4C1D95 0%, #2D0A49 100%)",
                    border: "none",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      background:
                        "linear-gradient(180deg, #FAFAFA 0%, #949494 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    {loading ? "Processing..." : "Register Now"}
                  </span>
                </button>
              </div>

              {/* FOOTER */}
              <div className="text-center">
                <p className="text-[14px] mb-[60px] mt-10">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/auth/login")}
                    className="hover:underline"
                    style={{
                      color: "#643EB2",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Login
                  </button>
                </p>
                <p className="text-[12px] leading-none">
                  © {new Date().getFullYear()} Gradia. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
