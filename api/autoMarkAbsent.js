import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // Waktu WIB untuk mendapatkan jam & tanggal
    const wibString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const wib = new Date(wibString);

    // Hitung tanggal kemarin di WIB
    const yesterday = new Date(wib);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(`🕒 Checking auto absent at ${hour}:${minute} WIB`);
    console.log(`🚀 Running auto absent for YESTERDAY: ${yesterdayDate}`);

    // Ambil semua course
    const { data: courses, error: courseError } = await supabase
      .from("course")
      .select("id_courses, id_workspace, day");

    if (courseError) throw courseError;

    const dayNames = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];
    const yesterdayName = dayNames[yesterday.getDay()];

    console.log(`📅 Looking for courses on: ${yesterdayName}`);

    let totalAbsentAdded = 0;

    for (const course of courses) {
      // Filter course yang sesuai dengan hari kemarin
      if (course.day !== yesterdayName) continue;

      // Rentang waktu kemarin dalam UTC (00:00 - 23:59:59.999 WIB)
      const startUTC = new Date(`${yesterdayDate}T00:00:00+07:00`).toISOString();
      const endUTC = new Date(`${yesterdayDate}T23:59:59.999+07:00`).toISOString();

      // Cek apakah sudah ada presence untuk course ini di tanggal kemarin
      const { data: existing, error: presenceError } = await supabase
        .from("presence")
        .select("id_presence")
        .eq("id_course", course.id_courses)
        .gte("presences_at", startUTC)
        .lt("presences_at", endUTC);

      if (presenceError) throw presenceError;

      // Jika belum ada presence, buat absent
      if (!existing || existing.length === 0) {
        // Set waktu presence ke kemarin jam 23:59 WIB
        const absentTime = new Date(`${yesterdayDate}T23:59:00+07:00`).toISOString();
        const nowUTC = now.toISOString();

        const { error: insertError } = await supabase.from("presence").insert([
          {
            id_course: course.id_courses,
            id_workspace: course.id_workspace,
            status: "absent",
            note: "Auto marked absent by system",
            presences_at: absentTime,  // set ke kemarin 23:59 WIB
            created_at: nowUTC,        // waktu sistem membuat record
          },
        ]);

        if (insertError) throw insertError;
        totalAbsentAdded++;
        console.log(`  ✓ Added absent for course ${course.id_courses}`);
      }
    }

    console.log(`✅ Auto absent complete. Total records added: ${totalAbsentAdded}`);

    return res.status(200).json({
      message: "✅ Auto-mark absent complete",
      total_absent_added: totalAbsentAdded,
      checked_date: yesterdayDate,
      checked_day: yesterdayName,
    });
  } catch (error) {
    console.error("❌ Error in autoMarkAbsent:", error.message);
    return res.status(500).json({ error: error.message });
  }
}