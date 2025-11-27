import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);


export default async function handler(req, res) {
  try {
    // Waktu WIB
    const nowUTC = new Date();
    const wibString = nowUTC.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const wib = new Date(wibString);

    const today = wib.toISOString().split("T")[0];
    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(`🚀 Cron triggered at ${hour}:${minute} WIB (${today})`);


    // Gunakan ISO WIB
    const nowWIB_ISO = new Date(
      wib.getTime() - wib.getTimezoneOffset() * 60000
    ).toISOString();

    const { data, error } = await supabase
      .from("task")
      .update({
        status: "Overdue",
      })
      .lte("deadline", nowWIB_ISO)
      .neq("status", "Completed")
      .neq("status", "Overdue")
      .select("id_task");

    if (error) throw error;

    const total = data?.length || 0;

    console.log(`✅ Overdue updated: ${total} tasks`);

    return res.status(200).json({
      message: "Auto overdue executed successfully",
      total_updated: total,
      time: `${hour}:${minute} WIB`,
      date: today,
    });

  } catch (error) {
    console.error("❌ Error in autoMarkOverdue:", error);
    return res.status(500).json({ error: error.message });
  }
}
