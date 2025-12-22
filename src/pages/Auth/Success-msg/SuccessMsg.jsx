// Mengimpor React dan hook useMemo (dipakai untuk menghitung nilai dan di-cache biar tidak dihitung ulang terus)
import React, { useMemo } from "react"; // Import React + useMemo untuk optimasi/perhitungan yang diingat

// Mengimpor useLocation untuk membaca data lokasi router (path, query string, dan state)
import { useLocation } from "react-router-dom"; // Dipakai untuk ambil location.state dan location.search

// Mengimpor useMediaQuery untuk cek ukuran layar (biar bisa bedain mobile/tablet/desktop)
import { useMediaQuery } from "react-responsive"; // Dipakai untuk conditional render berdasarkan ukuran layar

// Mengimpor PropTypes untuk validasi tipe data props pada komponen
import PropTypes from "prop-types";  // Dipakai untuk memastikan props 'type' itu string

// Mengimpor komponen Mobile (layout khusus untuk tampilan mobile/tablet)
import Mobile from "./Layout/Mobile"; // Komponen tampilan versi mobile/tablet

// ===== Presentational (Desktop) ===== // Penanda: komponen berikut khusus tampilan desktop

// Komponen tampilan sukses untuk verifikasi email (untuk desktop)
function RegisterSuccess() { // Fungsi komponen React untuk halaman sukses verifikasi email
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`; // Fungsi bantu: ubah px ke vw berdasarkan desain lebar 1440
  const vh = (px) => `calc(${(px / 768) * 100}vh)`; // Fungsi bantu: ubah px ke vh berdasarkan desain tinggi 768
  const GAP_TITLE_TO_P = vh(20); // Jarak vertikal antara judul dan paragraf
  const GAP_P_TO_LINK = vh(36); // Jarak vertikal antara paragraf dan link
  const GAP_LINK_TO_CC = vh(160); // Jarak vertikal antara link dan area copyright

  return ( // Mulai mengembalikan tampilan JSX untuk komponen ini
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white"> {/* Wrapper full layar, background hitam, teks putih */}
      {/* BACKGROUND */} {/* Komentar: bagian background dekoratif */}
      <div className="absolute inset-0 pointer-events-none select-none"> {/* Layer background: full layar, tidak bisa diklik & tidak bisa diseleksi */}
        <img // Gambar background 1
          src="/Asset 1.svg" // Lokasi file gambar Asset 1
          alt="Asset 1" // Teks alternatif untuk aksesibilitas
          className="absolute z-0" // Posisi absolute dan berada di layer z-0
          style={{ // Style inline untuk mengatur ukuran & posisi gambar
            width: vw(1410.82), // Lebar gambar dibuat responsif pakai vw
            height: vh(1185.82), // Tinggi gambar dibuat responsif pakai vh
            left: vw(300.13), // Posisi kiri gambar
            top: vh(-20), // Posisi atas gambar (negatif biar naik ke atas)
            transform: "rotate(-360deg)", // Rotasi gambar (secara visual sama dengan 0 derajat, tapi tetap explicit)
            transformOrigin: "50% 50%", // Titik pusat rotasi di tengah gambar
            opacity: 0.9, // Transparansi gambar
          }} // Akhir objek style
        /> {/* Akhir img Asset 1 */}
        <img // Gambar background 2
          src="/Asset 2.svg" // Lokasi file gambar Asset 2
          alt="Asset 2" // Teks alternatif untuk aksesibilitas
          className="absolute z-0" // Posisi absolute dan berada di layer z-0
          style={{ // Style inline untuk mengatur ukuran & posisi gambar
            width: vw(778), // Lebar gambar responsif
            height: vh(871), // Tinggi gambar responsif
            left: vw(58), // Jarak dari kiri
            bottom: vh(114), // Jarak dari bawah
            opacity: 1, // Transparansi (1 = solid)
          }} // Akhir objek style
        /> {/* Akhir img Asset 2 */}
        <img // Gambar background 3 (di sini pakai Asset 4 tapi alt-nya Asset 3, ini sesuai kode asli)
          src="/Asset 4.svg" // Lokasi file gambar Asset 4
          alt="Asset 3" // Teks alternatif (tetap mengikuti kode asli)
          className="absolute z-0" // Posisi absolute dan berada di layer z-0
          style={{ // Style inline untuk mengatur ukuran & posisi gambar
            width: vw(861), // Lebar gambar responsif
            height: vh(726), // Tinggi gambar responsif
            right: vw(904), // Jarak dari kanan
            top: vh(322), // Jarak dari atas
            opacity: 0.9, // Transparansi
          }} // Akhir objek style
        /> {/* Akhir img Asset 4 */}
      </div> {/* Akhir container BACKGROUND */}

      {/* OVERLAY */} {/* Komentar: layer overlay gradient di atas background */}
      <div // Div overlay gradient
        className="absolute inset-0 z-5" // Full layar, z-index di atas background
        style={{ // Style inline untuk gradient overlay
          background: // Properti background
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)", // Gradient hitam transparan dari atas ke bawah
        }} // Akhir objek style
      /> {/* Akhir overlay */}

      {/* CONTENT */} {/* Komentar: konten utama (judul, paragraf, link, copyright) */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center text-center"> {/* Layer konten utama di atas overlay */}
        <div // Container untuk judul dan icon checklist
          className="flex items-center justify-center gap-[0.5vw]" // Flex horizontal, center, jarak antar item 0.5vw
          style={{ marginTop: vh(100) }} // Margin atas untuk menurunkan konten sedikit
        > {/* Awal baris judul + icon */}
          <h1 // Heading utama
            className="font-extrabold leading-tight" // Font tebal banget dan line-height rapat
            style={{ // Style inline untuk font, ukuran, dan efek gradient text
              fontFamily: "Inter, ui-sans-serif, system-ui", // Menggunakan font Inter (fallback ke system)
              fontSize: vw(48), // Ukuran font responsif berdasarkan vw
              backgroundImage: "linear-gradient(180deg, #FAFAFA 0%, #949494 100%)", // Gradient warna untuk teks
              WebkitBackgroundClip: "text", // Clip background ke area text (buat efek gradient text di webkit)
              color: "transparent", // Warna teks dibuat transparan supaya gradient background terlihat
              display: "inline-block", // Membuat elemen teks sebagai inline-block
            }} // Akhir objek style
          > {/* Awal isi judul */}
            Email Verified Successfully {/* Teks judul yang ditampilkan */}
          </h1> {/* Akhir h1 */}
          <i // Icon checklist (dari library icon yang dipakai, misal Remix Icon)
            className="ri-checkbox-circle-fill" // Nama class icon
            style={{ fontSize: vw(40), color: "#FAFAFA", marginTop: vh(2) }} // Atur ukuran, warna, dan sedikit geser turun
          /> {/* Akhir icon */}
        </div> {/* Akhir container judul + icon */}

        <div style={{ height: GAP_TITLE_TO_P }} /> {/* Spacer kosong untuk jarak antara judul dan paragraf */}

        <div style={{ width: vw(646) }}> {/* Container untuk membatasi lebar paragraf */}
          <p // Paragraf penjelasan
            style={{ // Style inline untuk teks paragraf
              fontFamily: "Inter, ui-sans-serif, system-ui", // Font paragraf
              fontSize: vw(20), // Ukuran font paragraf responsif
              color: "#A3A3A3", // Warna teks abu-abu
              lineHeight: 1.2, // Tinggi baris
            }} // Akhir objek style
          > {/* Awal isi paragraf */}
            Your email has been successfully verified. {/* Baris pertama paragraf */}
            <br /> {/* Pindah baris */}
            You can now log in and continue managing your goals with Gradia. {/* Baris kedua paragraf */}
          </p> {/* Akhir paragraf */}
        </div> {/* Akhir container paragraf */}

        <div style={{ height: GAP_P_TO_LINK }} /> {/* Spacer kosong untuk jarak paragraf ke link */}

        <a // Link untuk kembali ke halaman login
          href="/auth/login" // Tujuan link ke route login
          className="hover:underline" // Efek hover: teks jadi underline
          style={{ // Style inline untuk link
            fontFamily: "Inter, ui-sans-serif, system-ui", // Font link
            fontSize: vw(16), // Ukuran font link responsif
            width: vw(206.5), // Lebar area link
            display: "inline-block", // Supaya width berlaku dan jadi area klik yang rapi
            cursor: "pointer", // ← DITAMBAHKAN (cursor jadi tangan saat hover)
          }} // Akhir objek style
        > {/* Awal isi link */}
          <span style={{ color: "#A3A3A3" }}>Back to</span>{" "} {/* Bagian teks "Back to" warna abu-abu, lalu ada spasi */}
          <span style={{ color: "#8B5CF6" }}>Login</span> {/* Bagian teks "Login" warna ungu */}
        </a> {/* Akhir link */}

        <div style={{ height: GAP_LINK_TO_CC }} /> {/* Spacer kosong untuk jarak link ke copyright */}

        <div // Container copyright
          className="flex items-center justify-center gap-[0.3vw]" // Flex horizontal dan center, jarak antar item 0.3vw
          style={{ // Style inline untuk teks copyright
            fontFamily: "Inter, ui-sans-serif, system-ui", // Font
            fontSize: vw(14), // Ukuran font kecil responsif
            color: "#A3A3A3", // Warna abu-abu
          }} // Akhir objek style
        > {/* Awal copyright */}
          <i className="ri-copyright-line" /> {/* Icon copyright */}
          <span>{new Date().getFullYear()} Gradia. All rights reserved.</span> {/* Tahun otomatis + teks copyright */}
        </div> {/* Akhir copyright */}
      </div> {/* Akhir CONTENT */}
    </div> // Akhir wrapper utama
  ); // Akhir return JSX
} // Akhir komponen RegisterSuccess

// Komponen tampilan sukses untuk reset password (untuk desktop)
function ForgotSuccess() { // Fungsi komponen React untuk halaman sukses reset password
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`; // Fungsi bantu: ubah px ke vw berdasarkan desain lebar 1440
  const vh = (px) => `calc(${(px / 768) * 100}vh)`; // Fungsi bantu: ubah px ke vh berdasarkan desain tinggi 768
  const GAP_TITLE_TO_P = vh(20); // Jarak vertikal antara judul dan paragraf
  const GAP_P_TO_LINK = vh(36); // Jarak vertikal antara paragraf dan link
  const GAP_LINK_TO_CC = vh(160); // Jarak vertikal antara link dan area copyright

  return ( // Mulai mengembalikan tampilan JSX untuk komponen ini
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white"> {/* Wrapper full layar, background hitam, teks putih */}
      {/* BACKGROUND */} {/* Komentar: bagian background dekoratif */}
      <div className="absolute inset-0 pointer-events-none select-none"> {/* Layer background: full layar, tidak bisa diklik & tidak bisa diseleksi */}
        <img // Gambar background 1
          src="/Asset 1.svg" // Lokasi file gambar Asset 1
          alt="Asset 1" // Teks alternatif untuk aksesibilitas
          className="absolute z-0" // Posisi absolute dan berada di layer z-0
          style={{ // Style inline untuk mengatur ukuran & posisi gambar
            width: vw(1410.82), // Lebar gambar dibuat responsif pakai vw
            height: vh(1185.82), // Tinggi gambar dibuat responsif pakai vh
            left: vw(300.13), // Posisi kiri gambar
            top: vh(-20), // Posisi atas gambar (negatif biar naik ke atas)
            transform: "rotate(-360deg)", // Rotasi gambar
            transformOrigin: "50% 50%", // Titik pusat rotasi
            opacity: 0.9, // Transparansi gambar
          }} // Akhir objek style
        /> {/* Akhir img Asset 1 */}
        <img // Gambar background 2
          src="/Asset 2.svg" // Lokasi file gambar Asset 2
          alt="Asset 2" // Teks alternatif untuk aksesibilitas
          className="absolute z-0" // Posisi absolute dan berada di layer z-0
          style={{ // Style inline untuk mengatur ukuran & posisi gambar
            width: vw(778), // Lebar gambar responsif
            height: vh(871), // Tinggi gambar responsif
            left: vw(58), // Jarak dari kiri
            bottom: vh(114), // Jarak dari bawah
            opacity: 1, // Transparansi
          }} // Akhir objek style
        /> {/* Akhir img Asset 2 */}
        <img // Gambar background 3
          src="/Asset 4.svg" // Lokasi file gambar Asset 4
          alt="Asset 3" // Teks alternatif (tetap sesuai kode)
          className="absolute z-0" // Posisi absolute dan berada di layer z-0
          style={{ // Style inline untuk mengatur ukuran & posisi gambar
            width: vw(861), // Lebar gambar responsif
            height: vh(726), // Tinggi gambar responsif
            right: vw(904), // Jarak dari kanan
            top: vh(322), // Jarak dari atas
            opacity: 0.9, // Transparansi
          }} // Akhir objek style
        /> {/* Akhir img Asset 4 */}
      </div> {/* Akhir container BACKGROUND */}

      {/* OVERLAY */} {/* Komentar: layer overlay gradient */}
      <div // Div overlay gradient
        className="absolute inset-0 z-5" // Full layar, z-index di atas background
        style={{ // Style inline untuk gradient overlay
          background: // Properti background
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)", // Gradient hitam transparan
        }} // Akhir objek style
      /> {/* Akhir overlay */}

      {/* CONTENT */} {/* Komentar: konten utama */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center text-center"> {/* Layer konten utama di atas overlay */}
        <div // Container untuk judul dan icon checklist
          className="flex items-center justify-center gap-[0.5vw]" // Flex, center, gap
          style={{ marginTop: vh(100) }} // Margin atas
        > {/* Awal judul + icon */}
          <h1 // Heading utama
            className="font-extrabold leading-tight" // Styling heading
            style={{ // Style inline untuk gradient text
              fontFamily: "Inter, ui-sans-serif, system-ui", // Font
              fontSize: vw(48), // Ukuran font
              backgroundImage: "linear-gradient(180deg, #FAFAFA 0%, #949494 100%)", // Gradient
              WebkitBackgroundClip: "text", // Clip ke text
              color: "transparent", // Transparan agar gradient terlihat
              display: "inline-block", // Inline-block
            }} // Akhir style
          > {/* Awal isi judul */}
            Password Reset Successful {/* Teks judul khusus reset password */}
          </h1> {/* Akhir h1 */}
          <i // Icon checklist
            className="ri-checkbox-circle-fill" // Class icon
            style={{ fontSize: vw(40), color: "#FAFAFA", marginTop: vh(2) }} // Ukuran & warna icon
          /> {/* Akhir icon */}
        </div> {/* Akhir container judul + icon */}

        <div style={{ height: GAP_TITLE_TO_P }} /> {/* Spacer judul ke paragraf */}

        <div style={{ width: vw(646) }}> {/* Container lebar paragraf */}
          <p // Paragraf penjelasan
            style={{ // Style paragraf
              fontFamily: "Inter, ui-sans-serif, system-ui", // Font
              fontSize: vw(20), // Ukuran font
              color: "#A3A3A3", // Warna
              lineHeight: 1.2, // Line height
            }} // Akhir style
          > {/* Awal isi paragraf */}
            Your password has been successfully updated. {/* Baris pertama */}
            <br /> {/* Pindah baris */}
            You can now log in and continue managing your goals with Gradia. {/* Baris kedua */}
          </p> {/* Akhir paragraf */}
        </div> {/* Akhir container paragraf */}

        <div style={{ height: GAP_P_TO_LINK }} /> {/* Spacer paragraf ke link */}

        <a // Link kembali ke login
          href="/auth/login" // Tujuan link
          className="hover:underline" // Efek hover underline
          style={{ // Style link
            fontFamily: "Inter, ui-sans-serif, system-ui", // Font
            fontSize: vw(16), // Ukuran font
            width: vw(206.5), // Lebar area link
            display: "inline-block", // Inline-block
            cursor: "pointer", // ← DITAMBAHKAN (cursor tangan)
          }} // Akhir style
        > {/* Awal isi link */}
          <span style={{ color: "#A3A3A3" }}>Back to</span>{" "} {/* Teks "Back to" abu-abu + spasi */}
          <span style={{ color: "#8B5CF6" }}>Login</span> {/* Teks "Login" ungu */}
        </a> {/* Akhir link */}

        <div style={{ height: GAP_LINK_TO_CC }} /> {/* Spacer link ke copyright */}

        <div // Container copyright
          className="flex items-center justify-center gap-[0.3vw]" // Flex dan center
          style={{ // Style copyright
            fontFamily: "Inter, ui-sans-serif, system-ui", // Font
            fontSize: vw(14), // Ukuran
            color: "#A3A3A3", // Warna
          }} // Akhir style
        > {/* Awal copyright */}
          <i className="ri-copyright-line" /> {/* Icon copyright */}
          <span>{new Date().getFullYear()} Gradia. All rights reserved.</span> {/* Tahun dinamis + teks */}
        </div> {/* Akhir copyright */}
      </div> {/* Akhir CONTENT */}
    </div> // Akhir wrapper utama
  ); // Akhir return
} // Akhir komponen ForgotSuccess

