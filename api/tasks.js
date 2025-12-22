// Import Supabase client untuk koneksi ke database
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,        // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY    // Public anon key Supabase
);

// Handler API utama untuk CRUD task
export default async function handler(req, res) {

  // =========================
  // METHOD GET → READ TASK
  // =========================
  if (req.method === "GET") {

    // Parsing URL request
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Ambil parameter idWorkspace dari query string
    const idWorkspace = url.searchParams.get("idWorkspace");

    // Validasi idWorkspace wajib ada
    if (!idWorkspace) {
      return res
        .status(400)
        .json({ error: "Parameter 'idWorkspace' diperlukan." });
    }

    // Ambil data task beserta relasi course
    const { data, error } = await supabase
      .from("task")                               // Tabel task
      .select(
        `
      *,
      course:id_course (                         // Relasi ke tabel course
        name,
        id_workspace
      )
    `
      )
      .eq("id_workspace", idWorkspace)            // Filter berdasarkan workspace
      .order("deadline", { ascending: true });   // Urutkan berdasarkan deadline

    // Jika terjadi error query
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Format ulang data untuk menambahkan nama course
    const formatted = data.map((task) => ({
      ...task,                                   // Data task asli
      relatedCourse: task.course?.name || null, // Nama course terkait
    }));

    // Kirim response sukses
    return res.status(200).json(formatted);
  }

  // =========================
  // METHOD POST → CREATE TASK
  // =========================
  if (req.method === "POST") {

    // Variabel untuk menampung body request
    let body = "";

    // Terima data body secara streaming
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Dipanggil setelah body selesai diterima
    req.on("end", async () => {
      try {
        // Parsing JSON body menjadi objek task
        const task = JSON.parse(body);

        // Insert task baru ke database
        const { data, error } = await supabase
          .from("task")                           // Tabel task
          .insert([task])                         // Insert data task
          .select();                              // Ambil data hasil insert

        // Jika terjadi error saat insert
        if (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error.message }));
        } else {
          // Response sukses insert
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ message: "Task berhasil ditambahkan!", data })
          );
        }
      } catch (e) {
        // Jika gagal parsing atau error lainnya
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Gagal memproses data" }));
      }
    });

    // Hentikan eksekusi setelah POST
    return;
  }

  // =========================
  // METHOD PUT → UPDATE TASK
  // =========================
  if (req.method === "PUT") {

    // Variabel untuk menampung body request
    let body = "";

    // Terima data body secara streaming
    req.on("data", (chunk) => (body += chunk.toString()));

    // Dipanggil setelah body selesai diterima
    req.on("end", async () => {
      try {
        // Parsing field yang akan diupdate
        const {
          id_task,                               // ID task
          id_course,                             // ID course
          title,                                 // Judul task
          description,                           // Deskripsi task
          deadline,                              // Deadline task
          status,                                // Status task
          priority,                              // Prioritas task
        } = JSON.parse(body);

        // Validasi id_task wajib ada
        if (!id_task) {
          return res
            .status(400)
            .json({ error: "Parameter id_task wajib diisi untuk update." });
        }

        // Data yang akan diupdate
        const updateData = {
          id_course,
          title,
          description,
          deadline,
          status,
          priority,
        };

        // Update data task berdasarkan id_task
        const { data, error } = await supabase
          .from("task")                           // Tabel task
          .update(updateData)                     // Data update
          .eq("id_task", id_task)                 // Filter ID task
          .select();                              // Ambil data hasil update

        // Jika update gagal
        if (error) return res.status(400).json({ error: error.message });

        // Response sukses update
        return res.status(200).json({
          message: `Task dengan id_task ${id_task} berhasil diperbarui.`,
          data,
        });
      } catch (err) {
        // Jika gagal parsing atau error lain
        return res.status(500).json({ error: "Gagal memproses data update." });
      }
    });

    // Hentikan eksekusi setelah PUT
    return;
  }

  // =========================
  // METHOD DELETE → DELETE TASK
  // =========================
  if (req.method === "DELETE") {

    // Parsing URL request
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Ambil parameter id (id_task)
    const id = url.searchParams.get("id");

    // Validasi id wajib ada
    if (!id) {
      return res.status(400).json({
        error: "Parameter 'id' (id_task) diperlukan untuk menghapus task.",
      });
    }

    // Hapus task berdasarkan id_task
    const { error } = await supabase
      .from("task")                              // Tabel task
      .delete()                                  // Operasi delete
      .eq("id_task", id);                        // Filter ID task

    // Jika delete gagal
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Response sukses delete
    return res
      .status(200)
      .json({ message: `Task dengan id_task ${id} berhasil dihapus.` });
  }

  // =========================
  // METHOD TIDAK DIDUKUNG
  // =========================
  res.status(405).json({ error: "Method not allowed " });
}
