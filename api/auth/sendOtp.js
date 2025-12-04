import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const EMAIL_USER = "gradianoreplay@gmail.com";
const EMAIL_PASS = "wngp bsdw zexw qjub";

export default async function sendOtp(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    const { email, purpose } = req.body; 

    // 🔹 Validasi input
    if (!email || !purpose) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ error: "Email and purpose are required." })
      );
    }

    // 🔹 Cari user berdasarkan email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Email not found." }));
    }

    const now = new Date();

    // 🔹 Cek OTP lama milik user
    const { data: oldOtp, error: otpError } = await supabase
      .from("otp")
      .select("*")
      .eq("id_user", user.id_user || user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) throw otpError;

    // 🔹 Kalau OTP lama masih berlaku, tandai is_used = true
    if (oldOtp && new Date(oldOtp.expires_at) > now) {
      await supabase
        .from("otp")
        .update({ is_used: true })
        .eq("id_otp", oldOtp.id_otp);
    }

    // 🔹 Buat OTP baru
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 menit

    const { error: insertError } = await supabase.from("otp").insert([
      {
        id_user: user.id_user || user.id,
        otp_code: otpCode,
        purpose,
        is_used: false,
        expires_at: expiresAt,
      },
    ]);
    if (insertError) throw insertError;

    // 🔹 Siapkan transporter email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    // 🔹 Format email OTP
    const mailOptions = {
      from: `"Gradia App" <${EMAIL_USER}>`,
      to: email,
      subject: `Your OTP Code for ${purpose}`,
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

    await transporter.sendMail(mailOptions);

    // 🔹 Kirim respons sukses
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: `OTP successfully sent to ${email}`,
        otp_code: otpCode,
        expires_at: expiresAt,
      })
    );
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
