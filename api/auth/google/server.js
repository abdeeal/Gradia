import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const baseUrl =
    process.env.VERCEL_ENV === "production"
      ? "https://gradia-three.vercel.app"
      : "http://localhost:5173";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/login`, // redirect kembali ke front-end
    },
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.status(200).json({ url: data.url });
}
