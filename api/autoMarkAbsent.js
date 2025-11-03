import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date();
    const utcTime = now.getTime() + 7 * 60 * 60 * 1000; // UTC+7
    const wib = new Date(utcTime);
    const today = wib.toISOString().split("T")[0];

    console.log(`🕒 Running auto absent for date: ${today} (WIB)`);

    // Ambil semua course
    const { data: courses, error: courseError } = await supabase
      .from("course")
      .select("id_courses, id_workspace, day");

    if (courseError) throw courseError;

    let totalAbsentAdded = 0;

    for (const course of courses) {
      // Cek apakah course-nya hari ini
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = dayNames[wib.getDay()];

      if (course.day !== todayName) continue; // skip kalau bukan jadwal hari ini

      // Cek apakah sudah ada presence untuk course ini hari ini
      const { data: existing, error: presenceError } = await supabase
        .from("presence")
        .select("id_presence")
        .eq("id_course", course.id_courses)
        .gte("presences_at", `${today}T00:00:00.000Z`)
        .lt("presences_at", `${today}T23:59:59.999Z`);

      if (presenceError) throw presenceError;

      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase.from("presence").insert([
          {
            id_course: course.id_courses,
            id_workspace: course.id_workspace,
            status: "absent",
            note: "Auto marked absent by system",
            presences_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) throw insertError;
        totalAbsentAdded++;
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
