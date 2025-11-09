import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
if (req.method === "GET") {
  const { data, error } = await supabase
    .from("task")
    .select(`
      *,
      course:id_course ( name )
    `)
    .order("deadline", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const formatted = data.map((task) => ({
    ...task,
    relatedCourse: task.course?.name || null,
  }));

  return res.status(200).json(formatted);
}

  if (req.method === "POST") {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
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
        res.end(
          JSON.stringify({ message: "Task berhasil ditambahkan!", data })
        );
      }
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gagal memproses data" }));
    }
  });

  return;
}

  if (req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const { id_task, id_course, title, description, deadline, status, priority } =
          JSON.parse(body);

        if (!id_task) {
          return res
            .status(400)
            .json({ error: "Parameter id_task wajib diisi untuk update." });
        }

        const updateData = { id_course, title, description, deadline, status, priority };

        const { data, error } = await supabase
          .from("task")
          .update(updateData)
          .eq("id_task", id_task)
          .select();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json({
          message: `Task dengan id_task ${id_task} berhasil diperbarui.`,
          data,
        });
      } catch (err) {
        return res.status(500).json({ error: "Gagal memproses data update." });
      }
    });
    return;
  }
  if (req.method === "DELETE") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");

    if (!id) {
      return res.status(400).json({
        error: "Parameter 'id' (id_task) diperlukan untuk menghapus task.",
      });
    }

    const { error } = await supabase.from("task").delete().eq("id_task", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ message: `Task dengan id_task ${id} berhasil dihapus.` });
  }

  res.status(405).json({ error: "Method not allowed " });
}
