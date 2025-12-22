// Import Supabase client untuk koneksi ke database
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,        // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY    // Public anon key Supabase
);

// Handler API utama untuk CRUD course
export default async function handler(req, res) {

  // =========================
  // METHOD PUT → UPDATE COURSE
  // =========================
  if (req.method === "PUT") {

    // Variabel untuk menampung body request
    let body = "";

    // Terima data body secara streaming
    req.on("data", (chunk) => {
      body += chunk.toString();          // Gabungkan potongan data
    });

    // Dipanggil setelah body selesai diterima
    req.on("end", async () => {

      // Parsing JSON body
      const { id_courses, ...updateFields } = JSON.parse(body);

      // Validasi id_courses wajib ada
      if (!id_courses) {
        return res
          .status(400)
          .json({ error: "Parameter 'id_courses' wajib diisi untuk update." });
      }

      // Update data course berdasarkan id_courses
      const { data, error } = await supabase
        .from("course")                  // Tabel course
        .update(updateFields)            // Field yang akan diupdate
        .eq("id_courses", id_courses)    // Filter berdasarkan ID
        .select();                       // Ambil data hasil update

      // Jika terjadi error saat update
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Response sukses update
      res.status(200).json({
        message: `Course dengan id ${id_courses} berhasil diperbarui.`,
        data,
      });
    });

    // Hentikan eksekusi setelah PUT
    return;
  }

  // =========================
  // METHOD GET → READ COURSE
  // =========================
  if (req.method === "GET") {

    // Parsing URL request
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Ambil query parameter q
    const q = url.searchParams.get("q");

    // Ambil idWorkspace dari query parameter
    const idWorkspace = url.searchParams.get("idWorkspace");

    // Validasi idWorkspace wajib ada
    if (!idWorkspace) {
      return res
        .status(400)
        .json({ error: "Parameter 'idWorkspace' diperlukan." });
    }

    // =========================
    // Filter course hari ini
    // =========================
    if (q === "today") {

      // Ambil nama hari ini (Monday, Tuesday, dst)
      const today = new Date().toLocaleString("en-US", { weekday: "long" });

      // Ambil course sesuai workspace dan hari ini
      const { data, error } = await supabase
        .from("course")                  // Tabel course
        .select("*")                     // Ambil semua kolom
        .eq("id_workspace", idWorkspace) // Filter workspace
        .eq("day", today);               // Filter hari

      // Jika query gagal
      if (error) return res.status(500).json({ error: error.message });

      // Response sukses
      return res.status(200).json(data);
    }

    // =========================
    // Tanpa query q → ambil semua course
    // =========================
    const { data, error } = await supabase
      .from("course")                    // Tabel course
      .select("*")                       // Ambil semua kolom
      .eq("id_workspace", idWorkspace);  // Filter workspace

    // Jika query gagal
    if (error) return res.status(500).json({ error: error.message });

    // Response sukses
    return res.status(200).json(data);
  }

  // =========================
  // METHOD POST → CREATE COURSE
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

      // Parsing JSON body menjadi objek course
      const course = JSON.parse(body);

      // Insert data course baru ke database
      const { data, error } = await supabase
        .from("course")                  // Tabel course
        .insert([course])                // Insert data
        .select();                       // Ambil data hasil insert

      // Kirim response sesuai hasil insert
      res.writeHead(error ? 400 : 201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          error ? { error: error.message } : { message: "ok", data }
        )
      );
    });
  }

  // =========================
  // METHOD DELETE → DELETE COURSE
  // =========================
  if (req.method === "DELETE") {

    // Parsing URL request
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Ambil parameter id dari query string
    const id = url.searchParams.get("id");

    // Validasi id wajib ada
    if (!id) {
      return res.status(400).json({ error: "Parameter 'id' diperlukan." });
    }

    // Hapus course berdasarkan id_courses
    const { error } = await supabase
      .from("course")                    // Tabel course
      .delete()                          // Operasi delete
      .eq("id_courses", id);             // Filter ID course

    // Jika delete gagal
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Response sukses delete
    return res
      .status(200)
      .json({ message: `Course dengan id ${id} berhasil dihapus.` });
  }
}
