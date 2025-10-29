import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const method = req.method;


  if (method === "GET") {
    const { data, error } = await supabase.from("presence").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  
  if (method === "POST") {
    try {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        const { id_course, status, note } = JSON.parse(body);

        if (!id_course || !status) {
          return res
            .status(400)
            .json({ error: "id_course dan status wajib diisi" });
        }

        const { data, error } = await supabase
          .from("presence")
          .insert([
            {
              id_course,
              status,
              note,
            },
          ])
          .select();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        res
          .status(201)
          .json({ message: "Presence berhasil ditambahkan", data });
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
 else if (method === "PUT") {
    try {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));

      req.on("end", async () => {
        const { id_presence, id_course, status, note } = JSON.parse(body);

        if (!id_presence) {
          return res
            .status(400)
            .json({ error: "id_presence wajib diisi untuk update" });
        }

        const { data, error } = await supabase
          .from("presence")
          .update({
            id_course,
            status,
            note,
          })
          .eq("id_presence", id_presence)
          .select();

        if (error) return res.status(400).json({ error: error.message });

        return res
          .status(200)
          .json({ message: "Presence berhasil diperbarui", data });
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
 
  else if (method === "DELETE") {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Parameter id wajib diisi" });
    }

    const { error } = await supabase
      .from("presence")
      .delete()
      .eq("id_presence", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ message: `Presence dengan id ${id} berhasil dihapus` });
  }

  else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
