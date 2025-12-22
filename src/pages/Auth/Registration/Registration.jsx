import React, { useEffect, useState } from "react"; // React + hooks state & effect
import { useMediaQuery } from "react-responsive"; // Untuk deteksi ukuran layar (responsive)
import { useNavigate } from "react-router-dom"; // Untuk navigasi halaman
import Mobile from "./Layout/Mobile"; // Layout untuk Mobile/Tablet
import VerifyOtp from "../Verify-otp/VerifyOtp"; // Komponen verifikasi OTP setelah register
import PasswordRule from "./components/PasswordRule"; // Komponen penampilan rule password

const Registration = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 }); // true jika layar <= 767px
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 }); // true jika 768px - 1024px

  if (isMobile || isTablet) return <Mobile />; // Jika mobile/tablet pakai layout Mobile
  return <RegisterDesktop />; // Jika desktop pakai layout RegisterDesktop
};

export default Registration;

function RegisterDesktop() {
  const navigate = useNavigate(); // Hook untuk pindah route

  //nyimpen input
  const [email, setEmail] = useState(""); // State untuk input email
  const [username, setUsername] = useState(""); // State untuk input username
  const [password, setPassword] = useState(""); // State untuk input password
  const [loading, setLoading] = useState(false); // State loading saat proses register
  const [errMsg, setErrMsg] = useState(""); // State untuk pesan error

  //aturan pw
  const [passwordFocused, setPasswordFocused] = useState(false); // Menandai apakah input password sedang fokus
  const [passwordFocusedOnce, setPasswordFocusedOnce] = useState(false); // Menandai apakah password pernah difokuskan
  const [passwordValidationDismissed, setPasswordValidationDismissed] =
    useState(false); // Menyembunyikan validasi password setelah valid dan blur
  const passwordRules = {
    length: password.length >= 8, // Rule: minimal 8 karakter
    uppercase: /[A-Z]/.test(password), // Rule: ada huruf kapital
    number: /\d/.test(password), // Rule: ada angka
    special: /[^A-Za-z0-9]/.test(password), // Rule: ada karakter spesial
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean); // Password valid jika semua rule true

  useEffect(() => {
    // Jika password menjadi tidak valid lagi, tampilkan kembali validasi
    if (!isPasswordValid) {
      setPasswordValidationDismissed(false);
    }
  }, [isPasswordValid]);

  const showPasswordValidation =
    !passwordValidationDismissed && (passwordFocusedOnce || passwordFocused); // Kondisi tampilnya panel validasi password

  const [showVerify, setShowVerify] = useState(false); // Switch tampilan ke VerifyOtp jika true
  const [registeredEmail, setRegisteredEmail] = useState(""); // Menyimpan email yang akan diverifikasi OTP
  const [expiredAt, setExpiredAt] = useState(""); // Menyimpan expiry OTP dari API
  const [purpose, setPurpose] = useState(""); // Menyimpan purpose OTP dari API

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`; // Helper convert px ke vw (berdasarkan desain 1440)
  const vh = (px) => `calc(${(px / 768) * 100}vh)`; // Helper convert px ke vh (berdasarkan desain 768)

  const DRAWER_W = 694; // Lebar panel kanan (drawer)
  const PAD_X = 77; // Padding kiri/kanan drawer
  const TOP_HEADER = 80; // Konstanta header atas 

  const BORDER_GRADIENT =
    "linear-gradient(90deg, #656565 0%, #CBCBCB 52%, #989898 98%)"; // Gradient border

  const gradientText = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)", // Gradient teks
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const gradientBorderWrapper = { position: "relative", borderRadius: 8 }; // Wrapper untuk border gradient
  const gradientBorderOverlay = {
    content: '""', // Pseudo-element overlay
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    padding: "1px",
    background: BORDER_GRADIENT, // Warna border gradient
    WebkitMask:
      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  };
  const inputStyle = {
    position: "relative",
    zIndex: 1, // Pastikan input di atas overlay
    width: "100%",
    padding: "12px 16px",
    border: "none",
    borderRadius: 7,
    background: "rgba(0,0,0,0.35)", // Background input semi transparan
    color: "white",
    outline: "none",
  };

  const handleRegister = async () => {
    setErrMsg(""); // Reset error message setiap submit

    if (!isPasswordValid) {
      // Cegah register jika password belum memenuhi rule
      setErrMsg("Password does not meet the requirements.");
      return;
    }
    if (!email || !username || !password) {
      // Cegah register jika field kosong
      setErrMsg("Please fill all fields.");
      return;
    }

    setLoading(true); // Aktifkan loading

    try {
      // Panggil endpoint API register
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          action: "register", // Action register untuk backend
        }),
      });

      const data = await res.json(); // Parse JSON response

      if (!res.ok) {
        // Jika status bukan 2xx lempar error
        throw new Error(data.error || "Registration failed");
      }
      setPurpose(data.purpose); // Simpan purpose dari backend
      setRegisteredEmail(email); // Simpan email untuk VerifyOtp
      setExpiredAt(data.expires_at); // Simpan waktu kadaluarsa OTP
      setShowVerify(true); // Ganti tampilan ke VerifyOtp (desktop)
    } catch (err) {
      // Tangani error register
      console.error("REGISTER ERROR:", err);
      setErrMsg(err.message || "Something went wrong.");
    } finally {
      // Matikan loading apa pun hasilnya
      setLoading(false);
    }
  };

  if (showVerify) {
    // Jika sudah minta OTP, tampilkan halaman VerifyOtp
    return (
      <VerifyOtp
        email={registeredEmail} // Email yang diverifikasi
        expiredAt={expiredAt} // Expired OTP
        purpose={purpose} // Purpose OTP
        from="verification" // Penanda sumber (untuk logic VerifyOtp)
      />
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/Asset 1.svg"
          alt="Asset 1"
          className="absolute z-0"
          style={{
            width: vw(1224.58), // Lebar responsif berbasis desain
            height: vh(739.76), // Tinggi responsif berbasis desain
            left: vw(0.13), // Posisi kiri
            top: vh(200), // Posisi atas
            transform: "rotate(4deg)", // Rotasi dekorasi
            opacity: 0.9, // Transparansi
          }}
        />
        <img
          src="/Asset 2.svg"
          alt="Asset 2"
          className="absolute z-10"
          style={{
            width: vw(526), // Lebar asset
            height: vh(589), // Tinggi asset
            left: vw(456), // Posisi kiri
            bottom: vh(400), // Posisi bawah
            opacity: 1, // Transparansi
          }}
        />
        <img
          src="/Asset 4.svg"
          alt="Asset 3"
          className="absolute z-10"
          style={{
            width: vw(632), // Lebar asset
            height: vh(538), // Tinggi asset
            right: vw(1125), // Posisi kanan
            top: vh(100), // Posisi atas
            transform: "rotate(-4deg)", // Rotasi dekorasi
            opacity: 0.9, // Transparansi
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-20 flex h-full w-full">
        {/* LEFT */}
        <div className="flex h-full grow flex-col pt-[50px] pl-[52px]">
          <div
            className="inline-flex items-baseline gap-1 leading-none"
            style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700 }} // Style font logo
          >
            <span className="text-[128px] tracking-tight text-logo">GRA</span>
            <span className="text-[128px] tracking-tight text-white">DIA</span>
          </div>

          <p
            className="ml-2 -mt-2.5 font-[Inter] font-semibold leading-[1.2]"
            style={{ fontSize: 36 }} // Ukuran teks tagline
          >
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(180deg, #FAFAFA 0%, #8B8B8B 100%)", // Gradient teks tagline
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
            width: vw(DRAWER_W), // Lebar drawer responsif
            background: "rgba(255,255,255,0.10)", // Background transparan
            border: "1px solid transparent",
            borderImageSlice: 1,
            borderImageSource: BORDER_GRADIENT, // Border gradient
            borderRadius: "18px",
            backdropFilter: "blur(10px)", // Blur background
            color: "#A3A3A3", // Warna teks default
            paddingLeft: PAD_X, // Padding kiri
            paddingRight: PAD_X, // Padding kanan
            paddingTop: 48, // Padding atas
            paddingBottom: 10, // Padding bawah
            justifyContent: "space-between", // Sebar konten atas-bawah
          }}
        >
          <div>
            <header className="text-center -mb-2.5">
              <h1
                className="text-[48px] font-extrabold leading-tight mb-2"
                style={gradientText} // Gradient title
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
                    type="email" // Input email
                    placeholder=" "
                    style={inputStyle} // Style input
                    value={email} // Controlled input
                    onChange={(e) => setEmail(e.target.value)} // Update state email
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
                    type="text" // Input username
                    placeholder=" "
                    style={inputStyle} // Style input
                    value={username} // Controlled input
                    onChange={(e) => setUsername(e.target.value)} // Update state username
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
                    type="password" // Input password
                    placeholder=" "
                    style={inputStyle} // Style input
                    value={password} // Controlled input
                    onChange={(e) => setPassword(e.target.value)} // Update state password
                    onFocus={() => {
                      setPasswordFocused(true); // Tandai sedang fokus
                      setPasswordFocusedOnce(true); // Tandai pernah fokus
                    }}
                    onBlur={() => {
                      setPasswordFocused(false); // Tandai tidak fokus
                      if (isPasswordValid) {
                        setPasswordValidationDismissed(true); // Jika valid saat blur, sembunyikan panel rule
                      }
                    }}
                    autoComplete="new-password" // Hindari autofill password lama
                  />
                </div>
                {showPasswordValidation && (
                  // Panel rule password (tampil saat fokus/pernah fokus dan belum dismissed)
                  <div className="flex flex-col gap-2 text-[14px] mt-2">
                    <PasswordRule
                      valid={passwordRules.length} // Rule panjang
                      label="At least 8 characters"
                    />
                    <PasswordRule
                      valid={passwordRules.uppercase} // Rule huruf besar
                      label="At least one capital letter"
                    />
                    <PasswordRule
                      valid={passwordRules.number} // Rule angka
                      label="At least one number"
                    />
                    <PasswordRule
                      valid={passwordRules.special} // Rule karakter spesial
                      label="At least one special character"
                    />
                  </div>
                )}
              </div>

              {errMsg ? (
                // Menampilkan error message jika ada
                <p className="text-red-400 text-[12px] mb-2">{errMsg}</p>
              ) : null}

              {/* REGISTER BUTTON */}
              <div className="flex justify-end mb-5">
                <button
                  type="button" // Tombol biasa (bukan submit form native)
                  onClick={handleRegister} // Trigger register
                  disabled={loading} // Disable saat loading
                  className="w-full px-4 py-3 text-[16px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(90deg, #4C1D95 0%, #2D0A49 100%)", // Background tombol gradient
                    border: "none",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      background:
                        "linear-gradient(180deg, #FAFAFA 0%, #949494 100%)", // Gradient teks tombol
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    {loading ? "Processing..." : "Register Now"} {/* Teks tombol berubah saat loading */}
                  </span>
                </button>
              </div>

              {/* FOOTER */}
              <div className="text-center">
                <p className="text-[14px] mb-[60px] mt-10">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/auth/login")} // Pindah ke halaman login
                    className="hover:underline"
                    style={{
                      color: "#643EB2", // Warna tombol login
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Login
                  </button>
                </p>
                {/* <p className="text-[12px] leading-none">
                  © {new Date().getFullYear()} Gradia. All rights reserved.
                </p> */} {/* Footer copyright (dikomentari) */}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
