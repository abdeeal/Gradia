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

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { email, purpose } = JSON.parse(body);

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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333; line-height: 1.6;">
      
      <div style="border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #007bff;">Gradia App</h2>
      </div>

      <p>Dear ${user.username || user.email},</p>

      <p>
        We have received a request regarding <strong>${purpose}</strong>.  
        To proceed, please use the One-Time Password (OTP) provided below:
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <div style="display: inline-block; padding: 15px 25px; background: #f4f7ff; border: 1px solid #dce6ff; border-radius: 8px;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #007bff;">
            ${otpCode}
          </span>
        </div>
      </div>

      <p>
        This OTP is valid until  
        <strong>${new Date(expiresAt).toLocaleString()}</strong>.
        Please do not share this code with anyone for security reasons.
      </p>

      <p style="margin-top: 25px;">
        Should you not request this action, you may safely ignore this email.
      </p>

      <br/>

      <p>
        Best regards,<br/>
        <strong>Gradia Team</strong>
      </p>

      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 12px; color: #777; text-align: center;">
        This is an automated message. Please do not reply to this email.
      </p>
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
  });
}
