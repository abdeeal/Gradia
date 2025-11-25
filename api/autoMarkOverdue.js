import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // Waktu lokal WIB (hanya untuk jam & tanggal, bukan untuk perbandingan deadline)
    const wibString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const wib = new Date(wibString);

    const today = wib.toISOString().split("T")[0];
    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(`🕒 Checking auto overdue at ${hour}:${minute} WIB on ${today}`);

    if (hour !== 23 || minute < 55) {
      return res.status(200).json({
        message:
          "⏳ Not yet time for auto-mark overdue (runs only between 23:55–23:59 WIB)",
        current_time: `${hour}:${minute}`,
        date: today,
      });
    }

    console.log(`🚀 Running auto overdue for date: ${today} (23:55–23:59 WIB)`);

    const nowISO = now.toISOString();

    const { data, error } = await supabase
      .from("task")
      .update({
        status: "Overdue",
        note: "Auto marked overdue by system",
        updated_at: nowISO,
      })
      .lte("deadline", nowISO)
      .neq("status", "Completed")
      .neq("status", "Overdue")
      .select("id_task");

    if (error) throw error;

    const totalOverdueAdded = data?.length || 0;

    console.log(
      `✅ Auto overdue complete. Total tasks updated: ${totalOverdueAdded}`
    );

    return res.status(200).json({
      message: "✅ Auto-mark overdue complete",
      total_overdue_added: totalOverdueAdded,
      date: today,
    });
  } catch (error) {
    console.error("❌ Error in autoMarkOverdue:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
  