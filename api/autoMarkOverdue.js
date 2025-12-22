// Import Supabase client untuk koneksi ke database
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,        // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY    // Public anon key Supabase
);

// Fungsi handler utama (API / cron job auto mark overdue)
export default async function handler(req, res) {
  try {
    // Ambil waktu sekarang dalam UTC
    const nowUTC = new Date();
    
    // Konversi waktu UTC ke WIB (Asia/Jakarta) untuk keperluan logging
    const wibString = nowUTC.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    
    // Ubah string WIB menjadi objek Date
    const wib = new Date(wibString);

    // Hitung waktu akhir hari kemarin berdasarkan WIB (23:59:59.999)
    const yesterday = new Date(wib);
    yesterday.setDate(yesterday.getDate() - 1); // Mundur satu hari
    yesterday.setHours(23, 59, 59, 999);        // Set ke akhir hari
    
    // Ambil tanggal kemarin dalam format YYYY-MM-DD
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    // Ambil jam WIB saat ini
    const hour = wib.getHours();

    // Ambil menit WIB saat ini
    const minute = wib.getMinutes();

    // Log waktu cron dijalankan
    console.log(`🚀 Cron triggered at ${hour}:${minute} WIB`);

    // Log batas deadline yang akan dicek
    console.log(`📅 Checking tasks with deadline <= ${yesterdayDate} 23:59:59 WIB`);

    // Konversi akhir hari kemarin WIB ke UTC untuk kebutuhan query database
    const endOfYesterdayUTC = new Date(
      yesterday.getTime() - (7 * 60 * 60 * 1000) // Kurangi offset WIB (+7)
    ).toISOString();

    // Log query deadline dalam format UTC
    console.log(`🔍 Query deadline <= ${endOfYesterdayUTC}`);

    // Update task yang deadline-nya sudah lewat dan belum selesai
    const { data, error } = await supabase
      .from("task")                               // Tabel task
      .update({
        status: "Overdue",                        // Set status menjadi Overdue
      })
      .lte("deadline", endOfYesterdayUTC)         // Deadline <= akhir hari kemarin
      .neq("status", "Completed")                 // Kecuali yang sudah selesai
      .neq("status", "Overdue")                   // Kecuali yang sudah overdue
      .select("id_task, deadline");               // Ambil data task yang diupdate

    // Jika terjadi error pada query
    if (error) throw error;

    // Hitung jumlah task yang diupdate
    const total = data?.length || 0;

    // Jika ada task yang diupdate
    if (total > 0) {
      console.log(`✅ Overdue updated: ${total} tasks`);
      
      // Log detail setiap task yang diupdate
      data.forEach((task, i) => {
        console.log(`  ${i + 1}. Task ${task.id_task} - deadline: ${task.deadline}`);
      });
    } else {
      // Jika tidak ada task yang perlu diupdate
      console.log(`ℹ️ No tasks to mark as overdue`);
    }

    // Kirim response sukses ke client
    return res.status(200).json({
      message: "Auto overdue executed successfully", // Pesan sukses
      total_updated: total,                          // Total task diupdate
      checked_until: yesterdayDate,                  // Batas tanggal pengecekan
      time: `${hour}:${minute} WIB`,                 // Waktu eksekusi
      tasks: data || [],                             // Data task yang diupdate
    });

  } catch (error) {
    // Log error ke server
    console.error("❌ Error in autoMarkOverdue:", error);

    // Kirim response error ke client
    return res.status(500).json({ error: error.message });
  }
}
