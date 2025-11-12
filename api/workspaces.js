import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const workspace = JSON.parse(body);

      const { data, error } = await supabase
        .from("workspace")
        .insert([workspace])
        .select();

      res.writeHead(error ? 400 : 201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          error
            ? { error: error.message }
            : { message: "Workspace created successfully", data }
        )
      );
    });
    return;
  }

  if (req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id_user = url.searchParams.get("id_user");

    let query = supabase.from("workspace").select("*");

    if (id_user) {
      query = query.eq("id_user", id_user);
    }

    // urutkan berdasarkan waktu dibuat, paling lama -> terbaru
    query = query.order("created_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { id_workspace, ...updateFields } = JSON.parse(body);

      if (!id_workspace) {
        return res
          .status(400)
          .json({ error: "Parameter 'id_workspace' is required for update." });
      }

      const { data, error } = await supabase
        .from("workspace")
        .update(updateFields)
        .eq("id_workspace", id_workspace)
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({
        message: `Workspace with id ${id_workspace} has been successfully updated.`,
        data,
      });
    });
    return;
  }

  if (req.method === "DELETE") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { id_workspace } = JSON.parse(body);

      if (!id_workspace) {
        return res
          .status(400)
          .json({ error: "Parameter 'id_workspace' is required." });
      }

      const { error: courseError } = await supabase
        .from("course")
        .delete()
        .eq("id_workspace", id_workspace);

      if (courseError) {
        return res
          .status(500)
          .json({
            error: `Failed to delete related courses: ${courseError.message}`,
          });
      }

      const { error: workspaceError } = await supabase
        .from("workspace")
        .delete()
        .eq("id_workspace", id_workspace);

      if (workspaceError) {
        return res
          .status(500)
          .json({
            error: `Failed to delete workspace: ${workspaceError.message}`,
          });
      }

      res.status(200).json({
        message: `Workspace with id ${id_workspace} and its related courses have been deleted.`,
      });
    });

    return;
  }

  res.status(405).json({ error: "Method not allowed." });
}
