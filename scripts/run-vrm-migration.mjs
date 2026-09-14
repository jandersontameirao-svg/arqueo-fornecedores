// Runner idempotente da migração VRM (Score de Risco, Risk Register, Assessments,
// Offboarding). Usa a DATABASE_URL do .env e o mysql2 já instalado.
// Uso na VPS:  node scripts/run-vrm-migration.mjs
// 100% aditivo (CREATE TABLE IF NOT EXISTS) — não altera nem apaga tabelas existentes.
import "dotenv/config";
import { readFileSync } from "fs";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("ERRO: DATABASE_URL ausente no .env");
  process.exit(1);
}

let sql = readFileSync(new URL("./migrate-vrm-modules.sql", import.meta.url), "utf8");
// remove linhas de comentário (--) e divide em comandos
sql = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const stmts = sql.split(";").map((s) => s.trim()).filter(Boolean);

const conn = await mysql.createConnection(url);
try {
  for (const s of stmts) {
    await conn.query(s);
  }
  console.log(`OK: ${stmts.length} comando(s) aplicado(s) com sucesso (idempotente).`);
} catch (e) {
  console.error("Falha ao aplicar a migração VRM:", e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
