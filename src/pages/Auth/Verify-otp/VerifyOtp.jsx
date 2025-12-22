// src/pages/Loginpage/VerifyOtp.jsx // Path file: halaman verifikasi OTP (desktop + mobile)
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"; // Import React + hooks yang dipakai
import { useLocation, useNavigate } from "react-router-dom"; // Ambil info route sekarang & fungsi navigasi
import { useMediaQuery } from "react-responsive"; // Untuk deteksi ukuran layar (mobile/tablet/desktop)
import Mobile from "./Layout/Mobile"; // Layout Mobile/Tablet (dipakai apa adanya)
import { useAlert } from "@/hooks/useAlert"; // Custom hook untuk tampilkan alert
import OtpInput from "./components/OtpInput"; // Komponen input OTP (6 digit)

// === Route tetap (tidak mengubah URL route) ===
const RESET_PASSWORD_NEW_ROUTE = "/auth/reset-password/newpassword"; // Route ke halaman new password
const REGISTER_SUCCESS_ROUTE = "/auth/success/register"; // Route sukses registrasi

// === Endpoint tetap (TIDAK mengubah API path) ===
const VERIFY_ENDPOINT = "/api/auth/verifyOtp"; // Endpoint untuk verifikasi OTP
const RESEND_ENDPOINT = "/api/auth/sendOtp"; // Endpoint untuk kirim ulang OTP

// Purpose constants (hanya dipakai di FE & juga dikirim sebagai action)
const PURPOSE_REGISTRATION = "registration"; // Label aksi untuk registrasi
const PURPOSE_RESET_PASSWORD = "reset-password"; // Label aksi untuk reset password

/* =======================
   Komponen OTPBox (desktop)
   ======================= */
const OTPBox = React.memo(function OTPBox({ length, onChange }) { // OTPBox dibuat memo supaya rerender lebih stabil
  return ( // Return UI OTPBox
    <div> {/* Wrapper sederhana */}
      <OtpInput length={length} onChange={onChange} /> {/* Render input OTP dengan length & callback */}
    </div> // Tutup wrapper
  ); // Tutup return
}); // Tutup komponen OTPBox

/* =======================
   Layout Desktop (CommonUI)
   ======================= */
