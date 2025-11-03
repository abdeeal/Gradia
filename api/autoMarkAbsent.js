import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Ambil semua workspace
    const { data: workspaces, error: workspaceError } = await supabase
      .from("workspace")
      .select("id_workspace");

    if (workspaceError) throw workspaceError;

    const today = new Date().toISOString().split("T")[0];

    for (const ws of workspaces) {
      // Cari user di workspace tsb yang belum punya presensi hari ini
      const { data: users, error: userError } = await supabase
        .from("user_workspace")
        .select("id_user")
        .eq("id_workspace", ws.id_workspace);

      if (userError) throw userError;

      for (const u of users) {
        const { data: existing, error: presenceError } = await supabase
          .from("presence")
          .select("*")
          .eq("id_workspace", ws.id_workspace)
          .eq("id_user", u.id_user)
          .gte("presences_at", `${today}T00:00:00`)
          .lte("presences_at", `${today}T12:15:59`);

        if (presenceError) throw presenceError;

        if (existing.length === 0) {
          // Insert otomatis status "absent"
          await supabase.from("presence").insert([
            {
              id_workspace: ws.id_workspace,
              id_user: u.id_user,
              status: "absent",
              note: "Auto marked absent by system",
            },
          ]);
        }
      }
    }

    res.status(200).json({ message: "Auto absent done" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
