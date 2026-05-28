/**
 * diagnose-links.mjs — Diagnóstico completo de integridade dos vínculos fornecedor-empresa
 * SOMENTE LEITURA. Não altera dados.
 * 
 * Relatórios:
 * 1. Vínculos canônicos ativos (supplier_company_links)
 * 2. Fornecedores órfãos (companyId legado sem vínculo canônico)
 * 3. Contagem por empresa (companyId numérico)
 * 4. Contagem por área de negócio (businessUnitId)
 * 5. Vínculos duplicados (mesmo supplierId+companyId)
 * 6. Vínculos sem businessUnitId (inconsistência)
 * 7. Fornecedores totalmente desvinculados
 * 8. Vínculos com companyId inválido
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

  // 1. Vínculos canônicos ativos
  const [canonical] = await conn.query(`
    SELECT scl.supplierId, s.companyName AS fornecedor, scl.companyId, c.legalName AS empresa,
           scl.businessUnitId, scl.status, scl.categoryId, scl.criticality
    FROM supplier_company_links scl
    JOIN suppliers s ON s.id = scl.supplierId
    LEFT JOIN companies c ON c.id = scl.companyId
    WHERE scl.status = 'active'
    ORDER BY scl.supplierId, scl.companyId
  `);
  console.log(`📋 1. VÍNCULOS CANÔNICOS ATIVOS: ${canonical.length}`);
  if (canonical.length > 0) {
    console.table(canonical.map(r => ({
      supplierId: r.supplierId,
      fornecedor: r.fornecedor,
      companyId: r.companyId,
      empresa: r.empresa,
      businessUnitId: r.businessUnitId,
      categoryId: r.categoryId,
      criticality: r.criticality,
    })));
  } else {
    console.log("   (nenhum vínculo ativo)");
  }
  console.log("");

  // 2. Fornecedores órfãos (companyId legado sem vínculo canônico)
  const [orphans] = await conn.query(`
    SELECT s.id, s.companyName, s.companyId AS legacyCompanyId, s.groupId
    FROM suppliers s
    WHERE s.companyId IS NOT NULL AND s.companyId != ''
    AND NOT EXISTS (
      SELECT 1 FROM supplier_company_links scl WHERE scl.supplierId = s.id AND scl.status = 'active'
    )
  `);
  console.log(`⚠️  2. FORNECEDORES ÓRFÃOS (companyId legado sem vínculo canônico): ${orphans.length}`);
  if (orphans.length > 0) {
    console.table(orphans);
  } else {
    console.log("   ✅ Nenhum órfão");
  }
  console.log("");

  // 3. Contagem por empresa (companyId numérico)
  const [byCompany] = await conn.query(`
    SELECT scl.companyId, c.legalName AS empresa, COUNT(DISTINCT scl.supplierId) AS total
    FROM supplier_company_links scl
    LEFT JOIN companies c ON c.id = scl.companyId
    WHERE scl.status = 'active'
    GROUP BY scl.companyId, c.legalName
    ORDER BY total DESC
  `);
  console.log(`📊 3. CONTAGEM POR EMPRESA (fonte canônica):`);
  if (byCompany.length > 0) {
    console.table(byCompany);
  } else {
    console.log("   (nenhum vínculo ativo)");
  }
  console.log("");

  // 4. Contagem por área de negócio (businessUnitId)
  const [byBU] = await conn.query(`
    SELECT scl.businessUnitId, bu.name AS areaNegocio, COUNT(DISTINCT scl.supplierId) AS total
    FROM supplier_company_links scl
    LEFT JOIN business_units bu ON bu.id = scl.businessUnitId
    WHERE scl.status = 'active'
    GROUP BY scl.businessUnitId, bu.name
    ORDER BY total DESC
  `);
  console.log(`📊 4. CONTAGEM POR ÁREA DE NEGÓCIO (fonte canônica):`);
  if (byBU.length > 0) {
    console.table(byBU);
  } else {
    console.log("   (nenhum vínculo ativo)");
  }
  console.log("");

  // 5. Vínculos duplicados (mesmo supplierId+companyId)
  const [dupes] = await conn.query(`
    SELECT supplierId, companyId, COUNT(*) AS duplicatas
    FROM supplier_company_links
    WHERE status = 'active'
    GROUP BY supplierId, companyId
    HAVING COUNT(*) > 1
  `);
  console.log(`🔁 5. VÍNCULOS DUPLICADOS: ${dupes.length}`);
  if (dupes.length > 0) {
    console.table(dupes);
  } else {
    console.log("   ✅ Nenhuma duplicata");
  }
  console.log("");

  // 6. Vínculos sem businessUnitId (inconsistência)
  const [noBU] = await conn.query(`
    SELECT scl.id, scl.supplierId, s.companyName, scl.companyId
    FROM supplier_company_links scl
    JOIN suppliers s ON s.id = scl.supplierId
    WHERE scl.status = 'active' AND (scl.businessUnitId IS NULL OR scl.businessUnitId = 0)
  `);
  console.log(`❌ 6. VÍNCULOS SEM businessUnitId: ${noBU.length}`);
  if (noBU.length > 0) {
    console.table(noBU);
  } else {
    console.log("   ✅ Todos os vínculos têm businessUnitId");
  }
  console.log("");

  // 7. Fornecedores totalmente desvinculados
  const [unlinked] = await conn.query(`
    SELECT s.id, s.companyName, s.cnpj, s.status
    FROM suppliers s
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_company_links scl WHERE scl.supplierId = s.id AND scl.status = 'active'
    )
    AND (s.companyId IS NULL OR s.companyId = '')
  `);
  console.log(`🚫 7. FORNECEDORES TOTALMENTE DESVINCULADOS: ${unlinked.length}`);
  if (unlinked.length > 0) {
    console.table(unlinked);
  } else {
    console.log("   ✅ Todos os fornecedores têm pelo menos um vínculo");
  }
  console.log("");

  // 8. Vínculos com companyId inválido
  const [invalidCompany] = await conn.query(`
    SELECT scl.id, scl.supplierId, scl.companyId, s.companyName
    FROM supplier_company_links scl
    LEFT JOIN suppliers s ON s.id = scl.supplierId
    WHERE scl.companyId NOT IN (SELECT id FROM companies)
  `);
  console.log(`❌ 8. VÍNCULOS COM companyId INVÁLIDO: ${invalidCompany.length}`);
  if (invalidCompany.length > 0) {
    console.table(invalidCompany);
  } else {
    console.log("   ✅ Todos os companyId são válidos");
  }
  console.log("");

  // Resumo final
  const [[{ total: totalSuppliers }]] = await conn.query("SELECT COUNT(*) as total FROM suppliers");
  const [[{ total: totalLinks }]] = await conn.query("SELECT COUNT(*) as total FROM supplier_company_links WHERE status = 'active'");
  const [[{ total: totalCompanies }]] = await conn.query("SELECT COUNT(*) as total FROM companies");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  RESUMO FINAL");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Fornecedores totais:             ${totalSuppliers}`);
  console.log(`  Vínculos canônicos ativos:       ${totalLinks}`);
  console.log(`  Empresas cadastradas:            ${totalCompanies}`);
  console.log(`  Órfãos (legado sem vínculo):     ${orphans.length}`);
  console.log(`  Desvinculados (sem nada):        ${unlinked.length}`);
  console.log(`  Duplicatas:                      ${dupes.length}`);
  console.log(`  Sem businessUnitId:              ${noBU.length}`);
  console.log(`  companyId inválido:              ${invalidCompany.length}`);
  console.log("═══════════════════════════════════════════════════════════════");

  const hasIssues = orphans.length > 0 || unlinked.length > 0 || dupes.length > 0 || noBU.length > 0 || invalidCompany.length > 0;
  if (!hasIssues) {
    console.log("\n✅ BANCO ÍNTEGRO — nenhum problema encontrado.");
  } else {
    console.log("\n⚠️  PROBLEMAS DETECTADOS — execute backfill-links.mjs para corrigir.");
  }

  await conn.end();
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
