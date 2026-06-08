#!/usr/bin/env node
/**
 * scripts/backfill-organizational-group.mjs
 *
 * Atribui organizationalGroupId = 1 (Grupo Arqueo Brasil) a registros legados
 * com NULL nesse campo. Estado idempotente — pode rodar quantas vezes quiser.
 *
 * Por que: campo organizationalGroupId foi criado depois dos dados originais
 * e ficou NULL nesses registros. O Bloco H aplicou filtro estrito por esse
 * campo, então registros NULL deixaram de aparecer na UI. O Bloco J adicionou
 * fallback (OR IS NULL) no código, mas o ideal é rodar este backfill UMA VEZ
 * para deixar o banco em estado canônico — assim quando você popular Foods
 * and Drinks ou Africa no futuro, o isolamento entre grupos volta a ser
 * estrito (sem o "vazamento" controlado dos NULLs).
 *
 * Como rodar no VPS:
 *   cd /var/www/arqueo-fornecedores
 *   node scripts/backfill-organizational-group.mjs
 *
 * O script lê DATABASE_URL do .env (mesmo que o app usa).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[backfill] DATABASE_URL não encontrada no ambiente. Carregue o .env primeiro.");
  process.exit(1);
}

// Grupo padrão para onde mover os registros legados.
// 1 = Grupo Arqueo Brasil (organizationalGroups.id=1).
const DEFAULT_ORG_GROUP_ID = Number(process.env.BACKFILL_ORG_GROUP_ID ?? 1);

const TABLES_WITH_ORG_GROUP = [
  "suppliers",
  "documents",
  "contracts",
  "interactions",
  "performance_evaluations",
  "compliance_alerts",
  "approval_workflows",
  "companies",
  "business_units",
  "contract_amendments",
  "audit_logs",
];

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log(`[backfill] Conectado. Atribuindo organizationalGroupId=${DEFAULT_ORG_GROUP_ID} aos registros NULL.`);

  let totalUpdated = 0;
  for (const table of TABLES_WITH_ORG_GROUP) {
    try {
      const [rows] = await conn.execute(
        `UPDATE \`${table}\` SET organizationalGroupId = ? WHERE organizationalGroupId IS NULL`,
        [DEFAULT_ORG_GROUP_ID]
      );
      const affected = (rows && /** @type {any} */ (rows).affectedRows) || 0;
      console.log(`  - ${table}: ${affected} registro(s) atualizado(s)`);
      totalUpdated += affected;
    } catch (err) {
      console.warn(`  - ${table}: pulado (${(/** @type {any} */ (err)).message?.slice(0, 80) || "erro"})`);
    }
  }

  console.log(`[backfill] Total: ${totalUpdated} registro(s) migrado(s).`);
  await conn.end();
}

main().catch((err) => {
  console.error("[backfill] Erro fatal:", err);
  process.exit(2);
});
