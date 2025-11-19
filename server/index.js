import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const PORT = process.env.BACKEND_PORT || 3333;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("[backend] Supabase client initialised");
} else {
  console.warn(
    "[backend] Missing Supabase env vars. /api/login will return 500 until they are set.",
  );
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    supabaseConfigured: Boolean(supabaseClient),
    timestamp: new Date().toISOString(),
  });
});

app.get("/login", (_req, res) => {
  res.type("html").send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>LinguaLearn Admin Login</title>
      <style>
        body { font-family: Arial, sans-serif; background:#0f172a; color:#f8fafc; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
        form { background:#1e293b; padding:2rem; border-radius:1rem; width:320px; box-shadow:0 20px 35px rgba(15,23,42,0.4); }
        h1 { margin-top:0; font-size:1.5rem; display:flex; align-items:center; gap:.35rem; }
        label { font-size:.85rem; text-transform:uppercase; letter-spacing:.08em; margin-bottom:.25rem; display:block; }
        input { width:100%; padding:.65rem .8rem; border-radius:.55rem; border:none; margin-bottom:1rem; background:#0f172a; color:#f8fafc; }
        button { width:100%; padding:.75rem; border:none; border-radius:.6rem; font-weight:600; background:#10b981; color:#0f172a; cursor:pointer; }
        small { display:block; margin-top:1rem; color:#94a3b8; font-size:.75rem; text-align:center; }
      </style>
    </head>
    <body>
      <form method="POST" action="/api/login">
        <h1>🦉 LinguaLearn</h1>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com" />
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="••••••••" />
        <button type="submit">Sign In</button>
        <small>Credentials are verified through Supabase Auth.</small>
      </form>
    </body>
  </html>`);
});

app.post("/api/login", async (req, res) => {
  if (!supabaseClient) {
    return res.status(500).json({ error: "Supabase is not configured on the backend." });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      message: "Login successful",
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Unexpected error" });
  }
});

app.post("/api/signup", async (req, res) => {
  if (!supabaseClient) {
    return res.status(500).json({ error: "Supabase is not configured on the backend." });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.APP_URL || "http://localhost:8080"}/`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Signup successful. Check your inbox to confirm the account.",
      user: data.user,
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Unexpected error" });
  }
});

app.listen(PORT, () => {
  console.log(`[backend] Listening on http://localhost:${PORT}`);
});

