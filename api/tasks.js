import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY  
);

export default async function handler(req, res) {

  if (req.method === "GET") {
    const { data, error } = await supabase.from("task").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

 if (req.method === "POST" && req.url === "/api/tasks") {
  let body = "";
  req.on("data", chunk => { body += chunk.toString(); });
  req.on("end", async () => {
    try {
      const task = JSON.parse(body);

      const { data, error } = await supabase
        .from("task") 
        .insert([task])
        .select();

      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      } else {
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Task berhasil ditambahkan!", data }));
      }
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gagal memproses data" }));
    }
  });
}
}