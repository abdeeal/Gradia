// Import Supabase client untuk koneksi ke database
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,        // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY    // Public anon key Supabase
);

// Fungsi handler utama (API / cron job auto absent)
export default async function handler(req, res) {
  try {
    // Ambil waktu sekarang (UTC server)
    const now = new Date();

    // Konversi waktu ke WIB (Asia/Jakarta) dalam bentuk string
    const wibString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });

    // Ubah string WIB menjadi objek Date
    const wib = new Date(wibString);

    // Hitung tanggal kemarin berdasarkan WIB
    const yesterday = new Date(wib);
    yesterday.setDate(yesterday.getDate() - 1);

    // Ambil format tanggal kemarin (YYYY-MM-DD)
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    // Ambil jam WIB saat ini
    const hour = wib.getHours();

    // Ambil menit WIB saat ini
    const minute = wib.getMinutes();

    // Log waktu pengecekan auto absent
    console.log(`🕒 Checking auto absent at ${hour}:${minute} WIB`);

    // Log tanggal yang sedang diproses (kemarin)
    console.log(`🚀 Running auto absent for YESTERDAY: ${yesterdayDate}`);

    // Ambil semua data course dari database
    const { data: courses, error: courseError } = await supabase
      .from("course")                               // Tabel course
      .select("id_courses, id_workspace, day");     // Kolom yang diperlukan

    // Jika query course gagal
    if (courseError) throw courseError;

    // Array nama hari dalam bahasa Inggris
    const dayNames = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];

    // Ambil nama hari untuk tanggal kemarin
    const yesterdayName = dayNames[yesterday.getDay()];

    // Log hari yang sedang dicek
    console.log(`📅 Looking for courses on: ${yesterdayName}`);

    // Counter jumlah absent yang ditambahkan
    let totalAbsentAdded = 0;

    // Loop setiap course
    for (const course of courses) {

      // Lewati course jika harinya tidak sama dengan hari kemarin
      if (course.day !== yesterdayName) continue;

      // Tentukan batas awal waktu kemarin (00:00 WIB) dalam UTC
      const startUTC = new Date(`${yesterdayDate}T00:00:00+07:00`).toISOString();

      // Tentukan batas akhir waktu kemarin (23:59:59.999 WIB) dalam UTC
      const endUTC = new Date(`${yesterdayDate}T23:59:59.999+07:00`).toISOString();

      // Cek apakah sudah ada data presence untuk course ini di tanggal kemarin
      const { data: existing, error: presenceError } = await supabase
        .from("presence")                            // Tabel presence
        .select("id_presence")                       // Ambil ID saja
        .eq("id_course", course.id_courses)          // Filter course
        .gte("presences_at", startUTC)               // Mulai dari awal hari
        .lt("presences_at", endUTC);                 // Sampai akhir hari

      // Jika query presence gagal
      if (presenceError) throw presenceError;

      // Jika belum ada presence sama sekali
      if (!existing || existing.length === 0) {

        // Set waktu absent ke kemarin pukul 23:59 WIB
        const absentTime = new Date(`${yesterdayDate}T23:59:00+07:00`).toISOString();

        // Ambil waktu UTC sekarang untuk created_at
        const nowUTC = now.toISOString();

        // Insert data absent otomatis ke tabel presence
        const { error: insertError } = await supabase.from("presence").insert([
          {
            id_course: course.id_courses,            // ID course
            id_workspace: course.id_workspace,       // ID workspace
            status: "absent",                        // Status kehadiran
            note: "Auto marked absent by system",    // Catatan sistem
            presences_at: absentTime,                // Waktu kemarin 23:59 WIB
            created_at: nowUTC,                      // Waktu record dibuat
          },
        ]);

        // Jika insert gagal
        if (insertError) throw insertError;

        // Tambah counter absent
        totalAbsentAdded++;

        // Log course yang berhasil ditambahkan absent
        console.log(`  ✓ Added absent for course ${course.id_courses}`);
      }
    }

    // Log proses auto absent selesai
    console.log(`✅ Auto absent complete. Total records added: ${totalAbsentAdded}`);

    // Kirim response sukses ke client
    return res.status(200).json({
      message: "✅ Auto-mark absent complete",        // Pesan sukses
      total_absent_added: totalAbsentAdded,           // Total absent dibuat
      checked_date: yesterdayDate,                    // Tanggal yang dicek
      checked_day: yesterdayName,                     // Hari yang dicek
    });

  } catch (error) {
    // Log error ke server
    console.error("❌ Error in autoMarkAbsent:", error.message);

    // Kirim response error ke client
    return res.status(500).json({ error: error.message });
  }
}
