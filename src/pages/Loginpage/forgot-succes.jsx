// src/pages/Loginpage/ForgotSuccess.jsx
import { Link } from "react-router-dom";

export default function ForgotSuccess() {
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const GAP_TITLE_TO_P = vh(20);
  const GAP_P_TO_LINK  = vh(36);
  const GAP_LINK_TO_CC = vh(160);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/Asset 1.svg"
          alt="Asset 1"
          className="absolute z-0"
          style={{
            width: vw(1410.82),
            height: vh(1185.82),
            left: vw(300.13),
            top: vh(-20),
            transform: "rotate(-360deg)",
            transformOrigin: "50% 50%",
            opacity: 0.9,
          }}
        />
        <img
          src="/Asset 2.svg"
          alt="Asset 2"
          className="absolute z-0"
          style={{
            width: vw(778),
            height: vh(871),
            left: vw(58),
            bottom: vh(114),
            opacity: 1,
          }}
        />
        <img
          src="/Asset 4.svg"
          alt="Asset 3"
          className="absolute z-0"
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
      <div className="relative z-20 flex h-full flex-col items-center justify-center text-center">
        {/* JUDUL */}
        <div
          className="flex items-center justify-center gap-[0.5vw]"
          style={{ marginTop: vh(100) }} // 🔽 geser judul sedikit ke bawah
        >
          <h1
            className="font-extrabold leading-tight"
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: vw(48),
              backgroundImage: "linear-gradient(180deg, #FAFAFA 0%, #949494 100%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              display: "inline-block",
            }}
          >
            Password Reset Successful
          </h1>
          <i
            className="ri-checkbox-circle-fill"
            style={{
              fontSize: vw(40),
              color: "#FAFAFA",
              marginTop: vh(2),
            }}
          />
        </div>

        <div style={{ height: GAP_TITLE_TO_P }} />

        {/* PARAGRAF */}
        <div style={{ width: vw(646) }}>
          <p
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: vw(20),
              color: "#A3A3A3",
              lineHeight: 1.2,
            }}
          >
            Your password has been successfully updated.
            <br />
            You can now log in and continue managing your goals with Gradia.
          </p>
        </div>

        <div style={{ height: GAP_P_TO_LINK }} />

        {/* BACK TO LOGIN */}
        <Link
          to="/login"
          className="hover:underline"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: vw(16),
            width: vw(206.5),
            display: "inline-block",
          }}
        >
          <span style={{ color: "#A3A3A3" }}>Back to</span>{" "}
          <span style={{ color: "#8B5CF6" }}>Login</span>
        </Link>

        <div style={{ height: GAP_LINK_TO_CC }} />

        {/* COPYRIGHT */}
        <div
          className="flex items-center justify-center gap-[0.3vw]"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: vw(14),
            color: "#A3A3A3",
          }}
        >
          <i className="ri-copyright-line" />
          <span>2025 Gradia. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
