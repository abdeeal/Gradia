import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handleRegister(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { username, email, password } = JSON.parse(body);

      if (!username || !email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            error: "Username, email, and password are required.",
          })
        );
      }

      const emailLower = email.trim().toLowerCase();

      // Cek apakah email sudah ada
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("email", emailLower)
        .maybeSingle();

      if (checkError) throw checkError;

      // --- Jika user sudah ada
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

        // Jika belum diverifikasi, kirim OTP purpose: verification
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

      // --- Jika email belum ada, buat akun baru
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

      // Kirim OTP purpose: registration
      const { expiresAt } = await sendOtpInternal(
        emailLower,
        newUser,
        "registration"
      );

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message:
            "Registration successful. OTP has been sent for verification.",
          user: newUser,
          expires_at: expiresAt,
        })
      );
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// fungsi internal kirim OTP
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

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "gradianoreplay@gmail.com",
      pass: "wngp bsdw zexw qjub",
    },
  });

  await transporter.sendMail({
    from: `"Gradia App" <gradianoreplay@gmail.com>`,
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
