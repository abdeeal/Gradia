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

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (checkError) throw checkError;

      let userBaru;

      if (existingUser) {
        console.log("User already exists, updating verification status...");

        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email)
          .select();

        if (updateError) throw updateError;

        userBaru = updatedUser[0];
      } else {
        console.log("New user, creating account...");

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
          .from("users")
          .insert([
            {
              username,
              email,
              password: hashedPassword,
              is_verified: false,
            },
          ])
          .select();

        if (error) throw error;

        userBaru = data[0];
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { data: otpData, error: otpError } = await supabase
        .from("otp")
        .insert([
          {
            id_user: userBaru.id_user || userBaru.id,
            otp_code: otpCode,
            expires_at: expiresAt,
            is_used: false,
            purpose: "register",
          },
        ])
        .select();

      if (otpError) throw otpError;

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: existingUser
            ? "Email already registered. Verification status updated and a new OTP has been sent."
            : "Registration successful! OTP has been created.",
          user: userBaru,
          otp: otpCode, 
        })
      );
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
