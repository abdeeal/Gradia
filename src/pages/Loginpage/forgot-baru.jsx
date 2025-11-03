// src/pages/Loginpage/forgot-input.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ForgetInput() {
  const navigate = useNavigate();

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const TITLE_TOP = 110;
  const SUB_TO_CARD = 64;
  const CARD_W = 540;
  const CARD_H = 210;
  const CARD_PAD_X = 65;
  const CARD_PAD_Y = 22;

  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // setelah validasi/submit API sukses, arahkan ke halaman success
    navigate("/login/forgot-success");
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* BACKGROUND */}
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

      {/* OVERLAY */}
      <div
        className="absolute inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10 flex h-full w-full flex-col items-center">
        {/* Title & Subtitle */}
        <div style={{ marginTop: `${TITLE_TOP}px` }} className="text-center">
          <h1
            className="font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#949494]"
            style={{ fontSize: "48px", lineHeight: 1.3 }}
          >
            New Password
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
            Enter your new password here
          </p>
        </div>

        {/* CARD */}
        <div
          className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
          style={{
            width: `${CARD_W}px`,
            height: `${CARD_H}px`,
            marginTop: `${SUB_TO_CARD}px`,
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="h-full w-full"
            style={{
              paddingLeft: `${CARD_PAD_X}px`,
              paddingRight: `${CARD_PAD_X}px`,
              paddingTop: `${CARD_PAD_Y}px`,
              paddingBottom: `${CARD_PAD_Y}px`,
            }}
          >
            {/* Label dengan ikon di kiri */}
            <div className="flex items-center gap-2 mb-2">
              <i
                className="ri-lock-password-line"
                style={{ color: "#A3A3A3", fontSize: "16px" }}
              />
              <label
                htmlFor="password"
                className="text-sm tracking-wide"
                style={{ color: "#A3A3A3" }}
              >
                New Password
              </label>
            </div>

            {/* Input */}
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[44px] rounded-md bg-transparent px-3 outline-none text-[15px]"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#EAEAEA",
              }}
              placeholder=" "
              autoComplete="new-password"
            />

            {/* Button */}
            <button
              type="submit"
              className="w-full mt-4 rounded-md h-[46px] shadow-md transition hover:opacity-95"
              style={{
                background:
                  "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
              }}
            >
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9]">
                Update Password
              </span>
            </button>

            {/* Back to Login */}
            <div className="w-full text-center mt-4 text-sm">
              <span style={{ color: "#A3A3A3" }}>Back to </span>
              <Link
                to="/login"
                className="font-bold hover:opacity-90"
                style={{ color: "#643EB2" }}
              >
                Login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
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
