// Import Supabase client untuk koneksi ke database
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,        // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY    // Public anon key Supabase
);

// Fungsi API untuk verifikasi OTP (reset password / registrasi)
export default async function verifyResetOtp(req, res) {

  // Cek apakah request menggunakan method POST
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Variabel untuk menampung body request
  let body = "";

  // Menerima data body secara streaming
  req.on("data", (chunk) => (body += chunk.toString()));

  // Dipanggil setelah seluruh body diterima
  req.on("end", async () => {
    try {
      // Parsing JSON body untuk mendapatkan email dan OTP
      const { email, otp_code } = JSON.parse(body);

      // Validasi input: email dan otp wajib diisi
      if (!email || !otp_code) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Email and OTP code are required." }));
      }

      // 🔹 Cari user berdasarkan email
      const { data: user, error: userError } = await supabase
        .from("users")                                   // Tabel users
        .select("id_user, email")                        // Kolom yang diambil
        .eq("email", email.trim().toLowerCase())         // Filter email
        .maybeSingle();                                  // Ambil satu data

      // Jika terjadi error query user
      if (userError) throw userError;

      // Jika user tidak ditemukan
      if (!user)
        return res
          .writeHead(404, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "User not found." }));

      // 🔹 Cari OTP berdasarkan user dan kode OTP
      const { data: otp, error: otpError } = await supabase
        .from("otp")                                     // Tabel OTP
        .select("*")                                     // Ambil semua kolom
        .eq("id_user", user.id_user)                     // Filter user
        .eq("otp_code", otp_code.toString().trim())      // Cocokkan OTP
        .order("created_at", { ascending: false })       // Ambil OTP terbaru
        .limit(1)                                        // Hanya satu data
        .maybeSingle();                                  // Bisa null

      // Jika terjadi error query OTP
      if (otpError) throw otpError;

      // Jika OTP tidak ditemukan
      if (!otp)
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Invalid OTP code." }));

      // 🔹 Cek apakah OTP sudah kadaluarsa
      if (new Date() > new Date(otp.expires_at)) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "OTP code has expired." }));
      }

      // 🔹 Cek apakah OTP sudah pernah digunakan
      if (otp.is_used) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "OTP code has already been expired." }));
      }

      // 🔹 Tandai OTP sebagai sudah digunakan
      await supabase
        .from("otp")                                     // Tabel OTP
        .update({
          is_used: true,                                 // Set OTP terpakai
          used_at: new Date().toISOString(),             // Waktu penggunaan OTP
        })
        .eq("id_otp", otp.id_otp);                       // Berdasarkan ID OTP

      // 🔹 Jika OTP untuk reset password
      if (otp.purpose === "reset-password") {
        await supabase
          .from("users")                                 // Tabel users
          .update({ reset_verified: true })              // Tandai reset valid
          .eq("id_user", user.id_user);                  // Berdasarkan user

        return res
          .writeHead(200, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              message: "Password reset OTP successfully verified.",
              otp_verified: true,
              redirect: "/new-password",                 // Redirect halaman
            })
          );
      }

      // 🔹 Jika OTP untuk registrasi atau verifikasi akun
      if (otp.purpose === "registration" || otp.purpose === "verification") {
        await supabase
          .from("users")                                 // Tabel users
          .update({ is_verified: true })                 // Verifikasi akun
          .eq("id_user", user.id_user);                  // Berdasarkan user

        return res
          .writeHead(200, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              message: "Registration verification successful.",
              otp_verified: true,
            })
          );
      }

      // 🔹 Jika tujuan OTP tidak dikenali
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unknown OTP purpose." }));

    } catch (err) {
      // Log error di server
      console.error("VERIFY RESET OTP ERROR:", err);

      // Kirim response error ke client
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
