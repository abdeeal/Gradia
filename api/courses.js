import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY  
);

export default async function handler(req, res) {

  if (req.method === "GET") {
    const { data, error } = await supabase.from("course").select("*");

    if (error) {
      return res.status(500).json({ error: error.message })
    };
    console.log(typeof data);

    return res.status(200).json(data);
  }
   if (req.method === "POST" && req.url === "/api/courses") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", async () => {
      const course = JSON.parse(body);

      const { data, error } = await supabase
        .from("course")
        .insert([course])
        .select();

      res.writeHead(error ? 400 : 201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(error ? { error: error.message } : { message: "ok", data }));
    });
   }
  } 
