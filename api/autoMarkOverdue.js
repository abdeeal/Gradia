import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date();
    const utcTime = now.getTime() + 7 * 60 * 60 * 1000; 
    const wib = new Date(utcTime);
    const today = wib.toISOString().split("T")[0];

    console.log(`🕒 Running auto overdue for date: ${today} (WIB)`);

    const { data: tasks, error: taskError } = await supabase
      .from("task")
      .select("id_task, id_workspace, title, deadline, status")
      .neq("status", "completed")
      .neq("status", "overdue");

    if (taskError) throw taskError;

    let totalOverdueAdded = 0;

    for (const task of tasks) {
      if (!task.deadline) continue;

      const taskDeadline = new Date(task.deadline);

      if (wib > taskDeadline) {
        const { error: updateError } = await supabase
          .from("task")
          .update({
            status: "overdue",
            note: "Auto marked overdue by system",
            updated_at: new Date().toISOString(),
          })
          .eq("id_task", task.id_task);

        if (updateError) throw updateError;

        totalOverdueAdded++;
      }
    }

    console.log(`✅ Auto overdue complete. Total tasks updated: ${totalOverdueAdded}`);

    return res.status(200).json({
      message: "✅ Auto-mark overdue complete at 23:59 WIB",
      total_overdue_added: totalOverdueAdded,
      date: today,
    });
  } catch (error) {
    console.error("❌ Error in autoMarkOverdue:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
