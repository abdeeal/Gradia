import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
<<<<<<< HEAD
  
    const now = new Date();
    const utcTime = now.getTime() + 7 * 60 * 60 * 1000; // UTC+7
    const wib = new Date(utcTime);
    const today = wib.toISOString().split("T")[0];

=======
    // ==== Waktu WIB (UTC+7) ====
    const now = new Date();
    const utcTime = now.getTime() + 7 * 60 * 60 * 1000; // UTC → WIB
    const wib = new Date(utcTime);

    const today = wib.toISOString().split("T")[0];
>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e
    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(`🕒 Checking auto overdue at ${hour}:${minute} WIB on ${today}`);

<<<<<<< HEAD
  
    if (hour !== 23 || minute !== 59) {
      return res.status(200).json({
        message: "⏳ Not yet time for auto-mark overdue (run only at 23:59 WIB)",
=======
    // ==== FIX: jangan terlalu ketat ====
    // Vercel Cron *sering telat beberapa detik atau menit*
    // Kita kasih range waktu aman: 23:55 → 23:59 WIB
    if (hour !== 23 || minute < 55) {
      return res.status(200).json({
        message:
          "⏳ Not yet time for auto-mark overdue (runs only between 23:55–23:59 WIB)",
>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e
        current_time: `${hour}:${minute}`,
        date: today,
      });
    }

<<<<<<< HEAD
    console.log(`🚀 Running auto overdue for date: ${today} (23:59 WIB)`);


    const { data: tasks, error: taskError } = await supabase
      .from("task")
      .select("id_task, id_workspace, title, deadline, status")
      .neq("status", "completed")
      .neq("status", "overdue");
=======
    console.log(`🚀 Running auto overdue for date: ${today} (23:55–23:59 WIB)`);

    // ==== Ambil task yang belum selesai ====
    const { data: tasks, error: taskError } = await supabase
      .from("task")
      .select("id_task, id_workspace, title, deadline, status")
      .neq("status", "Completed")
      .neq("status", "Overdue");
>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e

    if (taskError) throw taskError;

    let totalOverdueAdded = 0;

<<<<<<< HEAD
=======
    // ==== Loop update ====
>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e
    for (const task of tasks) {
      if (!task.deadline) continue;

      const taskDeadline = new Date(task.deadline);
<<<<<<< HEAD
=======

>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e
      if (wib > taskDeadline) {
        const { error: updateError } = await supabase
          .from("task")
          .update({
<<<<<<< HEAD
            status: "overdue",
=======
            status: "Overdue",
>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e
            note: "Auto marked overdue by system",
            updated_at: new Date().toISOString(),
          })
          .eq("id_task", task.id_task);

        if (updateError) throw updateError;
        totalOverdueAdded++;
      }
    }

<<<<<<< HEAD
    console.log(`✅ Auto overdue complete. Total tasks updated: ${totalOverdueAdded}`);

    return res.status(200).json({
      message: "✅ Auto-mark overdue complete at 23:59 WIB",
=======
    console.log(
      `✅ Auto overdue complete. Total tasks updated: ${totalOverdueAdded}`
    );

    return res.status(200).json({
      message: "✅ Auto-mark overdue complete",
>>>>>>> 77cb904eca230da3beea14297902cba5dac5ce6e
      total_overdue_added: totalOverdueAdded,
      date: today,
    });
  } catch (error) {
    console.error("❌ Error in autoMarkOverdue:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
