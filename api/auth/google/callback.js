// Mengimpor fungsi createClient dari library Supabase
import { createClient } from "@supabase/supabase-js";

// Mengimpor library bcrypt untuk hashing password
import bcrypt from "bcrypt";

// Membuat client Supabase menggunakan URL dan Anon Key dari environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,       // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY   // Anonymous public key Supabase
);

// Fungsi untuk membuat password acak sepanjang 8 karakter
const randomPassword = () => {
  // Kumpulan karakter yang diperbolehkan
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  
  // Variabel penampung hasil password
  let result = "";
  
  // Loop 8 kali untuk membuat password 8 karakter
  for (let i = 0; i < 8; i++) {
    // Mengambil karakter secara acak dari chars
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Mengembalikan password acak
  return result;
};

// Fungsi handler utama sebagai endpoint API
export default async function handler(req, res) {

  // Mengecek apakah method HTTP bukan POST
  if (req.method !== "POST") 
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Mengambil access_token dan refresh_token dari request body
    const { access_token, refresh_token } = req.body;

    // Validasi jika access_token tidak ada
    if (!access_token) 
      return res.status(400).json({ error: "Access token required" });

    // Set session Supabase sementara untuk mendapatkan data user
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,    // Token akses
      refresh_token,   // Token refresh
    });

    // Jika gagal set session, lempar error
    if (sessionError) throw sessionError;

    // Mengambil data user dari session
    const user = sessionData.session?.user;

    // Jika user tidak ditemukan
    if (!user) throw new Error("User not found in session");

    // Mengambil email user
    const email = user.email;

    // Mengambil nama user dari metadata
    const displayName = user.user_metadata.full_name || user.user_metadata.name;

    // Mengecek apakah email sudah terdaftar di tabel "users"
    const { data: existingUser, error: selectError } = await supabase
      .from("users")           // Mengakses tabel users
      .select("*")             // Mengambil semua kolom
      .eq("email", email)      // Filter berdasarkan email
      .single();               // Mengambil satu baris data

    // Jika error bukan karena data tidak ditemukan, lempar error
    // PGRST116 berarti tidak ada data (bukan error fatal)
    if (selectError && selectError.code !== "PGRST116") 
      throw selectError;

    // Variabel untuk menyimpan user hasil akhir
    let resultUser;

    // Jika user sudah ada
    if (existingUser) {

      // Update status verifikasi user menjadi true
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")                         // Tabel users
        .update({ is_verified: true })         // Field yang diupdate
        .eq("id_user", existingUser.id_user)  // Filter berdasarkan id_user
        .select()
        .single();

      // Jika update gagal
      if (updateError) throw updateError;

      // Simpan hasil update user
      resultUser = updatedUser;

    } else {

      // Jika user belum ada, buat password acak lalu hash dengan bcrypt
      const hashedPassword = await bcrypt.hash(randomPassword(), 10);

      // Insert user baru ke database
      const { data: newUser, error: insertError } = await supabase
        .from("users")                 // Tabel users
        .insert({
          username: displayName,       // Nama user
          email,                       // Email user
          password: hashedPassword,    // Password terenkripsi
          is_verified: true,           // Status verifikasi
        })
        .select()
        .single();

      // Jika insert gagal
      if (insertError) throw insertError;

      // Simpan user baru
      resultUser = newUser;
    }

    // Mengembalikan response sukses ke client
    return res.status(200).json({
      id_user: resultUser.id_user,     // ID user
      username: resultUser.username,   // Username
      email: resultUser.email,         // Email
    });

  } catch (err) {
    // Menampilkan error di console server
    console.error("CALLBACK ERROR:", err);

    // Mengirim response error ke client
    return res.status(500).json({ error: err.message });
  }
}
