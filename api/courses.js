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


}
