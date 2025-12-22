// Import fungsi createClient dari library Supabase
import { createClient } from "@supabase/supabase-js";

// Membuat instance client Supabase menggunakan environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, // URL Supabase project
  process.env.VITE_SUPABASE_ANON_KEY // Anon public key Supabase
);

// Export default function handler untuk menangani request API
export default async function handler(req, res) {
  // Menyimpan method HTTP (GET, POST, PUT, DELETE)
  const method = req.method;

  // =======================
  // HANDLE METHOD GET
  // =======================
  if (method === "GET") {
    // Membuat objek URL dari request
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Mengambil parameter idWorkspace dari query string
    const idWorkspace = url.searchParams.get("idWorkspace");

    // Validasi jika idWorkspace tidak dikirim
    if (!idWorkspace) {
      return res
        .status(400)
        .json({ error: "Parameter 'idWorkspace' diperlukan." });
    }

    // Query ke tabel presence dengan relasi ke tabel course
    const { data, error } = await supabase
      .from("presence") // Tabel presence
      .select(
        `
      id_presence,
      presences_at,
      status,
      note,
      id_course,
      created_at,
      course: id_course (
        name,
        room,
        sks,
        start,
        end,
        id_workspace
      )
    `
      )
      // Mengurutkan berdasarkan tanggal presensi terbaru
      .order("presences_at", { ascending: false })
      // Filter berdasarkan id_workspace
      .eq("id_workspace", idWorkspace);

    // Jika terjadi error saat query
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Format ulang data agar lebih rapi untuk response
    const formatted = data.map((item) => ({
      id_presence: item.id_presence,
      id_course: item.id_course,
      presences_at: item.presences_at,
      status: item.status,
      note: item.note,
      created_at: item.created_at,
      course_name: item.course?.name || "-",
      course_room: item.course?.room || "-",
      course_sks: item.course?.sks || "-",
      course_start: item.course?.start || "-",
      course_end: item.course?.end || "-",
    }));

    // Mengirim response sukses
    return res.status(200).json(formatted);
  }

  // =======================
  // HANDLE METHOD POST
  // =======================
  if (method === "POST") {
    try {
      // Variabel untuk menampung body request
      let body = "";

      // Membaca data request secara bertahap
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      // Ketika seluruh body sudah diterima
      req.on("end", async () => {
        // Parsing JSON body
        const { id_course, status, note, id_workspace } = JSON.parse(body);

        // Validasi field wajib
        if (!id_course || !status) {
          return res
            .status(400)
            .json({ error: "id_course dan status wajib diisi" });
        }

        // Insert data presensi ke tabel presence
        const { data, error } = await supabase
          .from("presence")
          .insert([
            {
              id_course,
              status,
              note,
              id_workspace,
            },
          ])
          .select();

        // Jika terjadi error saat insert
        if (error) {
          return res.status(400).json({ error: error.message });
        }

        // Response sukses
        res
          .status(201)
          .json({ message: "Presence berhasil ditambahkan", data });
      });
    } catch (err) {
      // Error internal server
      return res.status(500).json({ error: err.message });
    }
  }

  // =======================
  // HANDLE METHOD PUT
  // =======================
  else if (method === "PUT") {
    try {
      // Variabel untuk menampung body request
      let body = "";

      // Membaca body request
      req.on("data", (chunk) => (body += chunk.toString()));

      // Setelah body selesai dibaca
      req.on("end", async () => {
        // Parsing JSON body
        const { id_presence, id_course, status, note } = JSON.parse(body);

        // Validasi id_presence
        if (!id_presence) {
          return res
            .status(400)
            .json({ error: "id_presence wajib diisi untuk update" });
        }

        // Update data presence berdasarkan id_presence
        const { data, error } = await supabase
          .from("presence")
          .update({
            id_course,
            status,
            note,
          })
          .eq("id_presence", id_presence)
          .select();

        // Jika terjadi error
        if (error) return res.status(400).json({ error: error.message });

        // Response sukses
        return res
          .status(200)
          .json({ message: "Presence berhasil diperbarui", data });
      });
    } catch (err) {
      // Error internal server
      return res.status(500).json({ error: err.message });
    }
  }

  // =======================
  // HANDLE METHOD DELETE
  // =======================
  else if (method === "DELETE") {
    // Mengambil parameter id dari query
    const { id } = req.query;

    // Validasi id
    if (!id) {
      return res.status(400).json({ error: "Parameter id wajib diisi" });
    }

    // Menghapus data presence berdasarkan id_presence
    const { error } = await supabase
      .from("presence")
      .delete()
      .eq("id_presence", id);

    // Jika terjadi error
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Response sukses
    return res
      .status(200)
      .json({ message: `Presence dengan id ${id} berhasil dihapus` });
  }

  // =======================
  // METHOD TIDAK DIDUKUNG
  // =======================
  else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
