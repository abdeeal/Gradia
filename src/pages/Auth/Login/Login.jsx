// src/pages/Loginpage/Login.jsx
import React, { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Mobile from "./Layout/Mobile";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return <DesktopLoginPage />;
};

function DesktopLoginPage() {
  const navigate = useNavigate();

  // ✅ Perbaikan: gunakan email, bukan username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const DRAWER_W = 694;
  const PAD_X = 77;
  const TOP_HEADER = 100;

  const BORDER_GRADIENT =
    "linear-gradient(90deg, #656565 0%, #CBCBCB 52%, #989898 98%)";

  const gradientText = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const gradientBorderWrapper = {
    position: "relative",
    borderRadius: 8,
  };

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

  // === Handler: submit login -> ke /dashboard ===
  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: panggil API auth pakai email dan password
    navigate("/dashboard");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* === BACKGROUND === */}
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

      {/* === CONTENT === */}
      <div className="relative z-20 flex h-full w-full">
        {/* LEFT SIDE */}
        <div className="flex h-full grow flex-col pt-[50px] pl-[52px]">
          <div
            className="inline-flex items-baseline gap-1 leading-none"
            style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700 }}
          >
            <span className="text-[128px] tracking-tight text-[#9457FF]">
              GRA
            </span>
            <span className="text-[128px] tracking-tight text-white">DIA</span>
          </div>
          <p
            className="ml-2 mt-[-10px] font-[Inter] font-semibold leading-[1.2]"
            style={{ fontSize: 36 }}
          >
            <span
              style={{
                display: "inline-block",
                background:
                  "linear-gradient(180deg, #FAFAFA 0%, #8B8B8B 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
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
            paddingBottom: 12,
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* HEADER */}
            <header className="text-center mb-[36px]">
              <h1
                className="text-[48px] font-extrabold leading-tight mb-2"
                style={gradientText}
              >
                Welcome Back
              </h1>
              <p className="text-[18px] leading-snug">
                Gradia helps you organize, login and turn your self-
                management into real results.
              </p>
            </header>

            {/* FORM */}
            <form onSubmit={handleLogin}>
              {/* ✅ Email */}
              <div className="mb-[12px]">
                <div className="flex items-center gap-2 mb-[4px]">
                  <i className="ri-mail-line text-[16px]" />
                  <span className="text-[14px]">Email</span>
                </div>
                <div style={gradientBorderWrapper}>
                  <div style={gradientBorderOverlay} />
                  <input
                    type="email"
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-[24px]">
                <div className="flex items-center gap-2 mb-[4px]">
                  <i className="ri-lock-2-line text-[16px]" />
                  <span className="text-[14px]">Password</span>
                </div>
                <div style={gradientBorderWrapper}>
                  <div style={gradientBorderOverlay} />
                  <input
                    type="password"
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end mb-[10px]">
                <Link
                  to="/auth/reset-password"
                  className="text-[14px] hover:text-white"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-4 mb-[14px]">
                {/* Google */}
                <button
                  type="button"
                  className="flex w-1/2 items-center justify-center gap-2 px-4 py-3 text-[16px]"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(163,163,163,0.8)",
                    borderRadius: 8,
                  }}
                  onClick={() => navigate("/dashboard")}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.23 9.24 3.64l6.9-6.9C35.9 2.38 30.29 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.65 6.71C13.03 14.21 18.04 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.5 24c0-1.64-.15-3.21-.44-4.73H24v9h12.7c-.55 2.95-2.2 5.45-4.7 7.14l7.18 5.58C43.76 37.1 46.5 31.06 46.5 24z" />
                    <path fill="#FBBC05" d="M11.21 28.93A14.5 14.5 0 0 1 9.5 24c0-1.72.31-3.36.86-4.86l-8.65-6.71A24 24 0 0 0 0 24c0 3.84.92 7.47 2.56 10.78z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.78l-7.18-5.58c-2 1.34-4.57 2.13-8.73 2.13-5.96 0-10.97-4.71-12.79-11.21l-8.65 6.71C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Google
                </button>

                {/* Log In */}
                <button
                  type="submit"
                  className="w-1/2 px-4 py-3 text-[14px] font-semibold"
                  style={{
                    background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                    border: "none",
                    borderRadius: 8,
                  }}
                >
                  <span style={gradientText}>Log In</span>
                </button>
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-[14px] mb-[48px]">
                  Don’t have an account?{" "}
                  <Link
                    to="/auth/register"
                    className="hover:underline"
                    style={{ color: "#643EB2" }}
                  >
                    Register here
                  </Link>
                </p>
                <p className="text-[14px] leading-none">
                  © {new Date().getFullYear()} Gradia. All rights reserved.
                </p>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Login;