const CommonUIDesktop = ( // Komponen UI desktop (hanya presentational)
  { // Props yang dipakai UI desktop
    mode, // Mode: "registration" atau "reset-password"
    OTP_LENGTH, // Panjang OTP (6 digit)
    timerLabel, // Label timer (mm:ss)
    submitting, // Status sedang verify (loading)
    resending, // Status sedang resend (loading)
    onVerify, // Handler verify
    onResend, // Handler resend
    onOtpChange, // Handler perubahan OTP
  } // Tutup destructuring props
) => { // Mulai function component
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`; // Helper convert px ke vw (berdasarkan design 1440)
  const vh = (px) => `calc(${(px / 768) * 100}vh)`; // Helper convert px ke vh (berdasarkan design 768)

  const title = // Tentukan judul halaman berdasarkan mode
    mode === "reset-password" ? "Forgot Password?" : "Verify Your Email Address"; // Jika reset -> "Forgot Password?" else -> "Verify..."

  return ( // Return UI desktop
    <div // Wrapper full screen
      className="relative h-screen w-screen overflow-hidden bg-black text-white" // Styling utama
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }} // Font yang dipakai
    > {/* Mulai container desktop */}
      {/* BG dekor */} {/* Komentar: dekor background (svg) */}
      <div className="absolute inset-0 pointer-events-none select-none"> {/* Layer background agar tidak bisa diklik */}
        <img // Dekor 1
          src="/Asset 1.svg" // Path asset
          alt="Asset 1" // Alt text
          className="absolute z-0" // Posisi absolute, di belakang
          style={{ // Inline style untuk posisi & ukuran responsif
            width: vw(1410.82), // Lebar responsif
            height: vh(1185.82), // Tinggi responsif
            left: vw(300.13), // Posisi dari kiri
            top: vh(20), // Posisi dari atas
            transform: "rotate(-360deg)", // Rotasi (sebenarnya sama saja)
            opacity: 0.9, // Transparansi
          }} // Tutup style
        /> {/* Tutup img dekor 1 */}
        <img // Dekor 2
          src="/Asset 2.svg" // Path asset
          alt="Asset 2" // Alt text
          className="absolute z-0" // Posisi absolute
          style={{ // Inline style dekor 2
            width: vw(778), // Lebar
            height: vh(871), // Tinggi
            left: vw(58), // Posisi kiri
            bottom: vh(114), // Posisi bawah
            opacity: 1, // Transparansi
          }} // Tutup style
        /> {/* Tutup img dekor 2 */}
        <img // Dekor 3 (di code alt tertulis "Asset 3", tapi src Asset 4.svg)
          src="/Asset 4.svg" // Path asset
          alt="Asset 3" // Alt text
          className="absolute z-0" // Posisi absolute
          style={{ // Inline style dekor 3
            width: vw(861), // Lebar
            height: vh(726), // Tinggi
            right: vw(904), // Posisi dari kanan
            top: vh(322), // Posisi dari atas
            opacity: 0.9, // Transparansi
          }} // Tutup style
        /> {/* Tutup img dekor 3 */}
      </div> {/* Tutup BG dekor */}

      <div // Layer gradient overlay supaya background lebih lembut
        className="absolute inset-0 z-5" // Menutupi layar, di atas dekor
        style={{ // Gradient overlay
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)", // Warna overlay
        }} // Tutup style overlay
      /> {/* Tutup overlay */}

      <div className="relative z-10 flex h-full w-full flex-col items-center"> {/* Layer konten utama */}
        <div style={{ marginTop: `80px` }} className="text-center"> {/* Bagian header */}
          <h1 // Judul besar
            className="font-bold text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#949494]" // Gradient text
            style={{ fontSize: "48px", lineHeight: 1.3 }} // Ukuran font
          > {/* Mulai h1 */}
            {title} {/* Tampilkan title sesuai mode */}
          </h1> {/* Tutup h1 */}
          <p // Subjudul/deskripsi
            className="mx-auto font-semibold" // Center + tebal
            style={{ // Inline style
              width: "540px", // Lebar max
              fontSize: "20px", // Ukuran teks
              marginTop: "4px", // Jarak dari judul
              color: "#A3A3A3", // Warna abu
            }} // Tutup style
          > {/* Mulai p */}
            Enter the 6-digits code sent to your email. {/* Instruksi */}
          </p> {/* Tutup p */}
        </div> {/* Tutup header */}

        <div // Card utama OTP
          className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md" // Styling card
          style={{ width: `819px`, height: `320px`, marginTop: `62px` }} // Ukuran card
        > {/* Mulai card */}
          <div className="h-full w-full mt-12 px-12"> {/* Padding konten card */}
            <div> {/* Wrapper OTP */}
              {/* OTPBox: OtpInput dibungkus di komponen terpisah, lebih stabil */} {/* Komentar: OTPBox dipisah agar rerender minim */}
              <OTPBox length={OTP_LENGTH} onChange={onOtpChange} /> {/* Render OTP input */}
            </div> {/* Tutup wrapper OTP */}

            <div // Timer label
              className="text-center text-[14px]" // Center kecil
              style={{ marginTop: `12px`, color: "#A3A3A3" }} // Jarak + warna
            > {/* Mulai timer */}
              {timerLabel} {/* Tampilkan mm:ss */}
            </div> {/* Tutup timer */}

            <div // Wrapper tombol verify
              className="w-full flex justify-center" // Center button
              style={{ marginTop: `8px` }} // Jarak
            > {/* Mulai wrapper verify */}
              <button // Tombol verify
                type="button" // Type button
                onClick={onVerify} // Klik -> verify
                disabled={submitting} // Disable saat loading
                className="rounded-2xl shadow-md transition hover:opacity-95 flex items-center justify-center disabled:opacity-60" // Styling tombol
                style={{ // Inline style tombol
                  width: `486px`, // Lebar tombol
                  height: "55px", // Tinggi tombol
                  background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)", // Background gradient
                  cursor: "pointer", // Cursor pointer
                  transition: "all 0.2s ease", // Animasi halus
                }} // Tutup style
                onMouseEnter={(e) => { // Hover enter
                  if (!submitting) // Jika tidak loading
                    e.currentTarget.style.filter = "brightness(1.15)"; // Naikkan brightness
                }} // Tutup handler enter
                onMouseLeave={(e) => { // Hover leave
                  e.currentTarget.style.filter = "brightness(1)"; // Kembalikan brightness
                }} // Tutup handler leave
              > {/* Mulai button verify */}
                {submitting && ( // Jika loading
                  <i className="ri-loader-4-line animate-spin mr-2" /> // Tampilkan icon loading
                )} {/* Tutup conditional loading icon */}
                <span // Teks tombol
                  className="text-transparent bg-clip-text bg-linear-to-b from-[#FAFAFA] to-[#B9B9B9] font-bold" // Gradient text
                  style={{ fontSize: "20px", lineHeight: "1.5" }} // Ukuran font
                > {/* Mulai span */}
                  {submitting ? "Verifying..." : "Verify"} {/* Teks berubah sesuai loading */}
                </span> {/* Tutup span */}
              </button> {/* Tutup button verify */}
            </div> {/* Tutup wrapper verify */}

            <div // Wrapper bagian resend
              className="text-center text-[14px]" // Center kecil
              style={{ marginTop: `24px` }} // Jarak
            > {/* Mulai resend section */}
              <span style={{ color: "#A3A3A3" }}>Didn’t receive the code?</span>{" "} {/* Teks info */}
              <button // Tombol resend
                type="button" // Type button
                onClick={onResend} // Klik -> resend
                disabled={resending} // Disable saat resending
                style={{ // Inline style tombol resend
                  color: "#643EB2", // Warna ungu
                  cursor: "pointer", // Cursor
                  transition: "all 0.2s ease", // Transisi
                }} // Tutup style
                className="hover:opacity-90 font-bold disabled:opacity-60" // Hover & disabled style
                onMouseEnter={(e) => { // Hover enter
                  if (!resending) // Jika tidak loading resend
                    e.currentTarget.style.filter = "brightness(1.15)"; // Brightness naik
                }} // Tutup handler
                onMouseLeave={(e) => { // Hover leave
                  e.currentTarget.style.filter = "brightness(1)"; // Brightness normal
                }} // Tutup handler
              > {/* Mulai button resend */}
                {resending ? "Resending..." : "Resend code"} {/* Teks berubah sesuai loading */}
              </button> {/* Tutup button resend */}
            </div> {/* Tutup resend section */}
          </div> {/* Tutup isi card */}
        </div> {/* Tutup card */}

        <p // Footer copyright
          className="text-center text-[14px] mt-14" // Styling
          style={{ color: "#A3A3A3" }} // Warna
        > {/* Mulai footer */}
          © {new Date().getFullYear()} Gradia. All rights reserved. {/* Tahun otomatis */}
        </p> {/* Tutup footer */}
      </div> {/* Tutup konten utama */}
    </div> // Tutup container desktop
  ); // Tutup return
}; // Tutup CommonUIDesktop

/* =======================
   MAIN COMPONENT
   ======================= */
const VerifyOtp = ({ email, expiredAt, from, user, purpose }) => { // Komponen utama OTP (menerima props)
  const isMobile = useMediaQuery({ maxWidth: 767 }); // True jika layar <= 767px
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 }); // True jika layar 768-1024px

  const location = useLocation(); // Info route saat ini (pathname, search, state)
  const navigate = useNavigate(); // Fungsi pindah halaman
  const { showAlert } = useAlert(); // Ambil fungsi showAlert dari hook

  /* ===== Alert destructive-only (tanpa success) ===== */
  const showError = (title, desc) => // Helper untuk tampilkan error alert
    showAlert({ // Panggil showAlert
      icon: "ri-error-warning-fill", // Icon error
      title, // Judul alert
      desc, // Deskripsi alert
      variant: "destructive", // Variant destructive (merah)
      width: 676, // Lebar alert (desktop)
      height: 380, // Tinggi alert (desktop)
    }); // Tutup showAlert

  /* ===== Mode/purpose detector (SUPER ROBUST, tanpa ubah UI) ===== */
  const mode = useMemo(() => { // Memo agar perhitungan mode tidak sering ulang
    const path = String(location.pathname || "").toLowerCase(); // Ambil path halaman sekarang (lowercase)

    // 1) Explicit purpose wins (paling aman)
    const p1 = String(purpose || "").toLowerCase().trim(); // Purpose dari props
    const p2 = String(location.state?.purpose || "").toLowerCase().trim(); // Purpose dari route state
    const explicitPurpose = p1 || p2; // Prioritas: props dulu, kalau kosong ambil state

    if (explicitPurpose === PURPOSE_RESET_PASSWORD) return "reset-password"; // Jika explicit reset -> mode reset-password
    if (explicitPurpose === PURPOSE_REGISTRATION) return "registration"; // Jika explicit registration -> mode registration

    // 2) Type / query / from
    const byProp = from; // Type dari props "from"
    const byState = location.state?.type; // Type dari route state
    const byQuery = new URLSearchParams(location.search).get("type"); // Type dari query string ?type=

    const raw = String(byProp || byState || byQuery || "") // Gabungkan sumber type
      .toLowerCase() // Pakai lowercase
      .trim(); // Hilangkan spasi

    // Reset aliases (tambah variasi yang umum)
    if ( // Jika raw termasuk salah satu alias reset
      [
        "reset-password",
        "resetpassword",
        "reset",
        "forgot",
        "forgot-password",
        "forgotpassword",
        "new-password",
        "newpassword",
      ].includes(raw) // Cek raw ada di list
    ) { // Jika iya
      return "reset-password"; // Mode reset-password
    } // Tutup if alias reset

    // Registration aliases
    if (["registration", "register", "regist"].includes(raw)) { // Jika raw termasuk alias registrasi
      return "registration"; // Mode registration
    } // Tutup if alias registration

    // 3) Path hint (kalau rute kamu mengandung "reset")
    if ( // Jika path mengandung kata-kata terkait reset
      path.includes("reset-password") || // Ada "reset-password"
      path.includes("forgot") || // Ada "forgot"
      path.includes("/reset") // Ada "/reset"
    ) { // Jika iya
      return "reset-password"; // Mode reset-password
    } // Tutup if path hint

    // Default aman
    return "registration"; // Default: registrasi
  }, [from, purpose, location.pathname, location.search, location.state]); // Dependencies useMemo

  /* ===== Email final ===== */
  const emailFromSession = // Ambil email registrasi dari sessionStorage (jika ada)
    typeof window !== "undefined" ? sessionStorage.getItem("registerEmail") : ""; // Hindari error SSR
  const emailFromNav = location.state?.email; // Ambil email dari route state

  const emailToUse = ( // Tentukan email yang akan dipakai
    mode === "registration" // Jika mode registrasi
      ? emailFromSession || emailFromNav || email || user?.email || "" // Urutan prioritas registrasi
      : emailFromNav || email || user?.email || "" // Urutan prioritas reset password
  ) // Tutup pemilihan email
    .trim() // Rapikan spasi
    .toLowerCase(); // Lowercase biar konsisten

  /* ===== OTP state & timer ===== */
  const OTP_LENGTH = 6; // Panjang OTP fix 6 digit
  const [otp, setOtp] = useState(""); // State untuk menyimpan OTP yang diinput user

  const [secondsLeft, setSecondsLeft] = useState(() => { // State timer (detik tersisa)
    const exp = expiredAt || location.state?.expires_at; // Ambil expiredAt dari props atau state
    if (!exp) return 5 * 60; // Jika tidak ada expiredAt, set default 5 menit
    const diff = Math.floor((new Date(exp).getTime() - Date.now()) / 1000); // Hitung selisih detik dari sekarang
    return diff > 0 ? Math.min(diff, 5 * 60) : 5 * 60; // Jika masih valid, pakai diff (maks 5 menit), jika sudah lewat tetap 5 menit
  }); // Tutup inisialisasi secondsLeft

  const [submitting, setSubmitting] = useState(false); // Loading state untuk verify
  const [resending, setResending] = useState(false); // Loading state untuk resend

  // guard auto-send supaya cuma sekali
  const sentOnceRef = useRef(false); // Ref flag (saat ini belum dipakai di logic mana pun)

  // countdown timer
  useEffect(() => { // Jalankan timer setiap 1 detik
    const t = setInterval( // Buat interval
      () => setSecondsLeft((p) => (p <= 1 ? 0 : p - 1)), // Turunkan 1 detik, stop di 0
      1000 // Interval 1 detik
    ); // Tutup setInterval
    return () => clearInterval(t); // Cleanup: hapus interval saat unmount
  }, []); // Dependency kosong: jalan sekali

  // guard registration tanpa email
  useEffect(() => { // Cek kalau registrasi tapi email kosong
    if (mode === "registration" && !emailToUse) { // Kondisi invalid
      showError("Email tidak ditemukan", "Silakan ulangi proses registrasi."); // Tampilkan error
      navigate("/registration", { replace: true }); // Redirect kembali ke halaman registration
    } // Tutup if
  }, [mode, emailToUse, navigate]); // eslint-disable-line react-hooks/exhaustive-deps // Dependency yang dipakai

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0"); // Hitung menit sisa (2 digit)
  const ss = String(secondsLeft % 60).padStart(2, "0"); // Hitung detik sisa (2 digit)
  const timerLabel = `${mm}:${ss}`; // Gabungkan jadi format mm:ss

  /* ===== Handler perubahan OTP (stabil) ===== */
  const handleOtpChange = useCallback((code) => { // Buat handler stabil dengan useCallback
    setOtp(code); // Simpan OTP terbaru ke state
  }, []); // Dependency kosong karena hanya setState

  /* ===== Verify ===== */
  const handleVerify = async () => { // Handler saat klik tombol Verify
    const code = otp; // Ambil OTP dari state

    if (!emailToUse) { // Jika email kosong
      showError("Email tidak ditemukan", "Silakan ulangi proses."); // Tampilkan error
      return; // Stop
    } // Tutup if

    if (!code || code.length < OTP_LENGTH) { // Jika OTP kosong atau belum 6 digit
      showError("OTP belum lengkap", "Lengkapi semua 6 digit kode OTP."); // Tampilkan error
      return; // Stop
    } // Tutup if

    try { // Mulai try untuk request
      setSubmitting(true); // Set loading verify = true

      // api/auth/verify expects `action` = "registration" / "reset-password"
      const action = // Tentukan action untuk backend
        mode === "reset-password" // Jika reset
          ? PURPOSE_RESET_PASSWORD // action reset-password
          : PURPOSE_REGISTRATION; // else action registration

      const res = await fetch(VERIFY_ENDPOINT, { // Panggil API verify
        method: "POST", // Method POST
        headers: { "Content-Type": "application/json" }, // Header JSON
        body: JSON.stringify({ // Kirim body JSON
          email: emailToUse, // Email target
          otp_code: code, // OTP code
          action, // Action (registration/reset-password)
        }), // Tutup body
      }); // Tutup fetch

      let data = null; // Siapkan variabel untuk response json
      try { // Coba parse json
        data = await res.json(); // Ambil json
      } catch {} // Jika gagal parse, biarkan null

      if (!res.ok) { // Jika HTTP status bukan 2xx
        const msg = data?.error || `${res.status} ${res.statusText}`; // Ambil error dari API, atau fallback status
        showError("Verification Failed", String(msg)); // Tampilkan error
        return; // Stop
      } // Tutup if res.ok

      if (mode === "registration") { // Jika registrasi
        try { // Coba hapus email registrasi dari session
          sessionStorage.removeItem("registerEmail"); // Remove
        } catch {} // Abaikan jika error
        navigate(REGISTER_SUCCESS_ROUTE, { // Navigate ke halaman sukses
          replace: true, // Replace history
          state: { type: "registration" }, // Bawa state type
        }); // Tutup navigate
      } else { // Kalau reset-password
        navigate(RESET_PASSWORD_NEW_ROUTE, { // Navigate ke halaman new password
          replace: true, // Replace history
          // type/purpose diset konsisten supaya step berikutnya juga aman
          state: { type: "reset-password", purpose: "reset-password", email: emailToUse }, // Kirim state yang konsisten
        }); // Tutup navigate
      } // Tutup if mode
    } catch (err) { // Tangkap error network / runtime
      showError("Network/JSON Error", String(err?.message || err)); // Tampilkan error
    } finally { // Selalu jalan di akhir
      setSubmitting(false); // Matikan loading verify
    } // Tutup try-catch-finally
  }; // Tutup handleVerify

  /* ===== Resend ===== */
  const handleResend = async () => { // Handler saat klik Resend code
    if (!emailToUse) { // Jika email kosong
      showError("Email tidak ditemukan", "Silakan ulangi proses."); // Tampilkan error
      return; // Stop
    } // Tutup if
    try { // Mulai try request
      setResending(true); // Set loading resend = true

      const payload = { // Payload request resend OTP
        email: emailToUse, // Email target
        purpose: // Purpose untuk backend
          mode === "reset-password" // Jika reset
            ? PURPOSE_RESET_PASSWORD // Purpose reset-password
            : PURPOSE_REGISTRATION, // Else purpose registration
      }; // Tutup payload

      const res = await fetch(RESEND_ENDPOINT, { // Panggil API resend
        method: "POST", // Method POST
        headers: { "Content-Type": "application/json" }, // Header JSON
        body: JSON.stringify(payload), // Body JSON
      }); // Tutup fetch

      let data = null; // Siapkan variable response json
      try { // Coba parse json
        data = await res.json(); // Ambil json
      } catch {} // Abaikan jika gagal parse

      if (!res.ok) { // Jika response gagal
        const msg = data?.error || `${res.status} ${res.statusText}`; // Ambil error message
        showError("Resend OTP Failed", String(msg)); // Tampilkan error
        return; // Stop
      } // Tutup if gagal

      // clear OTP & reset timer
      setOtp(""); // Kosongkan OTP input
      setSecondsLeft(5 * 60); // Reset timer ke 5 menit
    } catch (err) { // Tangkap error network
      showError("Network Error", String(err?.message || err)); // Tampilkan error
    } finally { // Selalu jalan di akhir
      setResending(false); // Matikan loading resend
    } // Tutup try-catch-finally
  }; // Tutup handleResend

  /* ===== Mobile/Tablet: tetap pakai layout Mobile apa adanya ===== */
  if (isMobile || isTablet) { // Jika mobile atau tablet
    return ( // Return layout Mobile
      <Mobile // Render komponen Mobile (existing)
        email={email} // Oper email prop
        expiredAt={expiredAt} // Oper expiredAt
        from={from} // Oper from
        user={user} // Oper user
        purpose={purpose} // Oper purpose
      /> // Tutup Mobile
    ); // Tutup return
  } // Tutup if mobile/tablet

  /* ===== Desktop: pakai CommonUIDesktop ===== */
  return ( // Return UI desktop
    <CommonUIDesktop // Render layout desktop
      mode={mode} // Mode halaman
      OTP_LENGTH={OTP_LENGTH} // Panjang OTP
      timerLabel={timerLabel} // Label timer
      submitting={submitting} // Loading verify
      resending={resending} // Loading resend
      onVerify={handleVerify} // Handler verify
      onResend={handleResend} // Handler resend
      onOtpChange={handleOtpChange} // Handler perubahan OTP
    /> // Tutup CommonUIDesktop
  ); // Tutup return desktop
}; // Tutup VerifyOtp component

export default VerifyOtp; // Export default supaya bisa dipakai di router
