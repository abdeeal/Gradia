// src/pages/Loginpage/VerifyOtp.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import Mobile from "./Layout/Mobile";
import { useAlert } from "@/hooks/useAlert";
import OtpInput from "./components/OtpInput";

const RESET_PASSWORD_NEW_ROUTE = "/auth/reset-password/newpassword"; // ROUTE NEW PASSWORD (desktop)
const REGISTER_SUCCESS_ROUTE = "/auth/success/register";

// === Endpoint tetap (TIDAK mengubah API path) ===
const VERIFY_ENDPOINT = "/api/auth/verifyOtp";
const RESEND_ENDPOINT = "/api/auth/sendOtp";

// Purpose constants (hanya dipakai di FE & juga dikirim sebagai action)
const PURPOSE_REGISTRATION = "registration";
const PURPOSE_RESET_PASSWORD = "reset-password";

/* =======================
   Komponen OTPBox (desktop)
   ======================= */
const OTPBox = React.memo(function OTPBox({ length, onChange }) {
  return (
    <div>
      <OtpInput length={length} onChange={onChange} />
    </div>
  );
});

/* =======================
   Layout Desktop (CommonUI)
   ======================= */
const CommonUIDesktop = ({
  mode,
  OTP_LENGTH,
  timerLabel,
  submitting,
  resending,
  onVerify,
  onResend,
  onOtpChange,
}) => {
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const title =
    mode === "reset-password" ? "Forgot Password?" : "Verify Your Email Address";

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* BG dekor */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/Asset 1.svg"
          alt="Asset 1"
          className="absolute z-0"
          style={{
            width: vw(1410.82),
            height: vh(1185.82),
            left: vw(300.13),
            top: vh(20),
            transform: "rotate(-360deg)",
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
      <div
        className="absolute inset-0 z-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center">
        <div style={{ marginTop: `80px` }} className="text-center">
          <h1
            className="font-bold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#949494]"
            style={{ fontSize: "48px", lineHeight: 1.3 }}
          >
            {title}
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
            Enter the 6-digits code sent to your email.
          </p>
        </div>

        <div
          className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
          style={{ width: `819px`, height: `320px`, marginTop: `62px` }}
        >
          <div className="h-full w-full mt-12 px-12">
            <div>
              {/* OTPBox: OtpInput dibungkus di komponen terpisah, lebih stabil */}
              <OTPBox length={OTP_LENGTH} onChange={onOtpChange} />
            </div>

            <div
              className="text-center text-[14px]"
              style={{ marginTop: `12px`, color: "#A3A3A3" }}
            >
              {timerLabel}
            </div>

            <div
              className="w-full flex justify-center"
              style={{ marginTop: `8px` }}
            >
              <button
                type="button"
                onClick={onVerify}
                disabled={submitting}
                className="rounded-2xl shadow-md transition hover:opacity-95 flex items-center justify-center disabled:opacity-60"
                style={{
                  width: `486px`,
                  height: "55px",
                  background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!submitting)
                    e.currentTarget.style.filter = "brightness(1.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                {submitting && (
                  <i className="ri-loader-4-line animate-spin mr-2" />
                )}
                <span
                  className="text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#B9B9B9] font-bold"
                  style={{ fontSize: "20px", lineHeight: "1.5" }}
                >
                  {submitting ? "Verifying..." : "Verify"}
                </span>
              </button>
            </div>

            <div
              className="text-center text-[14px]"
              style={{ marginTop: `24px` }}
            >
              <span style={{ color: "#A3A3A3" }}>Didn’t receive the code?</span>{" "}
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                style={{
                  color: "#643EB2",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="hover:opacity-90 font-bold disabled:opacity-60"
                onMouseEnter={(e) => {
                  if (!resending)
                    e.currentTarget.style.filter = "brightness(1.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                {resending ? "Resending..." : "Resend code"}
              </button>
            </div>
          </div>
        </div>

        <p
          className="text-center text-[14px] mt-14"
          style={{ color: "#A3A3A3" }}
        >
          © {new Date().getFullYear()} Gradia. All rights reserved.
        </p>
      </div>
    </div>
  );
};

/* =======================
   MAIN COMPONENT
   ======================= */
const VerifyOtp = ({ email, expiredAt, from, user, purpose }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  /* ===== Alert destructive-only (tanpa success) ===== */
  const showError = (title, desc) =>
    showAlert({
      icon: "ri-error-warning-fill",
      title,
      desc,
      variant: "destructive",
      width: 676,
      height: 380,
    });

  /* ===== Mode/purpose detector (SUPER ROBUST, tanpa ubah UI) ===== */
  const mode = useMemo(() => {
    const path = String(location.pathname || "").toLowerCase();

    // 1) Explicit purpose wins (paling aman)
    const p1 = String(purpose || "").toLowerCase().trim();
    const p2 = String(location.state?.purpose || "").toLowerCase().trim();
    const explicitPurpose = p1 || p2;

    if (explicitPurpose === PURPOSE_RESET_PASSWORD) return "reset-password";
    if (explicitPurpose === PURPOSE_REGISTRATION) return "registration";

    // 2) Type / query / from
    const byProp = from;
    const byState = location.state?.type;
    const byQuery = new URLSearchParams(location.search).get("type");

    const raw = String(byProp || byState || byQuery || "")
      .toLowerCase()
      .trim();

    // Reset aliases (tambah variasi yang umum)
    if (
      [
        "reset-password",
        "resetpassword",
        "reset",
        "forgot",
        "forgot-password",
        "forgotpassword",
        "new-password",
        "newpassword",
      ].includes(raw)
    ) {
      return "reset-password";
    }

    // Registration aliases
    if (["registration", "register", "regist"].includes(raw)) {
      return "registration";
    }

    // 3) Path hint (kalau rute kamu mengandung "reset")
    if (
      path.includes("reset-password") ||
      path.includes("forgot") ||
      path.includes("/reset")
    ) {
      return "reset-password";
    }

    // Default aman
    return "registration";
  }, [from, purpose, location.pathname, location.search, location.state]);

  /* ===== Email final ===== */
  const emailFromSession =
    typeof window !== "undefined" ? sessionStorage.getItem("registerEmail") : "";
  const emailFromNav = location.state?.email;

  const emailToUse = (
    mode === "registration"
      ? emailFromSession || emailFromNav || email || user?.email || ""
      : emailFromNav || email || user?.email || ""
  )
    .trim()
    .toLowerCase();

  /* ===== OTP state & timer ===== */
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState("");

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const exp = expiredAt || location.state?.expires_at;
    if (!exp) return 5 * 60;
    const diff = Math.floor((new Date(exp).getTime() - Date.now()) / 1000);
    return diff > 0 ? Math.min(diff, 5 * 60) : 5 * 60;
  });

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // guard auto-send supaya cuma sekali
  const sentOnceRef = useRef(false);

  // countdown timer
  useEffect(() => {
    const t = setInterval(
      () => setSecondsLeft((p) => (p <= 1 ? 0 : p - 1)),
      1000
    );
    return () => clearInterval(t);
  }, []);

  // guard registration tanpa email
  useEffect(() => {
    if (mode === "registration" && !emailToUse) {
      showError("Email tidak ditemukan", "Silakan ulangi proses registrasi.");
      navigate("/registration", { replace: true });
    }
  }, [mode, emailToUse, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const timerLabel = `${mm}:${ss}`;

  /* ===== Handler perubahan OTP (stabil) ===== */
  const handleOtpChange = useCallback((code) => {
    setOtp(code);
  }, []);

  /* ===== Verify ===== */
  const handleVerify = async () => {
    const code = otp;

    if (!emailToUse) {
      showError("Email tidak ditemukan", "Silakan ulangi proses.");
      return;
    }

    if (!code || code.length < OTP_LENGTH) {
      showError("OTP belum lengkap", "Lengkapi semua 6 digit kode OTP.");
      return;
    }

    try {
      setSubmitting(true);

      // api/auth/verify expects `action` = "registration" / "reset-password"
      const action =
        mode === "reset-password"
          ? PURPOSE_RESET_PASSWORD
          : PURPOSE_REGISTRATION;

      const res = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          otp_code: code,
          action,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`;
        showError("Verification Failed", String(msg));
        return;
      }

      if (mode === "registration") {
        try {
          sessionStorage.removeItem("registerEmail");
        } catch {}
        navigate(REGISTER_SUCCESS_ROUTE, {
          replace: true,
          state: { type: "registration" },
        });
      } else {
        navigate(RESET_PASSWORD_NEW_ROUTE, {
          replace: true,
          // type/purpose diset konsisten supaya step berikutnya juga aman
          state: { type: "reset-password", purpose: "reset-password", email: emailToUse },
        });
      }
    } catch (err) {
      showError("Network/JSON Error", String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== Resend ===== */
  const handleResend = async () => {
    if (!emailToUse) {
      showError("Email tidak ditemukan", "Silakan ulangi proses.");
      return;
    }
    try {
      setResending(true);

      const payload = {
        email: emailToUse,
        purpose:
          mode === "reset-password"
            ? PURPOSE_RESET_PASSWORD
            : PURPOSE_REGISTRATION,
      };

      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`;
        showError("Resend OTP Failed", String(msg));
        return;
      }

      // clear OTP & reset timer
      setOtp("");
      setSecondsLeft(5 * 60);
    } catch (err) {
      showError("Network Error", String(err?.message || err));
    } finally {
      setResending(false);
    }
  };

  /* ===== Mobile/Tablet: tetap pakai layout Mobile apa adanya ===== */
  if (isMobile || isTablet) {
    return (
      <Mobile
        email={email}
        expiredAt={expiredAt}
        from={from}
        user={user}
        purpose={purpose}
      />
    );
  }

  /* ===== Desktop: pakai CommonUIDesktop ===== */
  return (
    <CommonUIDesktop
      mode={mode}
      OTP_LENGTH={OTP_LENGTH}
      timerLabel={timerLabel}
      submitting={submitting}
      resending={resending}
      onVerify={handleVerify}
      onResend={handleResend}
      onOtpChange={handleOtpChange}
    />
  );
};

export default VerifyOtp;
