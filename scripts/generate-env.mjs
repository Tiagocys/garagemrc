import { writeFileSync } from "node:fs";
import "dotenv/config";

const { SUPABASE_URL, SUPABASE_ANON_KEY, RECAPTCHA_SITE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Faltam SUPABASE_URL e/ou SUPABASE_ANON_KEY no .env");
}

const out = `window.__ENV = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
  RECAPTCHA_SITE_KEY: "${RECAPTCHA_SITE_KEY || ""}"
};`;
writeFileSync("public/env.js", out);
console.log("✔️  Gerado public/env.js");
