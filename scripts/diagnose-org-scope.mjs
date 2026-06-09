/**
 * Diagnóstico (somente leitura) do escopo organizacional.
 * Mostra grupos, áreas (business_units) e empresas com seus organizationalGroupId.
 * Execução: node scripts/diagnose-org-scope.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada.");
    process.exit(1);
  }
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  console.log("\n=== GRUPOS ORGANIZACIONAIS ===");
  const [groups] = await conn.execute("SELECT id, name, slug, country FROM organizational_groups ORDER BY id");
  console.table(groups);

  console.log("\n=== ÁREAS DE NEGÓCIO (business_units) ===");
  const [bus] = await conn.execute("SELECT id, name, organizationalGroupId FROM business_units ORDER BY id");
  console.table(bus);

  console.log("\n=== EMPRESAS (companies) ===");
  const [companies] = await conn.execute("SELECT id, legalName, tradeName, organizationalGroupId, businessUnitId FROM companies ORDER BY id");
  console.table(companies);

  console.log("\n=== CONTAGENS POR GRUPO ===");
  const [counts] = await conn.execute(`
    SELECT
      (SELECT COUNT(*) FROM business_units WHERE organizationalGroupId IS NULL) AS bu_sem_grupo,
      (SELECT COUNT(*) FROM companies WHERE organizationalGroupId IS NULL) AS empresas_sem_grupo,
      (SELECT COUNT(*) FROM suppliers WHERE organizationalGroupId IS NULL) AS fornecedores_sem_grupo
  `);
  console.table(counts);

  await conn.end();
  process.exit(0);
}
run().catch((e) => { console.error(e.message); process.exit(1); });
