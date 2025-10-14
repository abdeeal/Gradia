import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY  
);
export default async function handler(req, res) {

  // === GET all presences ===
  if (req.method === "GET") {
    const { data, error } = await supabase.from("presence").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

 if (req.method === "POST" && req.url === "/api/presence") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", async () => {
      const presence = JSON.parse(body);

      const { data, error } = await supabase
        .from("presence")
        .insert([presence])
        .select();

      res.writeHead(error ? 400 : 201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          error ? { error: error.message } : { message: "ok", data }
        )
      );
    });
  }
}
