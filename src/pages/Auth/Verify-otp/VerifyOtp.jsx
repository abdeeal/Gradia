// src/pages/Loginpage/VerifyOtp.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import Mobile from "./Layout/Mobile";
import { useAlert } from "@/hooks/useAlert";

const RESET_PASSWORD_NEW_ROUTE = "/auth/reset-password/newpassword"; // ROUTE NEW PASSWORD (desktop)
const REGISTER_SUCCESS_ROUTE   = "/auth/success/register";

// === Endpoint tetap (TIDAK mengubah API) ===
const VERIFY_ENDPOINT  = "/api/auth/verifyOtp";
const RESEND_ENDPOINT  = "/api/auth/sendotp";

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

  /* ===== Mode/purpose detector (ketat & konsisten) =====
     HANYA mengembalikan "registration" atau "reset-password" */
  const mode = useMemo(() => {
    const byProp  = from;
    const byState = location.state?.type;
    const byQuery = new URLSearchParams(location.search).get("type");
    const raw = String(byProp || byState || byQuery || "").toLowerCase().trim();

    if (["registration", "register", "regist", "verification", "verified"].includes(raw)) {
      return "registration";
    }
    if (["reset-password", "reset", "forgot", "forgot-password"].includes(raw)) {
      return "reset-password";
    }

    // fallback dari URL path (mis. /auth/reset-password/verify-otp)
    const path = (location.pathname || "").toLowerCase();
    if (path.includes("reset")) return "reset-password";

    // default aman → registration
    return "registration";
  }, [from, location.state, location.search, location.pathname]);

  // (Opsional) trace saat dev — aman untuk dihapus setelah beres
  useEffect(() => {
    // console.debug("[VerifyOtp] mode:", mode);
  }, [mode]);

  /* ===== Email final ===== */
  const emailFromSession = typeof window !== "undefined" ? sessionStorage.getItem("registerEmail") : "";
  const emailFromNav     = location.state?.email;
  const emailToUse = (emailFromSession || emailFromNav || email || user?.email || "")
    .trim()
    .toLowerCase();

  /* ===== OTP state & timer ===== */
  const OTP_LENGTH = 6;
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputsRef = useRef([]);

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const exp = expiredAt || location.state?.expires_at;
    if (!exp) return 5 * 60;
    const diff = Math.floor((new Date(exp).getTime() - Date.now()) / 1000);
    return diff > 0 ? Math.min(diff, 5 * 60) : 5 * 60;
  });

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending]   = useState(false);

  // IME guard + auto-advance
  const [isComposing, setIsComposing] = useState(false);
  const AUTO_ADVANCE_DELAY = 180; // ms
  const autoTimersRef = useRef([]);

  // countdown timer
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // guard registration tanpa email (akses langsung)
  useEffect(() => {
    if (mode === "registration" && !emailToUse) {
      showError("Email tidak ditemukan", "Silakan ulangi proses registrasi.");
      navigate("/registration", { replace: true });
    }
  }, [mode, emailToUse, navigate]);

  // jaga fokus kotak aktif
  useEffect(() => {
    const el = inputsRef.current[activeIndex];
    if (el) el.focus();
  }, [activeIndex]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const timerLabel = `${mm}:${ss}`;

  /* ===== Input handlers (halus) ===== */
  const moveLeft  = () => setActiveIndex((i) => Math.max(0, i - 1));
  const moveRight = () => setActiveIndex((i) => Math.min(OTP_LENGTH - 1, i + 1));

  const onDigitChange = (i, raw) => {
    if (isComposing) return;
    const v = String(raw || "").replace(/\D/g, "").slice(0, 1);

    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });

    if (autoTimersRef.current[i]) clearTimeout(autoTimersRef.current[i]);
    if (v && i < OTP_LENGTH - 1) {
      autoTimersRef.current[i] = setTimeout(() => setActiveIndex(i + 1), AUTO_ADVANCE_DELAY);
    }
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        if (next[i]) {
          next[i] = "";
          return next;
        }
        if (!next[i] && i > 0) {
          next[i - 1] = "";
          setActiveIndex(i - 1);
          return next;
        }
        return next;
      });
      return;
    }
    if (e.key === "ArrowLeft")  { e.preventDefault(); moveLeft();  return; }
    if (e.key === "ArrowRight") { e.preventDefault(); moveRight(); return; }
    if (e.key === "Enter")      { e.preventDefault(); handleVerify(); return; }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      onDigitChange(i, e.key);
    }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setActiveIndex(Math.min(text.length, OTP_LENGTH - 1));
  };

  // Auto-send OTP sekali untuk reset-password
  const sentOnceRef = useRef(false);
  const sendOtpResetOnce = async () => {
    if (sentOnceRef.current) return;
    if (!emailToUse) return;
    try {
      sentOnceRef.current = true;
      await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          purpose: "reset-password",
        }),
      });
      setSecondsLeft(5 * 60);
    } catch (e) {
      showError("Auto send OTP gagal", String(e?.message || e));
    }
  };

  useEffect(() => {
    if (mode === "reset-password") {
      sendOtpResetOnce();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, emailToUse]);

  /* ===== Actions (sesuai API sekarang) ===== */
  const handleVerify = async () => {
    const code = digits.join("");
    if (!emailToUse) {
      showError("Email tidak ditemukan", "Silakan ulangi proses.");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      const firstEmpty = digits.findIndex((d) => !d);
      if (firstEmpty >= 0) setActiveIndex(firstEmpty);
      showError("OTP belum lengkap", "Lengkapi semua 6 digit kode OTP.");
      return;
    }

    try {
      setSubmitting(true);

      // === API: hanya kirim email & otp_code
      const res = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, otp_code: code }),
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`;
        showError("Verification Failed", String(msg));
        return;
      }

      // Sukses → routing berdasarkan mode UI (tanpa popup sukses)
      if (mode === "registration") {
        try { sessionStorage.removeItem("registerEmail"); } catch {}
        navigate(REGISTER_SUCCESS_ROUTE, {
          replace: true,
          state: { type: "registration" },
        });
      } else {
        navigate(RESET_PASSWORD_NEW_ROUTE, {
          replace: true,
          state: { type: "New-Password", email: emailToUse },
        });
      }
    } catch (err) {
      showError("Network/JSON Error", String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailToUse) {
      showError("Email tidak ditemukan", "Silakan ulangi proses.");
      return;
    }
    try {
      setResending(true);

      const payload =
        mode === "reset-password"
          ? { email: emailToUse, purpose: "reset-password" }
          : { email: emailToUse };

      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`;
        showError("Resend OTP Failed", String(msg));
        return;
      }

      setDigits(Array(OTP_LENGTH).fill(""));
      setActiveIndex(0);
      setSecondsLeft(5 * 60);
    } catch (err) {
      showError("Network Error", String(err?.message || err));
    } finally {
      setResending(false);
    }
  };

  /* ===== Mobile/Tablet: tetap pakai layout Mobile tanpa ubah API ===== */
  if (isMobile || isTablet) {
    return (
      <Mobile email={email} expiredAt={expiredAt} from={from} user={user} purpose={purpose} />
    );
  }

  /* ===== Desktop UI (DESAIN TETAP) ===== */
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const OTPBox = ({ count = OTP_LENGTH, boxW, boxH, gap, rounded = "0px" }) => (
    <div className="flex justify-between" style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          name={`otp-${i}`}
          pattern="\d*"
          maxLength={1}
          value={digits[i]}
          onClick={() => setActiveIndex(i)}
          onFocus={(e) => { e.currentTarget.select(); setActiveIndex(i); }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            if (e.currentTarget.value) onDigitChange(i, e.currentTarget.value);
          }}
          onChange={(e) => onDigitChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          ref={(el) => (inputsRef.current[i] = el)}
          className="text-center text-2xl outline-none focus:ring-0"
          style={{
            width: boxW,
            height: boxH,
            background: "rgba(101,101,101,0.05)",
            border: "1px solid rgba(101,101,101,0.5)",
            borderRadius: rounded,
            color: "#A3A3A3",
          }}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );

  const CommonUI = () => {
    const title = mode === "reset-password" ? "Forgot Password?" : "Verify Your Email Address";

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
          className="absolute inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />

        <div className="relative z-10 flex h-full w-full flex-col items-center">
          <div style={{ marginTop: `80px` }} className="text-center">
            <h1
              className="font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#949494]"
              style={{ fontSize: "48px", lineHeight: 1.3 }}
            >
              {title}
            </h1>
            <p
              className="mx-auto font-semibold"
              style={{ width: "540px", fontSize: "20px", marginTop: "4px", color: "#A3A3A3" }}
            >
              Enter the 6-digits code sent to your email.
            </p>
          </div>

          <div
            className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
            style={{ width: `818px`, height: `291px`, marginTop: `62px` }}
          >
            <div className="h-full w-full" style={{ paddingLeft: `37px`, paddingRight: `37px` }}>
              <div style={{ marginTop: `32px` }}>
                <OTPBox boxW={`99px`} boxH={`111px`} gap={`30px`} rounded="0px" />
              </div>

              <div className="text-center text-[14px]" style={{ marginTop: `12px`, color: "#A3A3A3" }}>
                {timerLabel}
              </div>

              <div className="w-full flex justify-center" style={{ marginTop: `8px` }}>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={submitting}
                  className="rounded-2xl shadow-md transition hover:opacity-95 flex items-center justify-center disabled:opacity-60"
                  style={{
                    width: `486px`,
                    height: "55px",
                    background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                  }}
                >
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#B9B9B9] font-bold"
                    style={{ fontSize: "20px", lineHeight: "1.5" }}
                  >
                    {submitting ? "Verifying..." : "Verify"}
                  </span>
                </button>
              </div>

              <div className="text-center text-[14px]" style={{ marginTop: `8px` }}>
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

  return <CommonUI />;
};

export default VerifyOtp;