// ===== Wrapper (Mobile/Tablet vs Desktop) ===== // Penanda: bagian wrapper untuk pilih tampilan berdasarkan device

// Export default komponen utama SuccessMsg yang menerima props type
export default function SuccessMsg({ type: typeProp }) { // Komponen wrapper: menentukan tampilan berdasarkan type dan ukuran layar
  const location = useLocation(); // Ambil info location (search/query dan state) dari react-router
  const isMobile = useMediaQuery({ maxWidth: 767 }); // True jika layar <= 767px (mobile)
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 }); // True jika layar 768-1024px (tablet)

  const type = useMemo(() => { // useMemo: menghitung type sekali, hanya berubah jika dependency berubah
    const byProp = typeProp; // Prioritas 1: ambil type dari props
    const byState = location.state?.type; // Prioritas 2: ambil type dari state router (kalau ada)
    const byQuery = new URLSearchParams(location.search).get("type"); // Prioritas 3: ambil type dari query string (?type=...)
    const raw = (byProp || byState || byQuery || "register").toLowerCase(); // Ambil yang tersedia, default "register", lalu jadi huruf kecil
    return raw === "reset" ? "reset" : "register"; // Jika nilainya reset maka reset, selain itu dianggap register
  }, [typeProp, location.state, location.search]); // Dependency: jika prop/state/search berubah, type dihitung ulang

  if (isMobile || isTablet) return <Mobile type={type} />; // Kalau mobile/tablet, render komponen Mobile

  return type === "reset" ? <ForgotSuccess /> : <RegisterSuccess />; // Kalau desktop: pilih tampilan berdasarkan type
} // Akhir komponen SuccessMsg

// Menentukan aturan tipe props untuk komponen SuccessMsg
SuccessMsg.propTypes = { // Objek konfigurasi PropTypes
  type: PropTypes.string, // Props type harus string (opsional)
}; // Akhir PropTypes
