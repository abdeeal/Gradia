import http from "http";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/auth/sendotp") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", async () => {
      try {
        const { userId, otp_code } = JSON.parse(body);

        const { error } = await supabase.from("otp").insert([
          {
            id_user: userId,
            otp_code,
            expires_at: new Date(Date.now() + 5 * 60 * 1000)
          }
        ]);

        if (error) throw error;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "OTP terkirim" }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
