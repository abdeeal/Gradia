import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// random password 8 karakter
const randomPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { access_token, refresh_token } = req.body;
    if (!access_token) return res.status(400).json({ error: "Access token required" });

    // set session Supabase sementara untuk ambil info user
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) throw sessionError;
    const user = sessionData.session?.user;
    if (!user) throw new Error("User not found in session");

    const email = user.email;
    const displayName = user.user_metadata.full_name || user.user_metadata.name;

    // cek apakah email sudah ada di tabel "user"
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (selectError && selectError.code !== "PGRST116") throw selectError; // PGRST116 = no rows

    let resultUser;
    if (existingUser) {
      // update is_verified
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ is_verified: true })
        .eq("id_user", existingUser.id_user)
        .select()
        .single();

      if (updateError) throw updateError;
      resultUser = updatedUser;
    } else {
      // insert user baru
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          username: displayName,
          email,
          password: randomPassword(),
          is_verified: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      resultUser = newUser;
    }

    return res.status(200).json({
      id_user: resultUser.id_user,
      username: resultUser.username,
      email: resultUser.email,
    });
  } catch (err) {
    console.error("CALLBACK ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
