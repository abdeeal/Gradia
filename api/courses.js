import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
 
  if (req.method === "POST" && req.url === "/api/auth/otp") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { id_user, otp_code, expires_at } = JSON.parse(body);

        if (!id_user || !otp_code || !expires_at) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              error: "Field 'id_user', 'otp_code', dan 'expires_at' wajib diisi.",
            })
          );
        }

    
        const { data, error } = await supabase
          .from("otp")
          .insert([{ id_user, otp_code, expires_at }])
          .select();

        if (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: error.message }));
        }

      
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "OTP berhasil dikirim dan disimpan.",
            data,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint tidak ditemukan." }));
  }
}
