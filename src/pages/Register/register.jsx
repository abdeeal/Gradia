// ✅ src/pages/Register/register.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  // === CONSTANTS UI ===
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

  // === LOGIC STATE ===
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // === Validasi ringan ===
  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 3 &&
      username.trim().length >= 3 &&
      password.trim().length >= 6 &&
      !loading
    );
  }, [email, username, password, loading]);

  // === Helper: aman parsing JSON ===
  async function safeJson(res) {
    if (res.status === 204) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    throw new Error(
      `Unexpected response (${res.status} ${res.statusText}): ${text.slice(0, 200)}`
    );
  }

  // === Fetch ke API register ===
  async function registerApi({ email, username, password }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, username, password }),
    });

    if (res.type === "opaque" || res.status === 0) {
      throw new Error("Gagal memuat (CORS/opaque). Periksa backend.");
    }

    const data = await safeJson(res);

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  // === Submit handler ===
  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!canSubmit) {
      setErrorMsg("Lengkapi semua isian dengan benar.");
      return;
    }

    try {
      setLoading(true);
      await registerApi({ email, username, password });

      // jika sukses ke halaman OTP
      navigate("/register/otp", {
        replace: true,
        state: { email },
      });
    } catch (err) {
      console.error("REGISTER ERR:", err);
      setErrorMsg(err?.message || "Register gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // === UI ===
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* === BACKGROUND === */}
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
          }}
        />
        <img
          src="/Asset 4.svg"
          alt="Asset 3"
          className="absolute z-0"
          style={{
            width: vw(861),
            height: vh(726),
            right: vw(140),
            top: vh(322),
          }}
        />
      </div>

      {/* === BODY === */}
      <div
        className="relative mx-auto flex flex-col items-start justify-center"
        style={{
          width: vw(DRAWER_W),
          paddingLeft: vw(PAD_X),
          paddingRight: vw(PAD_X),
          marginTop: vh(TOP_HEADER),
        }}
      >
        <h1
          className="text-[40px] font-bold"
          style={gradientText}
        >
          Create your account
        </h1>
        <p className="text-[#B9B9B9] text-[18px] mt-[10px] mb-[40px]">
          Please fill in the details below to register
        </p>

        {/* === FORM === */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-[22px] w-full"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: `1px solid transparent`,
            borderImage: BORDER_GRADIENT,
            borderImageSlice: 1,
            padding: "32px",
            borderRadius: "24px",
          }}
        >
          {/* Email */}
          <div className="flex flex-col">
            <label className="mb-[6px] text-[#CFCFCF] text-[16px]">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border border-[#787878] rounded-xl px-4 py-3 text-white"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col">
            <label className="mb-[6px] text-[#CFCFCF] text-[16px]">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border border-[#787878] rounded-xl px-4 py-3 text-white"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="mb-[6px] text-[#CFCFCF] text-[16px]">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border border-[#787878] rounded-xl px-4 py-3 text-white"
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <p className="text-red-500 text-sm mt-[4px]">{errorMsg}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-[20px] w-full py-[12px] rounded-xl font-semibold text-[18px]
              bg-gradient-to-r from-[#8D8D8D] via-[#C9C9C9] to-[#989898]
              text-black hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Processing..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-[#B9B9B9] text-[16px] mt-[32px] text-center w-full">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-white underline hover:text-[#D1D1D1]"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
