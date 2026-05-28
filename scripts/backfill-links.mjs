/**
 * backfill-links.mjs — Migração idempotente de vínculos legados para supplier_company_links
 * 
 * Regras:
 * 1. Lê fornecedores com suppliers.companyId (slug textual) que NÃO têm vínculo canônico ativo
 * 2. Resolve o slug para companyId numérico usando mapa hardcoded
 * 3. Resolve businessUnitId a partir da tabela companies
 * 4. Cria vínculo em supplier_company_links com status 'active'
 * 5. Idempotente: se o vínculo já existe (supplierId+companyId), pula
 * 
 * Uso: node scripts/backfill-links.mjs
 *   --dry-run  (padrão: mostra o que seria feito sem alterar dados)
 *   --execute  (aplica as alterações)
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não definida");
  process.exit(1);
}

// Mapa canônico: slug → companyId numérico
const SLUG_TO_COMPANY_ID = {
  "arqueogis-preventiva": 1,
  "arqueoproject": 2,
  "arqueogis-geoprocessamento": 3,
  "arqueocean": 30001,
  // Variações conhecidas
  "grupo-arqueo": null, // Slug inválido — não mapeia para empresa específica
  "all_grupo_arqueo_brasil": null,
};

const isDryRun = !process.argv.includes("--execute");

async function main() {
  const conn = await createConnection(DATABASE_URL);
  
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  BACKFILL DE VÍNCULOS LEGADOS ${isDryRun ? "(DRY RUN)" : "(EXECUTANDO)"}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // 1. Buscar fornecedores órfãos
  const [orphans] = await conn.query(`
    SELECT s.id, s.companyName, s.companyId AS legacySlug, s.groupId, s.categoryId, s.criticality
    FROM suppliers s
    WHERE s.companyId IS NOT NULL AND s.companyId != ''
    AND NOT EXISTS (
      SELECT 1 FROM supplier_company_links scl WHERE scl.supplierId = s.id AND scl.status = 'active'
    )
  `);

  if (orphans.length === 0) {
    console.log("✅ Nenhum fornecedor órfão encontrado. Nada a fazer.");
    await conn.end();
    return;
  }

  console.log(`📋 Fornecedores órfãos encontrados: ${orphans.length}\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const orphan of orphans) {
    const slug = orphan.legacySlug;
    let companyId = SLUG_TO_COMPANY_ID[slug];

    // Tentar resolver como numérico direto
    if (companyId === undefined) {
      const parsed = parseInt(slug, 10);
      if (!isNaN(parsed)) {
        companyId = parsed;
      }
    }

    if (companyId === null || companyId === undefined) {
      console.log(`  ⚠️  [SKIP] Fornecedor #${orphan.id} "${orphan.companyName}" — slug "${slug}" não mapeável`);
      skipped++;
      continue;
    }

    // Resolver businessUnitId a partir da tabela companies
    const [[company]] = await conn.query("SELECT businessUnitId FROM companies WHERE id = ?", [companyId]);
    if (!company) {
      console.log(`  ❌ [ERRO] Fornecedor #${orphan.id} — companyId ${companyId} não existe na tabela companies`);
      errors++;
      continue;
    }

    const businessUnitId = company.businessUnitId;

    // Verificar se já existe (idempotência)
    const [[existing]] = await conn.query(
      "SELECT id FROM supplier_company_links WHERE supplierId = ? AND companyId = ?",
      [orphan.id, companyId]
    );
    if (existing) {
      console.log(`  ℹ️  [EXISTE] Fornecedor #${orphan.id} já tem vínculo com company ${companyId} (link #${existing.id})`);
      skipped++;
      continue;
    }

    if (isDryRun) {
      console.log(`  🔍 [DRY] Criaria vínculo: supplier #${orphan.id} "${orphan.companyName}" → company ${companyId} (BU: ${businessUnitId})`);
      migrated++;
    } else {
      await conn.query(`
        INSERT INTO supplier_company_links (supplierId, companyId, businessUnitId, status, categoryId, criticality, createdAt, updatedAt)
        VALUES (?, ?, ?, 'active', ?, ?, NOW(), NOW())
      `, [orphan.id, companyId, businessUnitId, orphan.categoryId || null, orphan.criticality || "medium"]);
      console.log(`  ✅ [OK] Vínculo criado: supplier #${orphan.id} "${orphan.companyName}" → company ${companyId} (BU: ${businessUnitId})`);
      migrated++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RESULTADO");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  ${isDryRun ? "Seriam migrados" : "Migrados"}:  ${migrated}`);
  console.log(`  Pulados (existente/inválido):    ${skipped}`);
  console.log(`  Erros:                           ${errors}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (isDryRun && migrated > 0) {
    console.log("\n💡 Para aplicar, execute: node scripts/backfill-links.mjs --execute");
  }

  await conn.end();
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
