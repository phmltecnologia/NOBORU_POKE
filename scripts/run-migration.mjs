#!/usr/bin/env node
/**
 * Aplica supabase/migrations/001_initial.sql no Postgres do projeto.
 * Uso (não commitar a senha):
 *   set SUPABASE_DB_PASSWORD=sua_senha
 *   node scripts/run-migration.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "eqlhhcnrsbyniacrqrvs";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Defina SUPABASE_DB_PASSWORD no ambiente.");
  process.exit(1);
}

const hosts = [
  process.env.SUPABASE_DB_HOST,
  `db.${PROJECT_REF}.supabase.co`,
  "aws-0-sa-east-1.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
].filter(Boolean);

const sqlPath = path.join(root, "supabase", "migrations", "001_initial.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

let lastErr;
for (const host of hosts) {
  const isPooler = host.includes("pooler");
  const client = new pg.Client({
    host,
    port: Number(process.env.SUPABASE_DB_PORT || (isPooler ? 6543 : 5432)),
    database: "postgres",
    user: isPooler ? `postgres.${PROJECT_REF}` : "postgres",
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    console.log("Conectado via", host);
    await client.query(sql);
    console.log("Migration 001_initial.sql aplicada com sucesso.");
    const { rows } = await client.query(
      "SELECT count(*)::int AS n FROM menu_items WHERE active = true"
    );
    console.log("Itens no cardápio:", rows[0].n);
    const { rows: admins } = await client.query(
      "SELECT phone_display, role FROM profiles WHERE role = 'admin'"
    );
    console.log("Admin(s):", admins);
    await client.end();
    process.exit(0);
  } catch (e) {
    lastErr = e;
    console.warn("Falha em", host + ":", e.message);
    try {
      await client.end();
    } catch (_) {
      /* ignore */
    }
  }
}
console.error("Erro na migration:", lastErr?.message || "sem conexão");
process.exit(1);
