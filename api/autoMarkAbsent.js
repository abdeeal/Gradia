import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // Waktu WIB hanya untuk jam & tanggal
    const wibString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const wib = new Date(wibString);

    const today = wib.toISOString().split("T")[0];
    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(`🕒 Checking auto absent at ${hour}:${minute} WIB on ${today}`);


    console.log(`🚀 Running auto absent for date: ${today} (23:59 WIB)`);

    // Ambil semua course
    const { data: courses, error: courseError } = await supabase
      .from("course")
      .select("id_courses, id_workspace, day");

    if (courseError) throw courseError;

    const dayNames = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];
    const todayName = dayNames[wib.getDay()];

    let totalAbsentAdded = 0;

    for (const course of courses) {
      if (course.day !== todayName) continue;

      // Rentang WIB dalam UTC
      const startUTC = new Date(`${today}T00:00:00+07:00`).toISOString();
      const endUTC = new Date(`${today}T23:59:59.999+07:00`).toISOString();

      const { data: existing, error: presenceError } = await supabase
        .from("presence")
        .select("id_presence")
        .eq("id_course", course.id_courses)
        .gte("presences_at", startUTC)
        .lt("presences_at", endUTC);

      if (presenceError) throw presenceError;

      if (!existing || existing.length === 0) {
        const nowUTC = now.toISOString();

        const { error: insertError } = await supabase.from("presence").insert([
          {
            id_course: course.id_courses,
            id_workspace: course.id_workspace,
            status: "absent",
            note: "Auto marked absent by system",
            presences_at: nowUTC,   // simpan dalam UTC
            created_at: nowUTC,
          },
        ]);

        if (insertError) throw insertError;
        totalAbsentAdded++;
      }
    }

    console.log(`✅ Auto absent complete. Total records added: ${totalAbsentAdded}`);

    return res.status(200).json({
      message: "✅ Auto-mark absent complete",
      total_absent_added: totalAbsentAdded,
      date: today,
    });
  } catch (error) {
    console.error("❌ Error in autoMarkAbsent:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
