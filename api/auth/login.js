import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// --- konfigurasi email ---
const EMAIL_USER = "gradianoreplay@gmail.com";
const EMAIL_PASS = "wngp bsdw zexw qjub";

export default async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { text, password } = JSON.parse(body);

      if (!text || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Text and password are required." })
        );
      }

      // cari user by email atau username
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${text},username.eq.${text}`)
        .limit(1);

      if (userError) throw userError;

      const user = users?.[0];
      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Username or email not found." })
        );
      }

      // cek password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Incorrect password." }));
      }

      // jika belum terverifikasi -> buat OTP baru dan kirim email
      if (!user.is_verified) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const { error: otpError } = await supabase.from("otp").insert([
          {
            id_user: user.id_user,
            otp_code: otpCode,
            expires_at: expiresAt,
            is_used: false,
            purpose: "verification",
          },
        ]);

        if (otpError) throw otpError;

        // --- kirim email OTP ---
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: EMAIL_USER, pass: EMAIL_PASS },
          tls: { rejectUnauthorized: false },
        });

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

        await transporter.sendMail(mailOptions);

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

      // jika sudah terverifikasi -> login sukses
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
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
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
