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
      const { email } = JSON.parse(body);

      if (!email) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Email is required." }));
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (userError) throw userError;
      if (!user) {
        return res
          .writeHead(404, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Email not found." }));
      }

      
      const { data: otpData, error: otpError } = await supabase
        .from("otp")
        .select("otp_code, expires_at")
        .eq("id_user", user.id_user || user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError) throw otpError;

      let otpCode;
      let expiresAt;
      const now = new Date();

      if (!otpData || new Date(otpData.expires_at) < now) {
      
        otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); 

        
        const { error: insertError } = await supabase.from("otp").insert([
          {
            id_user: user.id_user || user.id,
            otp_code: otpCode,
            purpose: "register", 
            is_used: false,
            expires_at: expiresAt,
          },
        ]);
        if (insertError) throw insertError;
      } else {
       
        otpCode = otpData.otp_code;
        expiresAt = otpData.expires_at;
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: `"Gradia App" <${EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code",
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h3>Hello ${user.username || user.email},</h3>
            <p>Your OTP code is:</p>
            <h2 style="letter-spacing: 4px; color: #007bff;">${otpCode}</h2>
            <p>This code is valid until <b>${new Date(expiresAt).toLocaleString()}</b>.</p>
            <br/>
            <p>Thank you,<br/>The Gradia Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `OTP successfully sent to ${email}`,
          otp_code: otpCode,
        })
      );
    } catch (err) {
      console.error("SEND OTP ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
