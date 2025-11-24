// src/pages/Register/SuccessMsg.jsx
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import Mobile from "./Layout/Mobile";

// ===== Presentational (Desktop) =====
function RegisterSuccess() {
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;
  const GAP_TITLE_TO_P = vh(20);
  const GAP_P_TO_LINK = vh(36);
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
        <div
          className="flex items-center justify-center gap-[0.5vw]"
          style={{ marginTop: vh(100) }}
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
            Email Verified Successfully
          </h1>
          <i
            className="ri-checkbox-circle-fill"
            style={{ fontSize: vw(40), color: "#FAFAFA", marginTop: vh(2) }}
          />
        </div>

        <div style={{ height: GAP_TITLE_TO_P }} />

        <div style={{ width: vw(646) }}>
          <p
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: vw(20),
              color: "#A3A3A3",
              lineHeight: 1.2,
            }}
          >
            Your email has been successfully verified.
            <br />
            You can now log in and continue managing your goals with Gradia.
          </p>
        </div>

        <div style={{ height: GAP_P_TO_LINK }} />

        <a
          href="/auth/login"
          className="hover:underline"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: vw(16),
            width: vw(206.5),
            display: "inline-block",
            cursor: "pointer", // ← DITAMBAHKAN
          }}
        >
          <span style={{ color: "#A3A3A3" }}>Back to</span>{" "}
          <span style={{ color: "#8B5CF6" }}>Login</span>
        </a>

        <div style={{ height: GAP_LINK_TO_CC }} />

        <div
          className="flex items-center justify-center gap-[0.3vw]"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: vw(14),
            color: "#A3A3A3",
          }}
        >
          <i className="ri-copyright-line" />
          <span>{new Date().getFullYear()} Gradia. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}

function ForgotSuccess() {
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;
  const GAP_TITLE_TO_P = vh(20);
  const GAP_P_TO_LINK = vh(36);
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
        <div
          className="flex items-center justify-center gap-[0.5vw]"
          style={{ marginTop: vh(100) }}
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
            style={{ fontSize: vw(40), color: "#FAFAFA", marginTop: vh(2) }}
          />
        </div>

        <div style={{ height: GAP_TITLE_TO_P }} />

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

        <a
          href="/auth/login"
          className="hover:underline"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: vw(16),
            width: vw(206.5),
            display: "inline-block",
            cursor: "pointer", // ← DITAMBAHKAN
          }}
        >
          <span style={{ color: "#A3A3A3" }}>Back to</span>{" "}
          <span style={{ color: "#8B5CF6" }}>Login</span>
        </a>

        <div style={{ height: GAP_LINK_TO_CC }} />

        <div
          className="flex items-center justify-center gap-[0.3vw]"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: vw(14),
            color: "#A3A3A3",
          }}
        >
          <i className="ri-copyright-line" />
          <span>{new Date().getFullYear()} Gradia. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}

// ===== Wrapper (Mobile/Tablet vs Desktop) =====
export default function SuccessMsg({ type: typeProp }) {
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  const type = useMemo(() => {
    const byProp = typeProp;
    const byState = location.state?.type;
    const byQuery = new URLSearchParams(location.search).get("type");
    const raw = (byProp || byState || byQuery || "register").toLowerCase();
    return raw === "reset" ? "reset" : "register";
  }, [typeProp, location.state, location.search]);

  if (isMobile || isTablet) return <Mobile type={type} />;

  return type === "reset" ? <ForgotSuccess /> : <RegisterSuccess />;
}
