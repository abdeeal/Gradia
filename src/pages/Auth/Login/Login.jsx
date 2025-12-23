import React, { useState, useEffect } from "react"; // Import React + hooks state & effect
import { useMediaQuery } from "react-responsive"; // Hook untuk cek ukuran layar (responsive)
import Mobile from "./Layout/Mobile"; // Import tampilan khusus mobile/tablet
import { useNavigate, Link } from "react-router-dom"; // Navigate untuk redirect, Link untuk navigasi tanpa reload
import { useAlert } from "@/hooks/useAlert"; // Custom hook untuk menampilkan alert UI
import Loader from "@/components/Loader"; // Komponen loader/spinner overlay

const Login = () => { // Komponen utama Login (wrapper responsive)
  const isMobile = useMediaQuery({ maxWidth: 767 }); // True jika layar <= 767px (mobile)
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 }); // True jika layar 768-1024px (tablet)

  if (isMobile || isTablet) return <Mobile />; // Jika mobile/tablet tampilkan layout Mobile
  return <DesktopLoginPage />; // Jika desktop tampilkan halaman login desktop
};

function DesktopLoginPage() { // Komponen login khusus desktop
  const navigate = useNavigate(); // Fungsi untuk redirect ke route lain
  const { showAlert } = useAlert(); // init alert: ambil fungsi showAlert dari hook

  // normal login (email & password) // Penjelasan: login biasa pakai email+password
  const [email, setEmail] = useState(""); // State input email
  const [password, setPassword] = useState(""); // State input password

  // state untuk error & loading // Penjelasan: state untuk pesan error dan indikator loading
  const [errorMsg, setErrorMsg] = useState(""); // Menyimpan pesan error yang ditampilkan di form
  const [googleLoading, setGoogleLoading] = useState(false); // Loading khusus proses login Google
  const [loading, setLoading] = useState(false); // loading login: loading khusus login manual

  const vw = (px) => `calc(${(px / 1440) * 100}vw)`; // Helper konversi px -> vw berdasar desain 1440px
  const vh = (px) => `calc(${(px / 768) * 100}vh)`; // Helper konversi px -> vh berdasar desain 768px

  const DRAWER_W = 694; // Lebar panel kanan (drawer) dalam px desain
  const PAD_X = 77; // Padding horizontal drawer (kiri/kanan)
  const TOP_HEADER = 100; // Padding atas bagian header drawer

  const BORDER_GRADIENT =
    "linear-gradient(90deg, #656565 0%, #CBCBCB 52%, #989898 98%)"; // Gradient untuk border panel/elemen

  const gradientText = { // Style untuk teks gradient (dipakai di judul dan tombol)
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)", // Warna gradient top->bottom
    WebkitBackgroundClip: "text", // Clip background ke area teks (Safari/Chrome)
    backgroundClip: "text", // Clip background ke area teks (standar)
    color: "transparent", // Bikin teks transparan agar gradient terlihat
  };

  const gradientBorderWrapper = { // Wrapper untuk input agar bisa dibuat border gradient via overlay
    position: "relative", // Dibutuhkan supaya overlay absolute menempel ke wrapper
    borderRadius: 8, // Radius wrapper
  };

  const gradientBorderOverlay = { // Overlay pseudo-border gradient dengan teknik mask
    content: '""', // Konten pseudo-element (biasanya dipakai di CSS), di sini dipakai sebagai object style
    position: "absolute", // Overlay menimpa area wrapper
    inset: 0, // Top/right/bottom/left = 0 (menutupi seluruh wrapper)
    borderRadius: 8, // Radius overlay sama dengan wrapper
    padding: "1px", // Ketebalan border “palsu”
    background: BORDER_GRADIENT, // Background gradient yang akan terlihat sebagai border
    WebkitMask:
      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", // Mask untuk membuat bagian tengah transparan (webkit)
    WebkitMaskComposite: "xor", // Komposisi mask (webkit) untuk efek border
    maskComposite: "exclude", // Komposisi mask (standar) untuk exclude bagian tengah
  };

  const inputStyle = { // Style dasar input email/password
    position: "relative", // Supaya z-index berlaku
    zIndex: 1, // Pastikan input di atas overlay border
    width: "100%", // Input penuh lebar container
    padding: "12px 16px", // Padding dalam input
    border: "none", // Hilangkan border default
    borderRadius: 7, // Radius input sedikit lebih kecil dari wrapper
    background: "rgba(0,0,0,0.35)", // Background gelap transparan
    color: "white", // Warna teks input putih
    outline: "none", // Hilangkan outline default saat focus
  };

  // === Normal login -> /workspace === // Proses login manual menuju halaman workspaces
  const handleLogin = async (e) => { // Handler submit form login
    e.preventDefault(); // Cegah reload halaman saat submit
    setErrorMsg(""); // Reset pesan error lama
    setLoading(true); // mulai loading: tampilkan state loading pada tombol login

    try { // Mulai blok try untuk menangkap error network/exception
      //backend expect POST JSON
      const res = await fetch("/api/auth/index", { // Request ke endpoint login backend
        method: "POST", // Metode POST
        headers: { // Header request
          "Content-Type": "application/json", // Kirim body dalam format JSON
          Accept: "application/json", // Minta response JSON
        },
        body: JSON.stringify({ // Body request di-stringify
          action: "login", // Instruksi aksi untuk backend (login)
          text: email, //backend expect "text" (bisa email / username)
          password: password, // Password yang diinput user
        }),
      });

      const data = await res.json(); // Parsing response JSON dari server

      if (!res.ok || data.error) { // Jika status HTTP gagal atau server return error
        const message =
          data.error || "Login failed. Please check your credentials."; // Tentukan pesan error yang akan ditampilkan
        setErrorMsg(message); // Simpan pesan error untuk ditampilkan di UI
        showAlert({ // Tampilkan alert UI (destructive)
          icon: "ri-error-warning-fill", // Icon alert
          title: "Login Failed", // Judul alert
          desc: message, // Deskripsi alert berisi pesan
          variant: "destructive", // Variasi alert: destructive (error)
          width: 676, // Lebar modal/alert
          height: 380, // Tinggi modal/alert
        });
        return; // Stop eksekusi handleLogin
      }

      // Kondisi akun perlu OTP
      if (data.otp_required) { // Jika backend menyatakan perlu verifikasi OTP
        // simpan data user sementara kalau perlu dipakai di halaman OTP // Menyimpan data user pending
        if (data.user) { // Jika ada object user yang dikirim
          localStorage.setItem( // Simpan ke localStorage
            "pending_verification_user", // Key untuk data user pending verifikasi
            JSON.stringify(data.user) // Simpan sebagai JSON string
          );
        }

        showAlert({ // Tampilkan info bahwa verifikasi dibutuhkan
          icon: "ri-information-line", // Icon info
          title: "Verification Required", // Judul info
          desc:
            data.message ||
            "Your account is not verified yet. An OTP has been sent to your email.", // Pesan dari server atau default
          variant: "default", // Variasi alert default (info)
          width: 676, // Lebar alert
          height: 380, // Tinggi alert
        });

        // TODO: arahkan ke halaman verifikasi OTP milikmu // Catatan developer: perlu redirect ke halaman OTP
        // contoh (ganti dengan rute yang benar di app-mu): // Contoh rute
        // navigate("/auth/verify-otp"); // Redirect contoh (saat ini dikomentari)
        return; // Stop karena butuh OTP dulu
      }

      // =======================
      //    LOGIN SUKSES
      // ======================= // Bagian ketika login berhasil

      const idUser =
        data?.id_user ?? data?.data?.id_user ?? data?.user?.id_user; // Ambil id_user dari beberapa kemungkinan struktur response
      const username =
        data?.username ?? data?.data?.username ?? data?.user?.username; // Ambil username dari beberapa kemungkinan
      const emailFromApi =
        data?.email ?? data?.data?.email ?? data?.user?.email ?? email; // Ambil email dari API, fallback ke input email

      const user = { // Buat objek user yang akan disimpan
        id_user: idUser, // Isi id_user
        username: username, // Isi username
        email: emailFromApi, // Isi email
      };

      // simpan objek user (JSON) // Simpan user lengkap ke localStorage
      localStorage.setItem("user", JSON.stringify(user)); // Simpan objek user sebagai JSON string

      // simpan id_user sebagai angka (INT8, tidak di-JSON.stringify) // Simpan id_user raw (string/angka)
      if (idUser != null) { // Pastikan idUser ada
        localStorage.setItem("id_user", idUser); // Simpan id_user
      }

      // username & email sebagai TEXT // Simpan username/email sebagai string biasa
      if (username) { // Jika username ada
        localStorage.setItem("username", username); // Simpan username
      }
      if (emailFromApi) { // Jika email ada
        localStorage.setItem("email", emailFromApi); // Simpan email
      }

      navigate("/workspaces"); // Redirect ke halaman workspaces setelah login sukses
    } catch (err) { // Tangkap error fetch/exception
      console.error("Login error:", err); // Log error ke console
      const message = "Login failed. Please try again."; // Pesan error fallback
      setErrorMsg(message); // Set error message di UI
      showAlert({ // Tampilkan alert error
        icon: "ri-error-warning-fill", // Icon error
        title: "Login Error", // Judul alert
        desc: message, // Isi deskripsi alert
        variant: "destructive", // Mode destructive
        width: 676, // Lebar alert
        height: 380, // Tinggi alert
      });
    } finally { // Selalu dieksekusi setelah try/catch
      setLoading(false); // berhenti loading: matikan loading tombol login manual
    }
  };


  // Handler login dengan Google, endpoint sama seperti Mobile
  const handleGoogleLogin = async () => { // Fungsi saat user klik tombol Google
    try { // Try agar error bisa ditangkap dan di-alert
      setErrorMsg(""); // Reset error message
      setGoogleLoading(true); // Nyalakan loading google (untuk disable tombol/loader)

      const res = await fetch("/api/auth/google/server"); // Request endpoint untuk dapat URL redirect OAuth Google
      const data = await res.json(); // Parse JSON response

      if (!res.ok) { // Jika HTTP status tidak OK
        const message = data.error || "Google login failed"; // Ambil pesan error dari server atau default
        // Tampilkan alert error dari server
        showAlert({
          icon: "ri-error-warning-fill", // Icon error
          title: "Google Login Failed", // Judul alert
          desc: message, // Deskripsi alert
          variant: "destructive", // Variasi error
          width: 676, // Lebar alert
          height: 380, // Tinggi alert
        });
        throw new Error(message); // Lempar error agar masuk ke catch
      }

      if (data.url) { // Jika server mengembalikan url redirect
        window.location.href = data.url; // Redirect browser ke halaman OAuth Google
      } else { // Jika url tidak ada
        const message = "No redirect URL from server"; // Pesan error
        showAlert({ // Alert error
          icon: "ri-error-warning-fill", // Icon error
          title: "Google Login Error", // Judul alert
          desc: message, // Isi alert
          variant: "destructive", // Variasi error
          width: 676, // Lebar
          height: 380, // Tinggi
        });
        throw new Error(message); // Lempar error untuk ditangkap catch
      }
    } catch (err) { // Tangkap error login google
      console.error("Google login error (desktop):", err); // Log error ke console
      const message = err?.message || "Google login failed. Please try again."; // Tentukan pesan error
      setErrorMsg(message); // Set error message di UI
      //Alert untuk error yang tertangkap
      showAlert({
        icon: "ri-error-warning-fill", // Icon error
        title: "Google Login Error", // Judul
        desc: message, // Deskripsi
        variant: "destructive", // Mode error
        width: 676, // Lebar
        height: 380, // Tinggi
      });
      setGoogleLoading(false); // Matikan google loading jika terjadi error
    }
  };

  // Handle callback setelah Google OAuth (ambil token dari hash)
  useEffect(() => { // Effect dijalankan saat komponen mount dan saat navigate/showAlert berubah
    const hash = window.location.hash; // Ambil bagian hash URL (setelah #)
    if (!hash.includes("access_token")) return; // Jika tidak ada access_token, skip (bukan callback)

    setGoogleLoading(true) // Nyalakan loading selama proses callback

    const params = new URLSearchParams(hash.substring(1)); // Parse hash tanpa '#' menjadi query params
    const access_token = params.get("access_token"); // Ambil access_token dari hash
    const refresh_token = params.get("refresh_token"); // Ambil refresh_token dari hash (jika ada)

    if (!access_token) return; // Jika access_token tidak ada, stop

    fetch("/api/auth/google/callback", { // Kirim token ke backend untuk verifikasi & tukar menjadi user app
      method: "POST", // Metode POST
      headers: { "Content-Type": "application/json" }, // Header JSON
      body: JSON.stringify({ access_token, refresh_token }), // Body: token-token dari Google
    })
      .then((res) => res.json()) // Parse response JSON
      .then((data) => { // Handle data dari backend
        console.log("GOOGLE CALLBACK DATA (desktop):", data); // Debug log response

        if (data.error) { // Jika backend mengembalikan error
          const message = data.error || "Google login callback failed."; // Tentukan pesan error
          setErrorMsg(message); // Set errorMsg untuk UI
          showAlert({ // Tampilkan alert error callback
            icon: "ri-error-warning-fill", // Icon error
            title: "Google Login Callback Failed", // Judul alert
            desc: message, // Deskripsi alert
            variant: "destructive", // Mode error
            width: 676, // Lebar
            height: 380, // Tinggi
          });
          return; // Stop proses
        }

        // dari log: { id_user, username, email } 
        if (data.email) { // Validasi pertama harus ada email
          const idUser =
            data?.id_user ?? data?.data?.id_user ?? data?.user?.id_user; // Ambil id_user dari beberapa kemungkinan variabel penyimpanan
          const username =
            data?.username ?? data?.data?.username ?? data?.user?.username; // Ambil username
          const emailFromApi =
            data?.email ?? data?.data?.email ?? data?.user?.email; // Ambil email

          const user = { // Bentuk object user
            id_user: idUser, // Isi id_user
            username: username, // Isi username
            email: emailFromApi, // Isi email
          };

          // Simpan data user ke localStorage
          localStorage.setItem("user", JSON.stringify(user)); // Simpan user JSON

          // Simpan id_user raw
          if (idUser != null) { // Pastikan idUser ada
            localStorage.setItem("id_user", idUser); // Simpan id_user
          }

          // Simpan username & email plain text
          if (username) { // Jika username ada
            localStorage.setItem("username", username); // Simpan username
          }
          if (emailFromApi) { // Jika email ada
            localStorage.setItem("email", emailFromApi); // Simpan email
          }

          navigate("/workspaces"); // Redirect setelah login Google sukses
        } else { // Jika response tidak valid (tidak ada email)
          const message = "Google login failed: invalid response from server."; // Pesan invalid response
          setErrorMsg(message); // Set error message
          // Alert untuk response tidak sesuai
          showAlert({
            icon: "ri-error-warning-fill", // Icon error
            title: "Google Login Error", // Judul
            desc: message, // Deskripsi
            variant: "destructive", // Mode error
            width: 676, // Lebar
            height: 380, // Tinggi
          });
        }
      })
      .catch((err) => { // Tangkap error network/exception callback
        console.error("Google callback error (desktop):", err); // Log error
        const message = "Google login failed. Please try again."; // Pesan fallback
        setErrorMsg(message); // Set error message UI
        // Alert error callback
        showAlert({
          icon: "ri-error-warning-fill", // Icon error
          title: "Google Login Callback Error", // Judul
          desc: message, // Deskripsi
          variant: "destructive", // Mode error
          width: 676, // Lebar
          height: 380, // Tinggi
        });
      })
      .finally(() => { 
        const cleanUrl = window.location.pathname + window.location.search; // Bentuk URL tanpa hash
        window.history.replaceState({}, document.title, cleanUrl); // Replace URL sekarang tanpa reload
        setGoogleLoading(false); // Matikan loading google
      });
  }, [navigate, showAlert]); // Dependency array: gunakan navigate & showAlert

  return ( // Render UI halaman login desktop
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white"> {/* Container full screen, background hitam */}
      {googleLoading && <Loader />} {/* Jika loading google aktif, tampilkan Loader */}
      {/* === BACKGROUND === */} {/* Bagian background dekoratif */}
      <div className="absolute inset-0 pointer-events-none select-none"> {/* Layer background, non-interactive */}
        <img
          src="/Asset 1.svg" // Gambar dekorasi 1
          alt="Asset 1" // Alt text untuk aksesibilitas
          className="absolute z-0" // Position absolute, z-index 0
          style={{
            width: vw(1224.58), // Lebar responsif berdasarkan vw helper
            height: vh(739.76), // Tinggi responsif berdasarkan vh helper
            left: vw(0.13), // Posisi kiri
            top: vh(200), // Posisi atas
            transform: "rotate(4deg)", // Rotasi dekorasi
            opacity: 0.9, // Transparansi
          }}
        />
        <img
          src="/Asset 2.svg" // Gambar dekorasi 2
          alt="Asset 2" // Alt text
          className="absolute z-10" // Position absolute, z-index 10
          style={{
            width: vw(526), // Lebar responsif
            height: vh(589), // Tinggi responsif
            left: vw(456), // Posisi kiri
            bottom: vh(400), // Posisi dari bawah
            opacity: 1, // Opacity penuh
          }}
        />
        <img
          src="/Asset 4.svg" // Gambar dekorasi 3 (namanya Asset 4.svg)
          alt="Asset 3" // Alt text (label “Asset 3”)
          className="absolute z-10" // Position absolute, z-index 10
          style={{
            width: vw(632), // Lebar responsif
            height: vh(538), // Tinggi responsif
            right: vw(1125), // Posisi dari kanan
            top: vh(100), // Posisi dari atas
            transform: "rotate(-4deg)", // Rotasi berlawanan
            opacity: 0.9, // Transparansi
          }}
        />
      </div>

      {/* === CONTENT === */} {/* Konten utama halaman */}
      <div className="relative z-20 flex h-full w-full"> {/* Layout flex full screen, di atas background */}
        {/* LEFT SIDE */} {/* Bagian kiri (branding) */}
        <div className="flex h-full grow flex-col pt-[50px] pl-[52px]"> {/* Container kiri dengan padding */}
          <div
            className="inline-flex items-baseline gap-1 leading-none" // Flex inline untuk logo teks
            style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700 }} // Font logo
          >
            <span className="text-[128px] tracking-tight text-logo">GRA</span> {/* Bagian teks logo dengan class warna tertentu */}
            <span className="text-[128px] tracking-tight text-white">DIA</span> {/* Bagian teks logo kedua warna putih */}
          </div>
          <p
            className="ml-2 -mt-2.5 font-[Inter] font-semibold leading-[1.2]" // Tagline styling
            style={{ fontSize: 36 }} // Ukuran font tagline
          >
            <span
              style={{
                display: "inline-block", // Supaya gradient clip ke span
                background: "linear-gradient(180deg, #FAFAFA 0%, #8B8B8B 100%)", // Gradient teks tagline
                WebkitBackgroundClip: "text", // Clip background ke teks (webkit)
                backgroundClip: "text", // Clip background ke teks
                WebkitTextFillColor: "transparent", // Isi teks transparan (webkit)
                color: "transparent", // Isi teks transparan
              }}
            >
              Manage Smarter, {/* Baris tagline 1 */}
              <br /> {/* Line break */}
              Achieve More {/* Baris tagline 2 */}
            </span>
          </p>
        </div>

        {/* RIGHT DRAWER */} {/* Panel kanan berisi form login */}
        <aside
          className="relative h-full flex flex-col font-[Inter]" // Drawer container
          style={{
            width: vw(DRAWER_W), // Lebar drawer responsif
            background: "rgba(255,255,255,0.10)", // Background putih transparan
            border: "1px solid transparent", // Border awal transparan (dipakai border-image)
            borderImageSlice: 1, // Pengaturan border-image
            borderImageSource: BORDER_GRADIENT, // Border image pakai gradient
            borderRadius: "18px", // Radius drawer
            backdropFilter: "blur(10px)", // Efek blur belakang (glassmorphism)
            color: "#A3A3A3", // Warna teks default
            paddingLeft: PAD_X, // Padding kiri
            paddingRight: PAD_X, // Padding kanan
            paddingTop: TOP_HEADER, // Padding atas
            paddingBottom: 12, // Padding bawah
            justifyContent: "space-between", // Distribusi konten vertikal
          }}
        >
          <div className="h-dvh flex flex-col justify-between"> {/* Isi drawer: full height, flex column */}
            {/* HEADER */} {/* Header form login */}
            <header className="text-center mb-14"> {/* Header center dengan margin bawah */}
              <h1
                className="text-[48px] font-extrabold leading-tight mb-2" // Judul besar
                style={gradientText} // Pakai style gradientText
              >
                Welcome Back {/* Teks judul */}
              </h1>
              <p className="text-[18px] leading-snug"> {/* Deskripsi header */}
                Gradia helps you organize, login and turn your self- management
                into real results. {/* Teks deskripsi */}
              </p>
            </header>

            {/* FORM */} {/* Form login manual */}
            <form onSubmit={handleLogin}> {/* Saat submit panggil handleLogin */}
              {/* Email */} {/* Field email */}
              <div className="mb-[18px] mt-5"> {/* Wrapper input email */}
                <div className="flex items-center gap-2 mb-1"> {/* Label dengan icon */}
                  <i className="ri-mail-line text-[16px]" /> {/* Icon email (remix icon) */}
                  <span className="text-[14px]">Email</span> {/* Label Email */}
                </div>
                <div style={gradientBorderWrapper}> {/* Wrapper untuk border gradient */}
                  <div style={gradientBorderOverlay} /> {/* Overlay border gradient */}
                  <input
                    type="email" // Input type email
                    style={inputStyle} // Style input
                    value={email} // Bind state email
                    onChange={(e) => setEmail(e.target.value)} // Update state saat user mengetik
                    autoComplete="email" // Hint autofill browser
                    required // Wajib diisi
                  />
                </div>
              </div>

              {/* Password */} {/* Field password */}
              <div className="mb-6"> {/* Wrapper password */}
                <div className="flex items-center gap-2 mb-1"> {/* Label dengan icon */}
                  <i className="ri-lock-2-line text-[16px]" /> {/* Icon lock */}
                  <span className="text-[14px]">Password</span> {/* Label Password */}
                </div>
                <div style={gradientBorderWrapper}> {/* Wrapper untuk border gradient */}
                  <div style={gradientBorderOverlay} /> {/* Overlay border gradient */}
                  <input
                    type="password" // Input type password (masked)
                    style={inputStyle} // Style input
                    value={password} // Bind state password
                    onChange={(e) => setPassword(e.target.value)} // Update password saat mengetik
                    autoComplete="current-password" // Hint autofill password manager
                    required // Wajib diisi
                  />
                </div>
              </div>

              {/* Error message */} {/* Pesan error jika login gagal */}
              {errorMsg && ( // Render hanya jika errorMsg tidak kosong
                <p className="mb-4 text-center text-sm text-red-400"> {/* Styling error text */}
                  {errorMsg} {/* Isi pesan error */}
                </p>
              )}

              {/* Forgot Password */} {/* Link reset password */}
              <div className="flex justify-end my-8 mt-12"> {/* Container link, align kanan */}
                <Link
                  to="/auth/reset-password/email" // Route menuju halaman reset password via email
                  className="text-[14px] hover:text-white" // Styling link
                >
                  Forgot Password? {/* Teks link */}
                </Link>
              </div>

              {/* Buttons */} {/* Bagian tombol login */}
              <div className="flex items-center gap-4 mb-8"> {/* Row tombol, 2 kolom */}
                {/* Google */} {/* Tombol login Google */}
                <button
                  type="button" // Button biasa (bukan submit)
                  className="flex w-1/2 items-center justify-center gap-2 px-4 py-3 text-[16px]" // Styling layout
                  style={{
                    background: "transparent", // Transparan
                    border: "1px solid rgba(163,163,163,0.8)", // Border abu
                    borderRadius: 8, // Radius tombol
                    opacity: googleLoading ? 0.7 : 1, // Opacity turun saat loading
                    cursor: googleLoading ? "not-allowed" : "pointer", // pointer untuk button
                    transition: "filter 0.2s ease, opacity 0.2s ease", // smooth hover
                  }}
                  onClick={googleLoading ? undefined : handleGoogleLogin} // Disable click jika loading, jika tidak panggil handleGoogleLogin
                  onMouseEnter={(e) => { // Hover enter: terangin tombol
                    if (!googleLoading)
                      e.currentTarget.style.filter = "brightness(1.15)"; // Tambah brightness saat hover
                  }}
                  onMouseLeave={(e) => { // Hover leave: balik normal
                    e.currentTarget.style.filter = "brightness(1)"; // Reset brightness
                  }}
                >
                  <svg
                    width="20" // Lebar icon
                    height="20" // Tinggi icon
                    viewBox="0 0 48 48" // Viewbox svg
                    aria-hidden="true" // Abaikan untuk screen reader (dekoratif)
                  >
                    <path
                      fill="#EA4335" // Warna merah (Google)
                      d="M24 9.5c3.54 0 6.73 1.23 9.24 3.64l6.9-6.9C35.9 2.38 30.29 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.65 6.71C13.03 14.21 18.04 9.5 24 9.5z" // Path bagian merah logo Google
                    />
                    <path
                      fill="#4285F4" // Warna biru (Google)
                      d="M46.5 24c0-1.64-.15-3.21-.44-4.73H24v9h12.7c-.55 2.95-2.2 5.45-4.7 7.14l7.18 5.58C43.76 37.1 46.5 31.06 46.5 24z" // Path bagian biru logo Google
                    />
                    <path
                      fill="#FBBC05" // Warna kuning (Google)
                      d="M11.21 28.93A14.5 14.5 0 0 1 9.5 24c0-1.72.31-3.36.86-4.86l-8.65-6.71A24 24 0 0 0 0 24c0 3.84.92 7.47 2.56 10.78z" // Path bagian kuning logo Google
                    />
                    <path
                      fill="#34A853" // Warna hijau (Google)
                      d="M24 48c6.48 0 11.93-2.13 15.91-5.78l-7.18-5.58c-2 1.34-4.57 2.13-8.73 2.13-5.96 0-10.97-4.71-12.79-11.21l-8.65 6.71C6.51 42.62 14.62 48 24 48z" // Path bagian hijau logo Google
                    />
                  </svg>
                  {googleLoading ? "Loading..." : "Google"} {/* Teks tombol berubah saat loading */}
                </button>

                {/* Log In manual */} {/* Tombol login manual submit */}
                <button
                  type="submit" // Submit form
                  disabled={loading} // Disable saat loading login manual
                  className="w-1/2 px-4 py-3 text-[14px] font-semibold flex items-center justify-center" // Styling tombol
                  style={{
                    background:
                      "linear-gradient(90deg, #34146C 0%, #28073B 100%)", // Background gradient tombol
                    border: "none", // Tanpa border
                    borderRadius: 8, // Radius tombol
                    cursor: loading ? "not-allowed" : "pointer", // pointer khusus button
                    opacity: loading ? 0.7 : 1, // Turunkan opacity saat loading
                    transition: "filter 0.2s ease, opacity 0.2s ease", // hover halus
                  }}
                >
                  {/*tampilkan spinner saat loading */}
                  {loading && ( // Render spinner saat loading true
                    <i className="ri-loader-4-line animate-spin mr-2" /> // Icon loader dengan animasi spin
                  )}
                  <span style={gradientText}> {/* Text tombol pakai gradientText */}
                    {loading ? "Logging in..." : "Log In"} {/* Teks tombol sesuai state */}
                  </span>
                </button>
              </div>

              {/* Footer */} 
              <div className="text-center"> {/* Center align */}
                <p className="text-[14px] mb-14"> {/* Teks kecil */}
                  Don’t have an account?{" "} {/* Teks dan spasi jsx */}
                  <Link
                    to="/auth/register" // Route menuju halaman register
                    className="hover:underline" // Styling hover underline
                    style={{ color: "#643EB2" }} // Warna link ungu
                  >
                    Register here {/* Teks link */}
                  </Link>
                </p>
              </div>
            </form>

            <p className="text-[12px] leading-none w-full text-center py-16"> {/* Copyright */}
              © {new Date().getFullYear()} Gradia. All rights reserved. {/* Tahun otomatis + teks */}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Login; // Export default komponen Login agar bisa dipakai di routing/app
