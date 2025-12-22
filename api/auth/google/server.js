// Mengimpor fungsi createClient dari library Supabase
import { createClient } from "@supabase/supabase-js";

// Membuat client Supabase menggunakan URL dan Anon Key dari environment variable
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,      // URL project Supabase
  process.env.VITE_SUPABASE_ANON_KEY  // Anonymous public key Supabase
);

// Fungsi handler utama (API endpoint)
export default async function handler(req, res) {
  // Mengecek apakah method HTTP bukan GET
  if (req.method !== "GET")
    // Jika bukan GET, kembalikan error Method not allowed
    return res.status(405).json({ error: "Method not allowed" });

  // Menentukan base URL berdasarkan environment (production atau development)
  const baseUrl =
    process.env.VERCEL_ENV === "production"
      ? "https://gradia-three.vercel.app" // URL front-end saat production
      : "http://localhost:5173";          // URL front-end saat development (local)

  // Melakukan login menggunakan OAuth Google melalui Supabase
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google", // Provider OAuth yang digunakan (Google)
    options: {
      redirectTo: `${baseUrl}/auth/login`, // URL redirect setelah login Google berhasil
    },
  });

  // Jika terjadi error saat proses OAuth
  if (error) return res.status(400).json({ error: error.message });

  // Mengembalikan URL OAuth Google ke client untuk redirect
  return res.status(200).json({ url: data.url });
}
