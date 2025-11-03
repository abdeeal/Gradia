import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      const { id_courses, ...updateFields } = JSON.parse(body);

      if (!id_courses) {
        return res
          .status(400)
          .json({ error: "Parameter 'id_courses' wajib diisi untuk update." });
      }

      const { data, error } = await supabase
        .from("course")
        .update(updateFields)
        .eq("id_courses", id_courses)
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res
        .status(200)
        .json({
          message: `Course dengan id ${id_courses} berhasil diperbarui.`,
          data,
        });
    });
    return;
  }
  if (req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get("q");

    if (q === "today") {
      const today = new Date().toLocaleString("en-US", { weekday: "long" });
      const { data, error } = await supabase
        .from("course")
        .select("*")
        .eq("day", today);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    const { data, error } = await supabase.from("course").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      const course = JSON.parse(body);

      const { data, error } = await supabase
        .from("course")
        .insert([course])
        .select();

      res.writeHead(error ? 400 : 201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          error ? { error: error.message } : { message: "ok", data }
        )
      );
    });
  }
  if (req.method === "DELETE") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");

    if (!id) {
      return res.status(400).json({ error: "Parameter 'id' diperlukan." });
    }

    const { error } = await supabase
      .from("course")
      .delete()
      .eq("id_courses", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ message: `Course dengan id ${id} berhasil dihapus.` });
  }
}