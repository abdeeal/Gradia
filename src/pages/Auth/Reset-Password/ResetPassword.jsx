// Import React dan hooks useEffect/useState
import React, { useEffect, useState } from "react";
// Import PropTypes untuk validasi tipe props
import PropTypes from "prop-types";
// Import hook untuk responsive media query
import { useMediaQuery } from "react-responsive";
// Import hook navigasi dan lokasi dari react-router
import { useNavigate, useLocation } from "react-router-dom";
// Import komponen Mobile untuk tampilan mobile/tablet
import Mobile from "./Layout/Mobile";
// Import komponen rule password (indikator validasi)
import PasswordRule from "../Registration/components/PasswordRule";

// Konstanta purpose OTP untuk flow reset password
const PURPOSE_RESET_PASSWORD = "reset-password";
// Konstanta route untuk halaman verify OTP
const VERIFY_OTP_ROUTE = "/auth/verify-otp";
// Konstanta route untuk halaman input password baru
const RESET_PASSWORD_NEW_ROUTE = "/auth/reset-password/newpassword";
// Konstanta route untuk halaman sukses reset
const RESET_PASSWORD_SUCCESS_ROUTE = "/auth/success/reset";

// Export default komponen ResetPassword (menerima prop initialStep)
export default function ResetPassword({ initialStep = "email" }) {
  // Deteksi apakah layar small (max 767px)
  const isSm = useMediaQuery({ maxWidth: 767 });
  // Deteksi apakah layar medium (768px - 1024px)
  const isMd = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  // Inisialisasi fungsi navigate untuk pindah halaman
  const nav = useNavigate();
  // Ambil info lokasi sekarang (termasuk state dari halaman sebelumnya)
  const loc = useLocation();

  // Helper convert px ke vw berdasarkan desain 1440px
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  // Helper convert px ke vh berdasarkan desain 768px
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  // State email: dibawa dari VerifyOtp (loc.state) atau default ""
  const [email, setEmail] = useState(loc.state?.email || "");
  // State password baru
  const [newPw, setNewPw] = useState("");
  // State konfirmasi password baru
  const [confirmPw, setConfirmPw] = useState("");
  // State pesan error
  const [err, setErr] = useState("");
  // State pesan info/sukses
  const [info, setInfo] = useState("");
  // State loading untuk disable tombol + ganti label
  const [loading, setLoading] = useState(false);

  // State apakah input password sedang fokus
  const [pwFocused, setPwFocused] = useState(false);
  // State apakah input password pernah fokus (untuk menampilkan rule setelah pertama kali fokus)
  const [pwFocusedOnce, setPwFocusedOnce] = useState(false);
  // State apakah panel validasi password sudah “dismissed” ketika password valid dan blur
  const [pwValidationDismissed, setPwValidationDismissed] = useState(false);

  // Object aturan validasi password berdasarkan newPw
  const passwordRules = {
    // Rule panjang minimal 8 karakter
    length: newPw.length >= 8,
    // Rule minimal ada 1 huruf besar
    uppercase: /[A-Z]/.test(newPw),
    // Rule minimal ada 1 angka
    number: /\d/.test(newPw),
    // Rule minimal ada 1 karakter spesial
    special: /[^A-Za-z0-9]/.test(newPw),
  };

  // Password valid jika semua rule bernilai true
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  // Effect: jika password jadi tidak valid, pastikan panel rule tidak disembunyikan
  useEffect(() => {
    // Kondisi: bila password tidak valid
    if (!isPasswordValid) {
      // Set dismissed ke false agar rule muncul lagi
      setPwValidationDismissed(false);
    }
  }, [isPasswordValid]);
  
  // Tentukan kapan panel rule password tampil
  const showPasswordValidation =
    // Tampil jika belum dismissed dan (pernah fokus atau sedang fokus)
    !pwValidationDismissed && (pwFocusedOnce || pwFocused);

  // Fungsi render background dekorasi (SVG + overlay gradient)
  const bg = () => (
    <>
      {/* Container absolut full screen untuk dekorasi background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Gambar Asset 1 */}
        <img
          // Sumber SVG asset 1
          src="/Asset 1.svg"
          // Alt text untuk aksesibilitas
          alt="Asset 1"
          // Posisi absolute dan z-index
          className="absolute z-0"
          // Styling inline untuk size/posisi/rotasi/opacity
          style={{
            // Lebar responsif berdasar vw
            width: vw(1410.82),
            // Tinggi responsif berdasar vh
            height: vh(1185.82),
            // Posisi kiri
            left: vw(400.13),
            // Posisi atas
            top: vh(30),
            // Rotasi elemen
            transform: "rotate(-200deg)",
            // Titik origin rotasi
            transformOrigin: "50% 50%",
            // Transparansi
            opacity: 0.9,
          }}
        />
        {/* Gambar Asset 2 */}
        <img
          // Sumber SVG asset 2
          src="/Asset 2.svg"
          // Alt text untuk aksesibilitas
          alt="Asset 2"
          // z-index lebih tinggi
          className="absolute z-10"
          // Styling inline untuk size/posisi/opacity
          style={{
            // Lebar responsif
            width: vw(778),
            // Tinggi responsif
            height: vh(871),
            // Posisi kiri
            left: vw(58),
            // Posisi bawah
            bottom: vh(114),
            // Transparansi
            opacity: 0.9,
          }}
        />
        {/* Gambar Asset 4 (alt tertulis Asset 3) */}
        <img
          // Sumber SVG asset 4
          src="/Asset 4.svg"
          // Alt text untuk aksesibilitas
          alt="Asset 3"
          // z-index 10
          className="absolute z-10"
          // Styling inline untuk size/posisi/opacity
          style={{
            // Lebar responsif
            width: vw(861),
            // Tinggi responsif
            height: vh(726),
            // Posisi kanan
            right: vw(904),
            // Posisi atas
            top: vh(322),
            // Transparansi
            opacity: 0.9,
          }}
        />
      </div>
      {/* Overlay gradient untuk menggelapkan background */}
      <div
        // Posisi absolut full screen + z-index 5
        className="absolute inset-0 z-5"
        // Styling inline gradient
        style={{
          // Gradient dari atas ke bawah dengan opacity berbeda
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </>
  );

  // Style tombol utama (gradient + hover via filter)
  const btnStyle = {
    // Gradient background tombol
    background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
    // Cursor pointer
    cursor: "pointer",
    // Transition hover halus
    transition: "all 0.2s ease",
  };

  // Boolean: apakah sekarang mode email
  const isEmailMode = initialStep === "email";
  // Boolean: apakah sekarang mode input password baru
  const isNewPwMode = initialStep === "newPw";

  /* ============================
     MODE EMAIL: kirim OTP
     ============================ */
  // Handler submit form email untuk kirim OTP
  const handleSubmitEmail = async (e) => {
    // Prevent reload halaman saat submit form
    e.preventDefault();
    // Reset error
    setErr("");
    // Reset info
    setInfo("");

    // Validasi email tidak kosong
    if (!email.trim()) return setErr("Email tidak boleh kosong.");
    // Validasi sederhana format email (minimal ada @)
    if (!email.includes("@")) return setErr("Format email tidak valid.");

    try {
      // Set loading true untuk disable tombol + indikator
      setLoading(true);

      // Panggil API sendOtp
      const res = await fetch("/api/auth/sendOtp", {
        // Method POST
        method: "POST",
        // Header JSON
        headers: { "Content-Type": "application/json" },
        // Body payload email + purpose
        body: JSON.stringify({
          // Email target
          email,
          // Purpose reset password
          purpose: PURPOSE_RESET_PASSWORD,
        }),
      });

      // Coba parse JSON; jika gagal fallback object kosong
      const data = await res.json().catch(() => ({}));

      // Jika response bukan OK (status error)
      if (!res.ok) {
        // Log payload error dari backend
        console.error("ResetPassword sendOtp error payload:", data);
        // Throw error agar masuk ke catch
        throw new Error(data?.message || "Gagal mengirim OTP.");
      }

      // Set info bahwa OTP sudah dikirim
      setInfo("Kode OTP telah dikirim ke email kamu.");

      // Navigasi ke halaman VerifyOtp dengan state untuk flow reset
      nav(VERIFY_OTP_ROUTE, {
        // State yang dikirim ke route berikutnya
        state: {
          // Kirim email
          email,
          // Tipe flow reset-password
          type: "reset-password",
          // Purpose sama dengan const
          purpose: PURPOSE_RESET_PASSWORD,
          // Setelah OTP berhasil, next route ke halaman new password
          nextRoute: RESET_PASSWORD_NEW_ROUTE,
        },
        // replace true agar history tidak menumpuk
        replace: true,
      });
    } catch (error) {
      // Log error untuk debugging
      console.error(error);
      // Set error message yang ditampilkan
      setErr(error.message || "Terjadi kesalahan saat mengirim OTP.");
    } finally {
      // Set loading false setelah selesai (sukses/gagal)
      setLoading(false);
    }
  };

  /* ============================
     MODE NEW PASSWORD
     ============================ */
  // Handler submit form set password baru
  const handleSubmitNewPw = async (e) => {
    // Prevent reload saat submit
    e.preventDefault();
    // Reset error
    setErr("");
    // Reset info
    setInfo("");

    // Jika password belum memenuhi semua rule, tampilkan error
    if (!isPasswordValid) {
      return setErr("Password does not meet all requirements.");
    }

    // Validasi konfirmasi password harus sama
    if (newPw !== confirmPw) return setErr("Konfirmasi password tidak sama.");

    // Ambil email dari loc.state bila ada, kalau tidak gunakan state email lokal
    const emailForReset = loc.state?.email || email;
    // Jika email kosong, user harus ulang flow reset
    if (!emailForReset) {
      return setErr("Email tidak ditemukan. Ulangi proses reset password.");
    }

    try {
      // Set loading true
      setLoading(true);

      // Payload reset password sesuai mobile (action + email + new_password)
      const payload = {
        // Action untuk backend
        action: "change-password",
        // Email target
        email: emailForReset,
        // Password baru
        new_password: newPw,
      };

      // Panggil API resetPassword
      const res = await fetch("/api/auth/resetPassword", {
        // Method POST
        method: "POST",
        // Header JSON
        headers: { "Content-Type": "application/json" },
        // Body payload
        body: JSON.stringify(payload),
      });

      // Parse JSON response; fallback {}
      const data = await res.json().catch(() => ({}));

      // Jika response error
      if (!res.ok) {
        // Log payload error
        console.error("ResetPassword resetPassword error payload:", data);
        // Throw error dari berbagai kemungkinan field backend
        throw new Error(
          data?.error || data?.message || "Gagal mengubah password."
        );
      }

      // Jika sukses, navigasi ke halaman success reset
      nav(RESET_PASSWORD_SUCCESS_ROUTE, {
        // replace true agar tidak bisa back ke form setelah sukses
        replace: true,
      });
    } catch (error) {
      // Log error
      console.error(error);
      // Set pesan error
      setErr(error.message || "Terjadi kesalahan saat mengubah password.");
    } finally {
      // Stop loading
      setLoading(false);
    }
  };

  // Jika ukuran layar mobile/tablet, render komponen Mobile
  if (isSm || isMd) {
    // Komponen Mobile memakai initialStep yang sama
    return <Mobile initialStep={initialStep} />;
  }

  // Return tampilan desktop
  return (
    // Wrapper utama full screen
    <div
      // Class tailwind untuk layout + warna
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      // Style font
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* Render background dekoratif */}
      {bg()}
      {/* Container utama konten */}
      <div className="relative z-10 flex h-full w-full flex-col items-center">
        {/* title */}
        <div className="text-center mt-[30px] 2xl:mt-[150px]">
          {/* Judul */}
          <h1
            // Gradient text
            className="font-bold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#949494]"
            // Ukuran font dan line-height
            style={{ fontSize: "48px", lineHeight: 1.3 }}
          >
            {/* Teks judul sesuai mode */}
            {isEmailMode && "Forgot Password"}
            {/* Teks judul sesuai mode */}
            {isNewPwMode && "Set New Password"}
          </h1>
          {/* Subjudul */}
          <p
            // Posisi tengah
            className="mx-auto font-semibold"
            // Style ukuran dan warna
            style={{
              // Lebar teks
              width: "540px",
              // Ukuran font
              fontSize: "20px",
              // Jarak atas
              marginTop: "4px",
              // Warna teks
              color: "#A3A3A3",
            }}
          >
            {/* Subjudul sesuai mode */}
            {isEmailMode && "Enter your email to reset password"}
            {/* Subjudul sesuai mode */}
            {isNewPwMode && "Enter your new password here"}
          </p>
        </div>

        {/* card */}
        <div
          // Margin atas, lebar card, dan tinggi minimum
          className="mt-16 w-[540px] min-h-[210px]"
          // Style card (border, blur, padding)
          style={{
            // Lebar eksplisit
            width: `540px`,
            // Radius
            borderRadius: "16px",
            // Border tipis
            border: "1px solid rgba(255,255,255,0.1)",
            // Background transparan
            background: "rgba(255,255,255,0.05)",
            // Shadow
            boxShadow: "0 0 25px rgba(0,0,0,0.4)",
            // Blur
            backdropFilter: "blur(10px)",
            // Padding
            padding: `22px 65px`,
          }}
        >
          {/* MODE EMAIL */}
          {isEmailMode && (
            // Form email untuk kirim OTP
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              {/* Wrapper input email */}
              <div>
                {/* Label container */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Label Email */}
                  <label
                    // Style label
                    className="text-sm font-medium"
                    // Warna label
                    style={{ color: "#A3A3A3" }}
                  >
                    {/* Text label */}
                    Email
                  </label>
                </div>
                {/* Input email */}
                <input
                  // Type email
                  type="email"
                  // Value dari state email
                  value={email}
                  // Update state email saat berubah
                  onChange={(e) => setEmail(e.target.value)}
                  // Required agar tidak bisa submit kosong
                  required
                  // Placeholder
                  placeholder="you@example.com"
                  // Class styling input
                  className="w-full h-11 rounded-md bg-transparent px-3 outline-none text-[15px]"
                  // Border dan warna teks
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#EAEAEA",
                  }}
                />
              </div>

              {/* Tampilkan error jika ada */}
              {err && <p className="text-sm text-red-400">{err}</p>}
              {/* Tampilkan info jika ada */}
              {info && <p className="text-sm text-emerald-400">{info}</p>}

              {/* Tombol submit kirim OTP */}
              <button
                // Type submit form
                type="submit"
                // Disable jika loading
                disabled={loading}
                // Class styling tombol
                className="w-full mt-2 rounded-md h-[46px] shadow-md transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                // Style gradient tombol
                style={btnStyle}
                // Hover enter: naikkan brightness
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.15)")
                }
                // Hover leave: kembalikan brightness normal
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                {/* Text tombol dengan gradient text */}
                <span className="font-semibold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#B9B9B9]">
                  {/* Label tombol tergantung loading */}
                  {loading ? "Sending OTP..." : "Send OTP"}
                </span>
              </button>

              {/* Back to Login */}
              <p
                // Center
                className="text-center"
                // Styling teks kecil
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#A3A3A3",
                }}
              >
                {/* Teks */}
                Back to{" "}
                {/* Link ke login */}
                <span
                  // Klik untuk navigate ke login
                  onClick={() => nav("/auth/login")}
                  // Style link
                  style={{
                    color: "#643EB2",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {/* Text link */}
                  Login
                </span>
              </p>
            </form>
          )}

          {/* MODE NEW PASSWORD */}
          {isNewPwMode && (
            // Form new password
            <form onSubmit={handleSubmitNewPw} className="space-y-4">
              {/* Wrapper input new password */}
              <div>
                {/* Label container */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Label */}
                  <label
                    // Style label
                    className="text-sm font-medium"
                    // Warna label
                    style={{ color: "#A3A3A3" }}
                  >
                    {/* Text label */}
                    New Password
                  </label>
                </div>
                {/* Input password baru */}
                <input
                  // Type password
                  type="password"
                  // Value dari state newPw
                  value={newPw}
                  // Update state newPw saat berubah
                  onChange={(e) => setNewPw(e.target.value)}
                  // Saat fokus: tandai fokus dan pernah fokus
                  onFocus={() => {
                    setPwFocused(true);
                    setPwFocusedOnce(true);
                  }}
                  // Saat blur: hilangkan fokus, dan dismiss rule kalau password valid
                  onBlur={() => {
                    setPwFocused(false);
                    if (isPasswordValid) {
                      setPwValidationDismissed(true);
                    }
                  }}
                  // Autocomplete khusus password baru
                  autoComplete="new-password"
                  // Required
                  required
                  // Placeholder bullets
                  placeholder="••••••••"
                  // Class input styling
                  className="w-full h-11 rounded-md bg-transparent px-3 outline-none text-[15px]"
                  // Border dan warna teks
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#EAEAEA",
                  }}
                />
                {/* Panel rule password */}
                {showPasswordValidation && (
                  // Wrapper rules
                  <div className="flex flex-col gap-2 text-sm mt-2">
                    {/* Rule minimal 8 karakter */}
                    <PasswordRule
                      valid={passwordRules.length}
                      label="At least 8 characters"
                    />
                    {/* Rule huruf besar */}
                    <PasswordRule
                      valid={passwordRules.uppercase}
                      label="At least one capital letter"
                    />
                    {/* Rule angka */}
                    <PasswordRule
                      valid={passwordRules.number}
                      label="At least one number"
                    />
                    {/* Rule karakter spesial */}
                    <PasswordRule
                      valid={passwordRules.special}
                      label="At least one special character"
                    />
                  </div>
                )}
              </div>

              {/* Wrapper confirm password */}
              <div>
                {/* Label container */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Label */}
                  <label
                    // Style label
                    className="text-sm font-medium"
                    // Warna label
                    style={{ color: "#A3A3A3" }}
                  >
                    {/* Text label */}
                    Confirm New Password
                  </label>
                </div>
                {/* Input konfirmasi password */}
                <input
                  // Type password
                  type="password"
                  // Value dari confirmPw
                  value={confirmPw}
                  // Update confirmPw saat berubah
                  onChange={(e) => setConfirmPw(e.target.value)}
                  // Required
                  required
                  // Placeholder bullets
                  placeholder="••••••••"
                  // Class input styling
                  className="w-full h-11 rounded-md bg-transparent px-3 outline-none text-[15px]"
                  // Border dan warna teks
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#EAEAEA",
                  }}
                />
              </div>

              {/* Tampilkan error */}
              {err && <p className="text-sm text-red-400">{err}</p>}
              {/* Tampilkan info */}
              {info && <p className="text-sm text-emerald-400">{info}</p>}

              {/* Tombol submit change password */}
              <button
                // Type submit
                type="submit"
                // Disable saat loading
                disabled={loading}
                // Class styling tombol
                className="w-full mt-2 rounded-md h-[46px] shadow-md transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                // Style gradient
                style={btnStyle}
                // Hover enter: brighten
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.15)")
                }
                // Hover leave: normal
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                {/* Label tombol dengan gradient text */}
                <span className="font-semibold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#B9B9B9]">
                  {/* Label tergantung loading */}
                  {loading ? "Changing..." : "Change Password"}
                </span>
              </button>

              {/* Back to Login */}
              <p
                // Margin top + center
                className="text-center mt-3"
                // Styling teks
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#A3A3A3",
                }}
              >
                {/* Teks */}
                Back to{" "}
                {/* Link ke login */}
                <span
                  // Klik untuk navigate login
                  onClick={() => nav("/auth/login")}
                  // Style link
                  style={{
                    color: "#643EB2",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {/* Text link */}
                  Login
                </span>
              </p>
            </form>
          )}
        </div>

        {/* footer */}
        <p
          // Style footer text
          className="text-center text-[14px] mt-16"
          // Warna footer
          style={{ color: "#A3A3A3" }}
        >
          {/* Copyright tahun dinamis */}
          © {new Date().getFullYear()} Gradia. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// Definisi propTypes untuk validasi initialStep
ResetPassword.propTypes = {
  // initialStep hanya boleh salah satu dari value ini
  initialStep: PropTypes.oneOf(["email", "otp", "newPw"]),
};
