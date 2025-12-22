// Mengimpor library bcrypt untuk melakukan hashing dan verifikasi password
import bcrypt from "bcrypt";

// Mengimpor fungsi createClient dari Supabase
import { createClient } from "@supabase/supabase-js";

// Mengimpor nodemailer untuk mengirim email OTP
import nodemailer from "nodemailer";

// Membuat instance client Supabase menggunakan URL dan Anon Key dari environment
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,       // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY   // Public anon key Supabase
);

// Email pengirim OTP
const EMAIL_USER = "gradianoreplay@gmail.com";

// App password Gmail untuk SMTP
const EMAIL_PASS = "wngp bsdw zexw qjub";

// Fungsi handler utama API
export default async function handler(req, res) {

  // Validasi method HTTP harus POST
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Variabel untuk menampung body request
  let body = "";

  // Mengambil data body secara streaming
  req.on("data", (chunk) => (body += chunk.toString()));

  // Ketika body selesai diterima
  req.on("end", async () => {
    try {
      // Parsing body JSON
      const data = JSON.parse(body);

      // Mengambil parameter action
      const { action } = data;

      // Validasi action wajib ada
      if (!action) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Action is required." }));
      }

      // Switch berdasarkan jenis action
      switch (action) {

        // =====================================================
        // ======================= LOGIN ========================
        // =====================================================
        case "login": {

          // Mengambil input login (username/email & password)
          const { text, password } = data;

          // Validasi input wajib diisi
          if (!text || !password) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({ error: "Text and password are required." })
            );
          }

          // Mencari user berdasarkan email ATAU username
          const { data: users, error: userError } = await supabase
            .from("users")
            .select("*")
            .or(`email.eq.${text},username.eq.${text}`)
            .limit(1);

          // Jika error query
          if (userError) throw userError;

          // Ambil user pertama
          const user = users?.[0];

          // Jika user tidak ditemukan
          if (!user) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({ error: "Username or email not found." })
            );
          }

          // Verifikasi password menggunakan bcrypt
          const match = await bcrypt.compare(password, user.password);

          // Jika password salah
          if (!match) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Incorrect password." }));
          }

          // Jika akun belum diverifikasi
          if (!user.is_verified) {

            // Membuat kode OTP 6 digit
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Waktu kedaluwarsa OTP (5 menit)
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

            // Menyimpan OTP ke tabel otp
            const { error: otpError } = await supabase.from("otp").insert([
              {
                id_user: user.id_user,
                otp_code: otpCode,
                expires_at: expiresAt,
                is_used: false,
                purpose: "verification",
              },
            ]);

            // Jika gagal insert OTP
            if (otpError) throw otpError;

            // Konfigurasi SMTP Gmail
            const transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 465,
              secure: true,
              auth: { user: EMAIL_USER, pass: EMAIL_PASS },
              tls: { rejectUnauthorized: false },
            });

            // Template email OTP
            const mailOptions = {
              from: `"Gradia App" <${EMAIL_USER}>`,
              to: user.email,
              subject: "Your OTP Code - Verify Your Account",
              html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                  <h3>Hello ${user.username || user.email},</h3>
                  <p>Your OTP code is:</p>
                  <h2 style="letter-spacing: 4px; color: #007bff;">${otpCode}</h2>
                  <p>This code will expire at <b>${new Date(
                    expiresAt
                  ).toLocaleString()}</b>.</p>
                  <br/>
                  <p>Please use this code to verify your account.<br/>Thank you,<br/>The Gradia Team</p>
                </div>
              `,
            };

            // Mengirim email OTP
            await transporter.sendMail(mailOptions);

            // Response bahwa OTP diperlukan
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                message:
                  "Account not verified. OTP has been sent to your email address.",
                otp_required: true,
                user: {
                  id_user: user.id_user,
                  username: user.username,
                  email: user.email,
                },
                expires_at: expiresAt,
              })
            );
          }

          // Jika login sukses & sudah terverifikasi
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: "Login successful!",
              user: {
                id_user: user.id_user,
                username: user.username,
                email: user.email,
              },
              otp_required: false,
            })
          );
        }

        // =====================================================
        // ===================== REGISTER =======================
        // =====================================================
        case "register": {

          // Mengambil data registrasi
          const { username, email, password } = data;

          // Validasi field wajib
          if (!username || !email || !password) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                error: "Username, email, and password are required.",
              })
            );
          }

          // Normalisasi email ke huruf kecil
          const emailLower = email.trim().toLowerCase();

          // Cek apakah email sudah terdaftar
          const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("*")
            .eq("email", emailLower)
            .maybeSingle();

          if (checkError) throw checkError;

          // Jika user sudah ada
          if (existingUser) {

            // Jika sudah diverifikasi
            if (existingUser.is_verified) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(
                JSON.stringify({
                  error:
                    "This email is already registered. Please use another email.",
                })
              );
            }

            // Kirim ulang OTP verifikasi
            const { expiresAt } = await sendOtpInternal(
              emailLower,
              existingUser,
              "verification"
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                message:
                  "Account exists but not verified. A new verification OTP has been sent.",
                expires_at: expiresAt,
                purpose : "verification"
              })
            );
          }

          // Hash password sebelum disimpan
          const hashedPassword = await bcrypt.hash(password, 10);

          // Menyimpan user baru ke database
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert([
              {
                username,
                email: emailLower,
                password: hashedPassword,
                is_verified: false,
              },
            ])
            .select()
            .maybeSingle();

          if (insertError) throw insertError;

          // Kirim OTP registrasi
          const { expiresAt } = await sendOtpInternal(
            emailLower,
            newUser,
            "registration"
          );

          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message:
                "Registration successful. OTP has been sent for verification.",
              user: newUser,
              expires_at: expiresAt,
              purpose: "registration"
            })
          );
        }

        // =====================================================
        // ====================== LOGOUT ========================
        // =====================================================
        case "logout": {

          // Logout session Supabase
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true }));
        }

        // Jika action tidak dikenali
        default:
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid action." }));
      }
    } catch (err) {

      // Log error ke server
      console.error("AUTH ERROR:", err);

      // Response error ke client
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// =====================================================
// ================= INTERNAL HELPER ===================
// =====================================================

// Fungsi internal untuk mengirim OTP
async function sendOtpInternal(email, user, purpose) {

  // Generate OTP 6 digit
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Set waktu kedaluwarsa OTP
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Simpan OTP ke database
  const { error: otpError } = await supabase.from("otp").insert([
    {
      id_user: user.id_user || user.id,
      otp_code: otpCode,
      expires_at: expiresAt,
      is_used: false,
      purpose,
    },
  ]);

  if (otpError) throw otpError;

  // Konfigurasi transporter email
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  // Kirim email OTP
  await transporter.sendMail({
    from: `"Gradia App" <${EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Hello ${user.username || user.email},</h3>
        <p>Your OTP code is:</p>
        <h2 style="letter-spacing: 4px; color: #007bff;">${otpCode}</h2>
        <p>This code is valid until <b>${new Date(
          expiresAt
        ).toLocaleString()}</b>.</p>
        <p>Purpose: <b>${purpose}</b></p>
      </div>
    `,
  });

  // Mengembalikan waktu expired OTP
  return { expiresAt };
}
