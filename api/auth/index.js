import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const EMAIL_USER = "gradianoreplay@gmail.com";
const EMAIL_PASS = "wngp bsdw zexw qjub";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const data = JSON.parse(body);
      const { action } = data;

      if (!action) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Action is required." }));
      }

      switch (action) {
        // =====================================================
        // ======================= LOGIN ========================
        // =====================================================
        case "login": {
          const { text, password } = data;

          if (!text || !password) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({ error: "Text and password are required." })
            );
          }

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

          const match = await bcrypt.compare(password, user.password);
          if (!match) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Incorrect password." }));
          }

          // belum verifikasi → kirim OTP
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

          // sukses login
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
          const { username, email, password } = data;

          if (!username || !email || !password) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                error: "Username, email, and password are required.",
              })
            );
          }

          const emailLower = email.trim().toLowerCase();

          const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("*")
            .eq("email", emailLower)
            .maybeSingle();

          if (checkError) throw checkError;

          if (existingUser) {
            if (existingUser.is_verified) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(
                JSON.stringify({
                  error:
                    "This email is already registered. Please use another email.",
                })
              );
            }

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
              })
            );
          }

          const hashedPassword = await bcrypt.hash(password, 10);

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
            })
          );
        }

        // =====================================================
        // ====================== LOGOUT ========================
        // =====================================================
        case "logout": {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true }));
        }

        default:
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid action." }));
      }
    } catch (err) {
      console.error("AUTH ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// =====================================================
// ================= INTERNAL HELPER ===================
// =====================================================
async function sendOtpInternal(email, user, purpose) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

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

  return { expiresAt };
}
