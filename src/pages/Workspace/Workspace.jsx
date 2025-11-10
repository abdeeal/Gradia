import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function GradiaWorkspacePage() {
  // === helpers ===
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  // === constants (follow original UI) ===
  const DRAWER_W = 694;
  const PAD_X = 77;
  const TOP_HEADER = 100;
  const BORDER_GRADIENT =
    "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 100%)";

  // Footer fixed 40px from bottom
  const FOOTER_OFFSET = 40; // px
  const FOOTER_H = 24; // approx footer height
  const GAP_BELOW_CREATE = 12; // gap between Create row and footer
  const CREATE_BOTTOM = FOOTER_OFFSET + FOOTER_H + GAP_BELOW_CREATE;

  const gradientText = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const workspaces = ["Semester 5", "Semester 6", "Semester 7"];

  const onEnter = (name) => {
    // hook this up to your router/navigation
    console.log("Enter:", name);
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
            <span className="text-[128px] tracking-tight text-[#9457FF]">GRA</span>
            <span className="text-[128px] tracking-tight text-white">DIA</span>
          </div>
          <p
            className="ml-2 mt-[-10px] font-[Inter] font-semibold leading-[1.2]"
            style={{ fontSize: 36 }}
          >
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(180deg, #FAFAFA 0%, #8B8B8B 100%)",
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
          className="h-full flex flex-col font-[Inter]"
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
            paddingBottom: 0,
            position: "relative",
            minHeight: "100%",
          }}
        >
          <div>
            {/* HEADER */}
            <header className="text-center mb-[36px]">
              <h1 className="text-[48px] font-extrabold leading-tight mb-2" style={gradientText}>
                Welcome to <br /> Gradia Workspace
              </h1>
              <p className="text-[18px] leading-snug">
                Your personal space to plan, grow, and achieve more.
              </p>
            </header>

            {/* WORKSPACE LIST */}
            <div className="space-y-[10px]" style={{ paddingBottom: CREATE_BOTTOM + 61 }}>
              {workspaces.map((name) => (
                <WorkspaceRow key={name} name={name} onEnter={() => onEnter(name)} />
              ))}
            </div>
          </div>

          {/* Create New fixed above footer */}
          <div style={{ position: "absolute", left: PAD_X, right: PAD_X, bottom: CREATE_BOTTOM }}>
            <CreateNewRow onClick={() => console.log("Create new workspace")} />
          </div>

          {/* Footer fixed 40px from bottom */}
          <p
            className="text-[#B9B9B9] text-[16px] w-full text-center"
            style={{ position: "absolute", left: 0, right: 0, bottom: FOOTER_OFFSET }}
          >
            © 2025 Gradia. All rights reserved.
          </p>
        </aside>
      </div>
    </div>
  );
}

function WorkspaceRow({ name, onEnter }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  return (
    <div
      className="relative flex items-center w-full h-[61px] rounded-[14px]"
      style={{ background: "#141414" }}
    >
      <div className="flex w-full items-center px-[21px]">
        <span className="inline-flex h-[35px] w-[35px] items-center justify-center">
          <i className="ri-more-2-line text-[22px] text-[#BEBEBE]" />
        </span>

        <span
          className="ml-[18.5px] inline-flex h-[35px] w-[42px] items-center justify-center rounded-md"
          style={{ background: "linear-gradient(90deg, #6A6A6A 0%, #141414 100%)" }}
        >
          <span className="text-[12px] font-semibold tracking-wide">{initials}</span>
        </span>

        <span className="ml-[16px] text-[14px] text-white font-medium">{name}</span>

        <div className="ml-auto flex items-center gap-2">
          {/* tombol enter pake gradient abu2 register (ikuti UI asli) */}
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-2 px-3 py-2 text-white"
            style={{
              background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
              border: "none",
              borderRadius: 8,
            }}
            title="Enter"
          >
            <span className="text-[14px] font-semibold">Enter</span>
            <i className="ri-login-circle-line text-[16px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateNewRow({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center w-full h-[61px] rounded-[14px] text-left"
      style={{ background: "#141414" }}
    >
      <div className="flex w-full items-center px-[21px]">
        <span className="inline-flex h-[35px] w-[35px] items-center justify-center">
          <i className="ri-add-line text-[22px] text-[#BEBEBE]" />
        </span>
        <span className="ml-[16px] text-[14px] text-white font-medium">
          Create new workspace
        </span>
      </div>
    </button>
  );
}
