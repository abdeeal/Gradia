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
            error: "Username, email, dan password wajib diisi.",
          })
        );
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Email sudah terdaftar." }));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from("users")
        .insert([{ username, email, password: hashedPassword }])
        .select();

      if (error) throw error;

      
      const userBaru = data[0];

      
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

      if (otpError) {
        console.error("OTP ERROR:", otpError);
        throw otpError;
      }

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Registrasi berhasil! OTP dibuat.",
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
