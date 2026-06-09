/**
 * Script de migração: indexes, constraints, backfill e conversão decimal.
 * Execução: node scripts/run-migration.mjs
 *
 * SEGURO: nenhum dado é excluído. Apenas adiciona indexes, constraints,
 * preenche campos NULL e converte tipos.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("[Migration] DATABASE_URL não configurada.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("[Migration] Conectado ao banco de dados.\n");

  async function exec(label, sql) {
    try {
      await conn.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME" || err.message.includes("Duplicate key name")) {
        console.log(`  - ${label} (já existe)`);
      } else if (err.code === "ER_DUP_ENTRY") {
        console.error(`  ✗ ${label} — DUPLICATAS ENCONTRADAS. Corrija manualmente antes de aplicar.`);
        console.error(`    ${err.message}`);
      } else {
        console.error(`  ✗ ${label} — ${err.message}`);
      }
    }
  }

  // ── PARTE 1: Verificar duplicatas ──────────────────────────────────────
  console.log("═══ PARTE 1: Verificando duplicatas ═══");

  const [dupCnpj] = await conn.execute(`
    SELECT cnpj, COUNT(*) as qty, GROUP_CONCAT(id) as ids
    FROM suppliers WHERE cnpj IS NOT NULL AND cnpj != ''
    GROUP BY cnpj HAVING COUNT(*) > 1
  `);
  if (dupCnpj.length > 0) {
    console.log(`  ⚠ ${dupCnpj.length} CNPJs duplicados encontrados:`);
    dupCnpj.forEach(r => console.log(`    CNPJ ${r.cnpj}: IDs ${r.ids}`));
    console.log("  → Pulando constraint UNIQUE em suppliers.cnpj");
  } else {
    console.log("  ✓ Nenhum CNPJ duplicado");
  }

  const [dupLinks] = await conn.execute(`
    SELECT supplierId, companyId, COUNT(*) as qty, GROUP_CONCAT(id) as ids
    FROM supplier_company_links
    GROUP BY supplierId, companyId HAVING COUNT(*) > 1
  `);
  if (dupLinks.length > 0) {
    console.log(`  ⚠ ${dupLinks.length} vínculos duplicados encontrados:`);
    dupLinks.forEach(r => console.log(`    Supplier ${r.supplierId} + Company ${r.companyId}: IDs ${r.ids}`));
    console.log("  → Pulando constraint UNIQUE em supplier_company_links");
  } else {
    console.log("  ✓ Nenhum vínculo duplicado");
  }

  // ── PARTE 2: Indexes ──────────────────────────────────────────────────
  console.log("\n═══ PARTE 2: Criando indexes ═══");

  await exec("idx_scl_supplier", "CREATE INDEX idx_scl_supplier ON supplier_company_links(supplierId)");
  await exec("idx_scl_company", "CREATE INDEX idx_scl_company ON supplier_company_links(companyId)");
  await exec("idx_scl_business_unit", "CREATE INDEX idx_scl_business_unit ON supplier_company_links(businessUnitId)");
  await exec("idx_scl_status", "CREATE INDEX idx_scl_status ON supplier_company_links(status)");

  await exec("idx_suppliers_cnpj", "CREATE INDEX idx_suppliers_cnpj ON suppliers(cnpj)");
  await exec("idx_suppliers_company", "CREATE INDEX idx_suppliers_company ON suppliers(companyId)");
  await exec("idx_suppliers_category", "CREATE INDEX idx_suppliers_category ON suppliers(categoryId)");
  await exec("idx_suppliers_org_group", "CREATE INDEX idx_suppliers_org_group ON suppliers(organizationalGroupId)");
  await exec("idx_suppliers_status", "CREATE INDEX idx_suppliers_status ON suppliers(status)");

  await exec("idx_contracts_supplier", "CREATE INDEX idx_contracts_supplier ON contracts(supplierId)");
  await exec("idx_contracts_org_group", "CREATE INDEX idx_contracts_org_group ON contracts(organizationalGroupId)");
  await exec("idx_contracts_status", "CREATE INDEX idx_contracts_status ON contracts(status)");

  await exec("idx_documents_supplier", "CREATE INDEX idx_documents_supplier ON documents(supplierId)");
  await exec("idx_documents_org_group", "CREATE INDEX idx_documents_org_group ON documents(organizationalGroupId)");
  await exec("idx_documents_expires", "CREATE INDEX idx_documents_expires ON documents(expiresAt)");

  await exec("idx_interactions_supplier", "CREATE INDEX idx_interactions_supplier ON interactions(supplierId)");
  await exec("idx_interactions_org_group", "CREATE INDEX idx_interactions_org_group ON interactions(organizationalGroupId)");

  await exec("idx_evaluations_supplier", "CREATE INDEX idx_evaluations_supplier ON performance_evaluations(supplierId)");

  await exec("idx_workflows_supplier", "CREATE INDEX idx_workflows_supplier ON approval_workflows(supplierId)");
  await exec("idx_workflows_status", "CREATE INDEX idx_workflows_status ON approval_workflows(status)");

  await exec("idx_alerts_supplier", "CREATE INDEX idx_alerts_supplier ON compliance_alerts(supplierId)");
  await exec("idx_alerts_resolved", "CREATE INDEX idx_alerts_resolved ON compliance_alerts(isResolved)");

  await exec("idx_audit_entity", "CREATE INDEX idx_audit_entity ON audit_logs(entityType, entityId)");
  await exec("idx_audit_user", "CREATE INDEX idx_audit_user ON audit_logs(userId)");
  await exec("idx_audit_org_group", "CREATE INDEX idx_audit_org_group ON audit_logs(organizationalGroupId)");

  await exec("idx_amendments_contract", "CREATE INDEX idx_amendments_contract ON contract_amendments(contractId)");
  await exec("idx_milestones_contract", "CREATE INDEX idx_milestones_contract ON financial_milestones(contractId)");
  await exec("idx_milestones_amendment", "CREATE INDEX idx_milestones_amendment ON financial_milestones(amendmentId)");
  await exec("idx_versions_contract", "CREATE INDEX idx_versions_contract ON contract_versions(contractId)");
  await exec("idx_signers_contract", "CREATE INDEX idx_signers_contract ON contract_signers(contractId)");
  await exec("idx_clicksign_contract", "CREATE INDEX idx_clicksign_contract ON contract_clicksign_events(contractId)");
  await exec("idx_contacts_supplier", "CREATE INDEX idx_contacts_supplier ON supplier_contacts(supplierId)");
  await exec("idx_slinks_supplier", "CREATE INDEX idx_slinks_supplier ON supplier_links(supplierId)");

  await exec("idx_ugr_user", "CREATE INDEX idx_ugr_user ON user_group_roles(userId)");
  await exec("idx_ugr_group", "CREATE INDEX idx_ugr_group ON user_group_roles(organizationalGroupId)");
  await exec("idx_ucr_user", "CREATE INDEX idx_ucr_user ON user_company_roles(userId)");
  await exec("idx_ucr_group", "CREATE INDEX idx_ucr_group ON user_company_roles(organizationalGroupId)");
  await exec("idx_ubr_user", "CREATE INDEX idx_ubr_user ON user_business_unit_roles(userId)");
  await exec("idx_ubr_group", "CREATE INDEX idx_ubr_group ON user_business_unit_roles(organizationalGroupId)");

  await exec("idx_tfields_template", "CREATE INDEX idx_tfields_template ON template_fields(templateId)");
  await exec("idx_extraction_created", "CREATE INDEX idx_extraction_created ON extraction_runs(createdById)");
  await exec("idx_extracted_run", "CREATE INDEX idx_extracted_run ON extracted_fields(extractionRunId)");

  // ── PARTE 3: Constraints UNIQUE (só se não há duplicatas) ─────────────
  console.log("\n═══ PARTE 3: Constraints UNIQUE ═══");

  if (dupCnpj.length === 0) {
    await exec("UNIQUE suppliers.cnpj", "ALTER TABLE suppliers ADD CONSTRAINT uq_suppliers_cnpj UNIQUE (cnpj)");
  } else {
    console.log("  - Pulado: suppliers.cnpj (duplicatas existentes)");
  }

  if (dupLinks.length === 0) {
    await exec("UNIQUE supplier_company_links(supplierId,companyId)", "ALTER TABLE supplier_company_links ADD CONSTRAINT uq_scl_supplier_company UNIQUE (supplierId, companyId)");
  } else {
    console.log("  - Pulado: supplier_company_links (duplicatas existentes)");
  }

  // ── PARTE 4: Backfill organizationalGroupId ───────────────────────────
  console.log("\n═══ PARTE 4: Backfill organizationalGroupId ═══");

  const tables = ["suppliers", "documents", "contracts", "interactions", "performance_evaluations", "contract_templates"];
  for (const table of tables) {
    try {
      const [result] = await conn.execute(`UPDATE ${table} SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL`);
      console.log(`  ✓ ${table}: ${result.affectedRows} registros atualizados`);
    } catch (err) {
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }

  // ── PARTE 5: Converter varchar para decimal ───────────────────────────
  console.log("\n═══ PARTE 5: Converter valores monetários para DECIMAL ═══");

  await exec("Limpar valueChange vazio", "UPDATE contract_amendments SET valueChange = NULL WHERE valueChange = ''");
  await exec("Limpar newTotalValue vazio", "UPDATE contract_amendments SET newTotalValue = NULL WHERE newTotalValue = ''");
  await exec("Limpar paidValue vazio", "UPDATE financial_milestones SET paidValue = NULL WHERE paidValue = ''");
  await exec("Limpar plannedValue vazio", "UPDATE financial_milestones SET plannedValue = NULL WHERE plannedValue = ''");

  await exec("contract_amendments.valueChange → DECIMAL", "ALTER TABLE contract_amendments MODIFY COLUMN valueChange DECIMAL(15,2) NULL");
  await exec("contract_amendments.newTotalValue → DECIMAL", "ALTER TABLE contract_amendments MODIFY COLUMN newTotalValue DECIMAL(15,2) NULL");
  await exec("financial_milestones.plannedValue → DECIMAL", "ALTER TABLE financial_milestones MODIFY COLUMN plannedValue DECIMAL(15,2) NOT NULL DEFAULT 0");
  await exec("financial_milestones.paidValue → DECIMAL", "ALTER TABLE financial_milestones MODIFY COLUMN paidValue DECIMAL(15,2) NULL");

  // ── Fim ────────────────────────────────────────────────────────────────
  console.log("\n═══ Migração concluída ═══");
  await conn.end();
  process.exit(0);
}

run().catch(err => {
  console.error("[Migration] Erro fatal:", err.message);
  process.exit(1);
});
