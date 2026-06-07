#!/usr/bin/env node
/**
 * Gera js/config.js a partir de SUPABASE_URL e SUPABASE_ANON_KEY (Vercel build).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "js", "config.js");

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const content =
  "/**\n * Gerado por scripts/generate-config.mjs — não edite manualmente no deploy.\n */\n" +
  "window.SUPABASE_CONFIG = " +
  JSON.stringify({ url, anonKey }, null, 2) +
  ";\n";

fs.writeFileSync(out, content, "utf8");
console.log("config.js gerado:", url ? url : "(vazio — modo localStorage)");
