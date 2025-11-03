import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {  
    // Dapatkan tanggal hari ini (WIB)
    const now = new Date();
    const utcTime = now.getTime() + 7 * 60 * 60 * 1000; // UTC+7
    const wib = new Date(utcTime);
    const today = wib.toISOString().split("T")[0];

    console.log(`🕒 Running auto absent for date: ${today} (WIB)`);

    // Ambil semua workspace
    const { data: workspaces, error: workspaceError } = await supabase
      .from("workspace")
      .select("id_workspace");

    if (workspaceError) throw workspaceError;

    let totalAbsentAdded = 0;

    // Loop setiap workspace
    for (const ws of workspaces) {
      // Ambil user dalam workspace
      const { data: users, error: userError } = await supabase
        .from("user_workspace")
        .select("id_user")
        .eq("id_workspace", ws.id_workspace);

      if (userError) throw userError;

      for (const u of users) {
        // Cek apakah user sudah absen hari ini
        const { data: existing, error: presenceError } = await supabase
          .from("presence")
          .select("id_presence")
          .eq("id_workspace", ws.id_workspace)
          .eq("id_user", u.id_user)
          .gte("presences_at", `${today}T00:00:00`)
          .lte("presences_at", `${today}T23:59:59`);

        if (presenceError) throw presenceError;

        // Jika belum absen, tambahkan status absent otomatis
        if (!existing || existing.length === 0) {
          const { error: insertError } = await supabase.from("presence").insert([
            {
              id_workspace: ws.id_workspace,
              id_user: u.id_user,
              status: "absent",
              note: "Auto marked absent by system",
              presences_at: new Date().toISOString(),
            },
          ]);

          if (insertError) throw insertError;
          totalAbsentAdded++;
        }
      }
    }

    console.log(`✅ Auto absent complete. Total records added: ${totalAbsentAdded}`);

    return res.status(200).json({
      message: "✅ Auto-mark absent complete at 13:15 WIB",
      total_absent_added: totalAbsentAdded,
      date: today,
    });
  } catch (error) {
    console.error("❌ Error in autoMarkAbsent:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
