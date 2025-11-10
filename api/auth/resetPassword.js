import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const EMAIL_USER = "gradianoreplay@gmail.com";
const EMAIL_PASS = "wngp bsdw zexw qjub";

export default async function resetPassword(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { action, email, otp_code, new_password } = JSON.parse(body);

      if (!action) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Action is required." }));
      }

      // === ACTION 1: SEND OTP ===
      if (action === "send-otp") {
        if (!email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Email is required." }));
        }

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (userError) throw userError;
        if (!user) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Email not found." }));
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const { error: otpError } = await supabase.from("otp").insert([
          {
            id_user: user.id_user || user.id,
            otp_code: otpCode,
            expires_at: expiresAt,
            is_used: false,
            purpose: "reset-password",
          },
        ]);

        if (otpError) throw otpError;

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: `"Gradia App" <${EMAIL_USER}>`,
          to: email,
          subject: "Your Password Reset OTP Code",
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

        await transporter.sendMail(mailOptions);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "OTP has been sent to your email.",
            otp_required: true,
          })
        );
      }

      // === ACTION 2: CHANGE PASSWORD ===
      if (action === "change-password") {
        if (!email || !new_password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              error: "New password are required.",
            })
          );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        const { error: updateError } = await supabase
          .from("users")
          .update({ password: hashedPassword })
          .eq("email", email);

        if (updateError) throw updateError;

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "Password has been reset successfully.",
            status: "success",
          })
        );
      }

      // If action is unknown
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid action." }));
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
