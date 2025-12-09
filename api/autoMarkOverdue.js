import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const nowUTC = new Date();
    
    // Waktu WIB untuk logging
    const wibString = nowUTC.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const wib = new Date(wibString);

    // Hitung akhir hari kemarin di WIB (23:59:59.999)
    const yesterday = new Date(wib);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const yesterdayDate = yesterday.toISOString().split("T")[0];
    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(`🚀 Cron triggered at ${hour}:${minute} WIB`);
    console.log(`📅 Checking tasks with deadline <= ${yesterdayDate} 23:59:59 WIB`);

    // Convert akhir hari kemarin WIB ke UTC untuk query
    const endOfYesterdayUTC = new Date(yesterday.getTime() - (7 * 60 * 60 * 1000)).toISOString();

    console.log(`🔍 Query deadline <= ${endOfYesterdayUTC}`);

    // Update task yang deadline-nya <= akhir hari kemarin
    const { data, error } = await supabase
      .from("task")
      .update({
        status: "Overdue",
      })
      .lte("deadline", endOfYesterdayUTC)
      .neq("status", "Completed")
      .neq("status", "Overdue")
      .select("id_task, deadline");

    if (error) throw error;

    const total = data?.length || 0;

    if (total > 0) {
      console.log(`✅ Overdue updated: ${total} tasks`);
      data.forEach((task, i) => {
        console.log(`  ${i + 1}. Task ${task.id_task} - deadline: ${task.deadline}`);
      });
    } else {
      console.log(`ℹ️ No tasks to mark as overdue`);
    }

    return res.status(200).json({
      message: "Auto overdue executed successfully",
      total_updated: total,
      checked_until: yesterdayDate,
      time: `${hour}:${minute} WIB`,
      tasks: data || [],
    });

  } catch (error) {
    console.error("❌ Error in autoMarkOverdue:", error);
    return res.status(500).json({ error: error.message });
  }
}