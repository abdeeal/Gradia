import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { text, password } = JSON.parse(body);

      if (!text || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Text and password are required." })
        );
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${text},username.eq.${text}`)
        .maybeSingle();

      if (userError) throw userError;

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Username or email not found." })
        );
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Incorrect password." }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Login successful!",
          user: {
            id_user: user.id_user || user.id,
            username: user.username,
            email: user.email,
          },
        })
      );
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
