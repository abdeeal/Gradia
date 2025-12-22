// Import Supabase client untuk koneksi database
import { createClient } from "@supabase/supabase-js";

// Import Nodemailer untuk mengirim email
import nodemailer from "nodemailer";

// Inisialisasi client Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,        // URL Supabase
  process.env.VITE_SUPABASE_ANON_KEY    // Anon public key Supabase
);

// Email pengirim OTP
const EMAIL_USER = "gradianoreplay@gmail.com";

// App password Gmail (bukan password email asli)
const EMAIL_PASS = "wngp bsdw zexw qjub";

// Fungsi utama API untuk mengirim OTP
export default async function sendOtp(req, res) {

  // Cek apakah method request adalah POST
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    // Ambil email dan tujuan OTP dari request body
    const { email, purpose } = req.body; 

    // 🔹 Validasi input: email dan purpose wajib ada
    if (!email || !purpose) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ error: "Email and purpose are required." })
      );
    }

    // 🔹 Cari user berdasarkan email di tabel users
    const { data: user, error: userError } = await supabase
      .from("users")                         // Tabel users
      .select("*")                           // Ambil semua kolom
      .eq("email", email.trim().toLowerCase()) // Cocokkan email
      .maybeSingle();                        // Ambil satu data atau null

    // Jika ada error query user
    if (userError) throw userError;

    // Jika user tidak ditemukan
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Email not found." }));
    }

    // Waktu saat ini
    const now = new Date();

    // 🔹 Ambil OTP terakhir milik user
    const { data: oldOtp, error: otpError } = await supabase
      .from("otp")                                           // Tabel OTP
      .select("*")                                           // Ambil semua kolom
      .eq("id_user", user.id_user || user.id)                // Filter berdasarkan user
      .order("created_at", { ascending: false })             // Urutkan terbaru
      .limit(1)                                              // Ambil satu data
      .maybeSingle();                                        // Bisa null

    // Jika ada error query OTP
    if (otpError) throw otpError;

    // 🔹 Jika OTP lama masih aktif, tandai sebagai sudah digunakan
    if (oldOtp && new Date(oldOtp.expires_at) > now) {
      await supabase
        .from("otp")
        .update({ is_used: true })        // Set OTP lama jadi tidak aktif
        .eq("id_otp", oldOtp.id_otp);     // Berdasarkan ID OTP
    }

    // 🔹 Generate OTP baru 6 digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Tentukan waktu kadaluarsa OTP (5 menit)
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    // 🔹 Simpan OTP baru ke database
    const { error: insertError } = await supabase.from("otp").insert([
      {
        id_user: user.id_user || user.id, // ID user
        otp_code: otpCode,                // Kode OTP
        purpose,                          // Tujuan OTP
        is_used: false,                   // Status belum digunakan
        expires_at: expiresAt,            // Waktu kadaluarsa
      },
    ]);

    // Jika gagal insert OTP
    if (insertError) throw insertError;

    // 🔹 Konfigurasi transporter Nodemailer (SMTP Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",             // Host SMTP Gmail
      port: 465,                          // Port SSL
      secure: true,                       // Gunakan SSL
      auth: { 
        user: EMAIL_USER,                // Email pengirim
        pass: EMAIL_PASS                 // App password
      },
      tls: { rejectUnauthorized: false }, // Bypass sertifikat
    });

    // 🔹 Format email OTP
    const mailOptions = {
      from: `"Gradia App" <${EMAIL_USER}>`,  // Pengirim email
      to: email,                             // Penerima
      subject: `Your OTP Code for ${purpose}`, // Subject email
      html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h3>Hello ${user.username || user.email},</h3>
            <p>Your OTP code for <b>${purpose}</b> is:</p>
            <h2 style="letter-spacing: 4px; color: #007bff;">${otpCode}</h2>
            <p>This code is valid until <b>${new Date(
              expiresAt
            ).toLocaleString()}</b>.</p>
            <br/>
            <p>Thank you,<br/>The Gradia Team</p>
          </div>
        `,
    };

    // 🔹 Kirim email OTP
    await transporter.sendMail(mailOptions);

    // 🔹 Kirim response sukses ke client
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: `OTP successfully sent to ${email}`,
        otp_code: otpCode,       // (biasanya tidak dikirim di production)
        expires_at: expiresAt,   // Waktu kadaluarsa OTP
      })
    );

  } catch (err) {
    // Log error di server
    console.error("SEND OTP ERROR:", err);

    // Kirim response error ke client
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
