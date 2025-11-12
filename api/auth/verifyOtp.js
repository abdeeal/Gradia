import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function verifyResetOtp(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { email, otp_code } = JSON.parse(body);

      if (!email || !otp_code) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Email and OTP code are required." }));
      }

    
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id_user, email")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (userError) throw userError;
      if (!user)
        return res
          .writeHead(404, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "User not found." }));

      
      const { data: otp, error: otpError } = await supabase
        .from("otp")
        .select("*")
        .eq("id_user", user.id_user)
        .eq("otp_code", otp_code.toString().trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError) throw otpError;
      if (!otp)
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Invalid OTP code." }));

      
      if (new Date() > new Date(otp.expires_at)) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "OTP code has expired." }));
      }

      if (otp.is_used) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "OTP code has already been expired." }));
      }

     
      await supabase
        .from("otp")
        .update({
          is_used: true,
         
          used_at: new Date().toISOString(),
        })
        .eq("id_otp", otp.id_otp);

    
      if (otp.purpose === "reset-password") {
        await supabase
          .from("users")
          .update({ reset_verified: true })
          .eq("id_user", user.id_user);

        return res
          .writeHead(200, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              message: "Password reset OTP successfully verified.",
              otp_verified: true,
              redirect: "/new-password",
            })
          );
      }

      if (otp.purpose === "registration" || otp.purpose === "verification") {
        await supabase
          .from("users")
          .update({ is_verified: true })
          .eq("id_user", user.id_user);

        return res
          .writeHead(200, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              message: "Registration verification successful.",
              otp_verified: true,
            })
          );
      }

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unknown OTP purpose." }));
    } catch (err) {
      console.error("VERIFY RESET OTP ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
