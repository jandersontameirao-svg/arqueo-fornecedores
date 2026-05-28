/**
 * Script de migração — Vínculos legados → supplierCompanyLinks
 * Converte suppliers.companyId (slug textual) em vínculos canônicos
 * 
 * SEGURO: verifica duplicatas antes de inserir
 * Uso: node scripts/migrate-legacy-links.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não definida");
  process.exit(1);
}

// Mapeamento slug → companyId numérico (fonte canônica: client/src/lib/companies.ts)
const SLUG_TO_COMPANY_ID = {
  "arqueogis-preventiva": 1,
  "arqueoproject": 2,
  "arqueogis-geoprocessamento": 3,
  "arqueocean": 30001,
};

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  MIGRAÇÃO DE VÍNCULOS LEGADOS → supplierCompanyLinks");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Buscar fornecedores com companyId legado (slug textual) sem vínculo canônico
  const [orphans] = await conn.query(`
    SELECT s.id, s.companyName, s.companyId as legacySlug, s.groupId
    FROM suppliers s
    WHERE s.companyId IS NOT NULL AND s.companyId != ''
    AND NOT EXISTS (
      SELECT 1 FROM supplier_company_links scl WHERE scl.supplierId = s.id
    )
  `);

  if (orphans.length === 0) {
    console.log("✅ Nenhum fornecedor órfão encontrado. Banco já está migrado.");
    await conn.end();
    return;
  }

  console.log(`📋 Encontrados ${orphans.length} fornecedor(es) para migrar:\n`);
  let migrated = 0;
  let skipped = 0;

  for (const orphan of orphans) {
    const companyId = SLUG_TO_COMPANY_ID[orphan.legacySlug];
    if (!companyId) {
      console.log(`  ⚠️  [ID ${orphan.id}] "${orphan.companyName}" — slug "${orphan.legacySlug}" não mapeado. PULADO.`);
      skipped++;
      continue;
    }

    // Buscar businessUnitId da empresa
    const [[company]] = await conn.query(
      "SELECT businessUnitId FROM companies WHERE id = ?",
      [companyId]
    );
    const businessUnitId = company?.businessUnitId || orphan.groupId || null;

    // Verificar duplicata (idempotência)
    const [[existing]] = await conn.query(
      "SELECT id FROM supplier_company_links WHERE supplierId = ? AND companyId = ?",
      [orphan.id, companyId]
    );
    if (existing) {
      console.log(`  ⏭️  [ID ${orphan.id}] "${orphan.companyName}" — vínculo já existe (link #${existing.id}). PULADO.`);
      skipped++;
      continue;
    }

    // Criar vínculo canônico
    await conn.query(`
      INSERT INTO supplier_company_links (supplierId, companyId, businessUnitId, criticality, homologationStatus, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'medium', 'pending', 'active', NOW(), NOW())
    `, [orphan.id, companyId, businessUnitId]);

    console.log(`  ✅ [ID ${orphan.id}] "${orphan.companyName}" → empresa #${companyId} (BU: ${businessUnitId})`);
    migrated++;
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`  RESULTADO: ${migrated} migrado(s), ${skipped} pulado(s)`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  await conn.end();
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
