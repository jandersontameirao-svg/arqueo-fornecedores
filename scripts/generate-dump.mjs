/**
 * generate-dump.mjs
 * Gera dump SQL completo (DDL + dados) compatível com MySQL 8
 * para importação no banco externo arqforn da VPS.
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Carregar .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL não encontrada");

// Parsear URL mysql://user:pass@host:port/db?ssl=...
const urlMatch = DATABASE_URL.match(
  /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
);
if (!urlMatch) throw new Error("Formato de DATABASE_URL inválido");

const [, user, password, host, port, database] = urlMatch;

const conn = await mysql.createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: true },
  multipleStatements: true,
});

const OUTPUT = path.resolve(process.cwd(), "scripts/arqueo_fornecedores_dump.sql");
const out = fs.createWriteStream(OUTPUT, { encoding: "utf8" });

function write(s) {
  out.write(s);
}

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
  if (Buffer.isBuffer(v)) return `0x${v.toString("hex")}`;
  // string — escapar caracteres especiais MySQL
  return "'" + String(v)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\0/g, "\\0")
    .replace(/\x1a/g, "\\Z") + "'";
}

// Cabeçalho
const now = new Date().toISOString();
write(`-- ============================================================\n`);
write(`-- Arqueo Fornecedores — Dump SQL Completo de Produção\n`);
write(`-- Gerado em: ${now}\n`);
write(`-- Banco destino: arqforn (MySQL 8 / MariaDB 10.6+)\n`);
write(`-- Origem: TiDB Cloud (${host})\n`);
write(`-- ============================================================\n\n`);

write(`SET NAMES utf8mb4;\n`);
write(`SET CHARACTER SET utf8mb4;\n`);
write(`SET collation_connection = 'utf8mb4_unicode_ci';\n`);
write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
write(`SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n`);
write(`SET time_zone = '+00:00';\n\n`);

write(`CREATE DATABASE IF NOT EXISTS \`arqforn\`\n`);
write(`  DEFAULT CHARACTER SET utf8mb4\n`);
write(`  DEFAULT COLLATE utf8mb4_unicode_ci;\n`);
write(`USE \`arqforn\`;\n\n`);

// Listar tabelas em ordem topológica (dependências primeiro)
const [tablesRaw] = await conn.query(
  `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
);
const tables = tablesRaw.map((r) => r.TABLE_NAME);

console.log(`Tabelas encontradas (${tables.length}): ${tables.join(", ")}`);

// DDL + dados por tabela
for (const table of tables) {
  console.log(`  → Exportando tabela: ${table}`);

  // DDL
  const [[ddlRow]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
  let ddl = ddlRow["Create Table"];

  // Adaptar DDL para MySQL 8 puro (TiDB tem sintaxes específicas)
  // Remover comentários TiDB específicos
  ddl = ddl.replace(/\/\*T![^*]*\*\//g, "");
  ddl = ddl.replace(/\/\*![^*]*\*\//g, "");
  // Normalizar ENGINE
  ddl = ddl.replace(/ENGINE=InnoDB[^;]*/i, "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  // Remover CLUSTERED/NONCLUSTERED (TiDB)
  ddl = ddl.replace(/\s*\/\*.*?CLUSTERED.*?\*\//g, "");
  // Limpar espaços duplos
  ddl = ddl.replace(/\n\s*\n/g, "\n");

  write(`-- ------------------------------------------------------------\n`);
  write(`-- Tabela: ${table}\n`);
  write(`-- ------------------------------------------------------------\n`);
  write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
  write(`${ddl};\n\n`);

  // Dados
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  if (rows.length === 0) {
    write(`-- (sem dados)\n\n`);
    continue;
  }

  const cols = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const values = chunk
      .map((row) => `(${Object.values(row).map(esc).join(", ")})`)
      .join(",\n  ");
    write(`INSERT INTO \`${table}\` (${cols}) VALUES\n  ${values};\n`);
  }
  write(`\n`);
}

// Rodapé
write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
write(`-- ============================================================\n`);
write(`-- Fim do dump — ${tables.length} tabelas exportadas\n`);
write(`-- ============================================================\n`);

await new Promise((resolve) => out.end(resolve));
await conn.end();

const stats = fs.statSync(OUTPUT);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`\nDump gerado: ${OUTPUT}`);
console.log(`Tamanho: ${sizeMB} MB`);
console.log(`Tabelas: ${tables.length}`);
