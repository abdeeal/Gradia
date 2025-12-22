// Mengimpor fungsi createClient dari library Supabase
import { createClient } from "@supabase/supabase-js";

// Mengimpor library nodemailer untuk pengiriman email
import nodemailer from "nodemailer";

// Mengimpor bcrypt untuk hashing password
import bcrypt from "bcrypt";

// Membuat instance Supabase client menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,      // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY  // Anonymous key Supabase
);

// Email pengirim untuk OTP reset password
const EMAIL_USER = "gradianoreplay@gmail.com";

// App password email pengirim
const EMAIL_PASS = "wngp bsdw zexw qjub";

// Fungsi utama API reset password
export default async function resetPassword(req, res) {

  // Mengecek apakah method HTTP adalah POST
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Variabel untuk menampung body request
  let body = "";

  // Mengambil data body request secara bertahap
  req.on("data", (chunk) => (body += chunk.toString()));

  // Ketika seluruh body request telah diterima
  req.on("end", async () => {
    try {
      // Parsing body JSON menjadi object
      const { action, email, otp_code, new_password } = JSON.parse(body);

      // Validasi apakah parameter action tersedia
      if (!action) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Action is required." }));
      }

      // =======================
      // ACTION 1: SEND OTP
      // =======================
      if (action === "send-otp") {

        // Validasi email
        if (!email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Email is required." }));
        }

        // Mengecek apakah email terdaftar di tabel users
        const { data: user, error: userError } = await supabase
          .from("users")          // Tabel users
          .select("*")            // Ambil semua kolom
          .eq("email", email)     // Filter berdasarkan email
          .maybeSingle();         // Ambil satu data jika ada

        // Jika terjadi error saat query
        if (userError) throw userError;

        // Jika email tidak ditemukan
        if (!user) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Email not found." }));
        }

        // Membuat kode OTP 6 digit secara acak
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Menentukan waktu kadaluarsa OTP (5 menit)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Menyimpan OTP ke tabel otp
        const { error: otpError } = await supabase.from("otp").insert([
          {
            id_user: user.id_user || user.id, // ID user
            otp_code: otpCode,                // Kode OTP
            expires_at: expiresAt,            // Waktu kadaluarsa
            is_used: false,                   // Status OTP belum digunakan
            purpose: "reset-password",        // Tujuan OTP
          },
        ]);

        // Jika gagal insert OTP
        if (otpError) throw otpError;

        // Konfigurasi transporter email menggunakan Gmail SMTP
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com", // Server SMTP Gmail
          port: 465,              // Port SSL
          secure: true,           // Menggunakan SSL
          auth: {
            user: EMAIL_USER,     // Email pengirim
            pass: EMAIL_PASS,     // Password email
          },
        });

        // Konfigurasi isi email OTP
        const mailOptions = {
          from: `"Gradia App" <${EMAIL_USER}>`, // Nama dan email pengirim
          to: email,                            // Email tujuan
          subject: "Your Password Reset OTP Code", // Subjek email
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h3>Hello ${user.username || email},</h3>
              <p>We received a request to reset your password.</p>
              <p>Your OTP code is:</p>
              <h2 style="letter-spacing: 4px; color: #007bff;">${otpCode}</h2>
              <p>This code is valid until <b>${new Date(
                expiresAt
              ).toLocaleString()}</b>.</p>
              <p>If you didn’t request a password reset, please ignore this email.</p>
              <p>Thank you,<br/>Gradia Team</p>
            </div>
          `,
        };

        // Mengirim email OTP ke user
        await transporter.sendMail(mailOptions);

        // Response sukses pengiriman OTP
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "OTP has been sent to your email.",
            otp_required: true,
          })
        );
      }

      // =======================
      // ACTION 2: CHANGE PASSWORD
      // =======================
      if (action === "change-password") {

        // Validasi email dan password baru
        if (!email || !new_password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              error: "New password are required.",
            })
          );
        }

        // Melakukan hashing password baru
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password user di tabel users
        const { error: updateError } = await supabase
          .from("users")                    // Tabel users
          .update({ password: hashedPassword }) // Update password
          .eq("email", email);              // Berdasarkan email

        // Jika update gagal
        if (updateError) throw updateError;

        // Response sukses reset password
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "Password has been reset successfully.",
            status: "success",
          })
        );
      }

      // Jika action tidak dikenali
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid action." }));
    } catch (err) {
      // Menampilkan error di server log
      console.error("RESET PASSWORD ERROR:", err);

      // Response error internal server
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
