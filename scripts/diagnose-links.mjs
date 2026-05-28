/**
 * Script de diagnóstico de banco — SOMENTE LEITURA
 * Verifica integridade dos vínculos supplierCompanyLinks vs suppliers.companyId legado
 * 
 * Uso: node scripts/diagnose-links.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não definida");
  process.exit(1);
}

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  DIAGNÓSTICO DE INTEGRIDADE — supplierCompanyLinks");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // 1. Total de fornecedores
  const [[{ total: totalSuppliers }]] = await conn.query("SELECT COUNT(*) as total FROM suppliers");
  console.log(`📊 Total de fornecedores: ${totalSuppliers}`);

  // 2. Total de vínculos canônicos
  const [[{ total: totalLinks }]] = await conn.query("SELECT COUNT(*) as total FROM supplier_company_links");
  console.log(`🔗 Total de vínculos (supplierCompanyLinks): ${totalLinks}`);

  // 3. Fornecedores com companyId legado mas SEM vínculo canônico
  const [orphans] = await conn.query(`
    SELECT s.id, s.companyName, s.companyId as legacyCompanyId
    FROM suppliers s
    WHERE s.companyId IS NOT NULL AND s.companyId != ''
    AND NOT EXISTS (
      SELECT 1 FROM supplier_company_links scl WHERE scl.supplierId = s.id
    )
  `);
  console.log(`\n⚠️  Fornecedores com companyId legado SEM vínculo canônico: ${orphans.length}`);
  if (orphans.length > 0) {
    console.table(orphans);
  }

  // 4. Vínculos sem businessUnitId
  const [linksNoBu] = await conn.query(`
    SELECT scl.id, scl.supplierId, scl.companyId, s.companyName
    FROM supplier_company_links scl
    LEFT JOIN suppliers s ON s.id = scl.supplierId
    WHERE scl.businessUnitId IS NULL
  `);
  console.log(`\n⚠️  Vínculos sem businessUnitId: ${linksNoBu.length}`);
  if (linksNoBu.length > 0) {
    console.table(linksNoBu);
  }

  // 5. Vínculos com companyId que não existe na tabela companies
  const [invalidCompany] = await conn.query(`
    SELECT scl.id, scl.supplierId, scl.companyId, s.companyName
    FROM supplier_company_links scl
    LEFT JOIN suppliers s ON s.id = scl.supplierId
    WHERE scl.companyId NOT IN (SELECT id FROM companies)
  `);
  console.log(`\n❌ Vínculos com companyId inválido (não existe em companies): ${invalidCompany.length}`);
  if (invalidCompany.length > 0) {
    console.table(invalidCompany);
  }

  // 6. Vínculos duplicados (mesmo supplierId + companyId)
  const [duplicates] = await conn.query(`
    SELECT supplierId, companyId, COUNT(*) as count
    FROM supplier_company_links
    GROUP BY supplierId, companyId
    HAVING COUNT(*) > 1
  `);
  console.log(`\n🔄 Vínculos duplicados (mesmo fornecedor+empresa): ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.table(duplicates);
  }

  // 7. Distribuição de vínculos por empresa
  const [distribution] = await conn.query(`
    SELECT c.id, c.legalName, c.businessUnitId, COUNT(scl.id) as linkCount
    FROM companies c
    LEFT JOIN supplier_company_links scl ON scl.companyId = c.id
    GROUP BY c.id, c.legalName, c.businessUnitId
    ORDER BY linkCount DESC
  `);
  console.log("\n📈 Distribuição de vínculos por empresa:");
  console.table(distribution);

  // 8. Distribuição por businessUnit
  const [buDistribution] = await conn.query(`
    SELECT bu.id, bu.name, COUNT(scl.id) as linkCount
    FROM business_units bu
    LEFT JOIN supplier_company_links scl ON scl.businessUnitId = bu.id
    GROUP BY bu.id, bu.name
    ORDER BY linkCount DESC
  `);
  console.log("\n📈 Distribuição de vínculos por área de negócio:");
  console.table(buDistribution);

  // 9. Resumo
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RESUMO");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Fornecedores totais:          ${totalSuppliers}`);
  console.log(`  Vínculos canônicos:           ${totalLinks}`);
  console.log(`  Órfãos (legado sem vínculo):  ${orphans.length}`);
  console.log(`  Vínculos sem businessUnitId:  ${linksNoBu.length}`);
  console.log(`  Vínculos com companyId inválido: ${invalidCompany.length}`);
  console.log(`  Duplicatas:                   ${duplicates.length}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (orphans.length === 0 && linksNoBu.length === 0 && invalidCompany.length === 0 && duplicates.length === 0) {
    console.log("\n✅ Banco íntegro — nenhum problema encontrado.");
  } else {
    console.log("\n⚠️  Problemas detectados — execute a migração de vínculos legados.");
  }

  await conn.end();
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
