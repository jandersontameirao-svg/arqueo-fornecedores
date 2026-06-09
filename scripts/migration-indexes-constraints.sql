-- ============================================================================
-- Migration: Indexes, UNIQUE constraints, backfill, varchar->decimal
-- Gerada em 2026-06-09
-- IMPORTANTE: Executar com cuidado. Nenhum dado é excluido.
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICACAO DE DUPLICATAS (rodar ANTES das constraints UNIQUE)
-- Se alguma dessas queries retornar linhas, corrigir manualmente antes de
-- aplicar a PARTE 2.
-- ============================================================================

-- Verificar CNPJs duplicados em suppliers
SELECT cnpj, COUNT(*) as qty, GROUP_CONCAT(id) as ids
FROM suppliers
WHERE cnpj IS NOT NULL AND cnpj != ''
GROUP BY cnpj
HAVING COUNT(*) > 1;

-- Verificar vinculos duplicados em supplier_company_links
SELECT supplierId, companyId, COUNT(*) as qty, GROUP_CONCAT(id) as ids
FROM supplier_company_links
GROUP BY supplierId, companyId
HAVING COUNT(*) > 1;

-- ============================================================================
-- PARTE 2: INDEXES NAS FOREIGN KEYS (performance)
-- Seguro para rodar a qualquer momento. Apenas adiciona indexes.
-- ============================================================================

-- supplier_company_links
CREATE INDEX IF NOT EXISTS idx_scl_supplier ON supplier_company_links(supplierId);
CREATE INDEX IF NOT EXISTS idx_scl_company ON supplier_company_links(companyId);
CREATE INDEX IF NOT EXISTS idx_scl_business_unit ON supplier_company_links(businessUnitId);
CREATE INDEX IF NOT EXISTS idx_scl_status ON supplier_company_links(status);

-- suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(companyId);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(categoryId);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_group ON suppliers(organizationalGroupId);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- contracts
CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON contracts(supplierId);
CREATE INDEX IF NOT EXISTS idx_contracts_org_group ON contracts(organizationalGroupId);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_supplier ON documents(supplierId);
CREATE INDEX IF NOT EXISTS idx_documents_org_group ON documents(organizationalGroupId);
CREATE INDEX IF NOT EXISTS idx_documents_expires ON documents(expiresAt);

-- interactions
CREATE INDEX IF NOT EXISTS idx_interactions_supplier ON interactions(supplierId);
CREATE INDEX IF NOT EXISTS idx_interactions_org_group ON interactions(organizationalGroupId);

-- performance_evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_supplier ON performance_evaluations(supplierId);

-- approval_workflows
CREATE INDEX IF NOT EXISTS idx_workflows_supplier ON approval_workflows(supplierId);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON approval_workflows(status);

-- compliance_alerts
CREATE INDEX IF NOT EXISTS idx_alerts_supplier ON compliance_alerts(supplierId);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON compliance_alerts(isResolved);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_org_group ON audit_logs(organizationalGroupId);

-- contract_amendments
CREATE INDEX IF NOT EXISTS idx_amendments_contract ON contract_amendments(contractId);

-- financial_milestones
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON financial_milestones(contractId);
CREATE INDEX IF NOT EXISTS idx_milestones_amendment ON financial_milestones(amendmentId);

-- contract_versions
CREATE INDEX IF NOT EXISTS idx_versions_contract ON contract_versions(contractId);

-- contract_signers
CREATE INDEX IF NOT EXISTS idx_signers_contract ON contract_signers(contractId);

-- contract_clicksign_events
CREATE INDEX IF NOT EXISTS idx_clicksign_contract ON contract_clicksign_events(contractId);

-- supplier_contacts
CREATE INDEX IF NOT EXISTS idx_contacts_supplier ON supplier_contacts(supplierId);

-- supplier_links (legado)
CREATE INDEX IF NOT EXISTS idx_slinks_supplier ON supplier_links(supplierId);

-- user RBAC tables
CREATE INDEX IF NOT EXISTS idx_ugr_user ON user_group_roles(userId);
CREATE INDEX IF NOT EXISTS idx_ugr_group ON user_group_roles(organizationalGroupId);
CREATE INDEX IF NOT EXISTS idx_ucr_user ON user_company_roles(userId);
CREATE INDEX IF NOT EXISTS idx_ucr_group ON user_company_roles(organizationalGroupId);
CREATE INDEX IF NOT EXISTS idx_ubr_user ON user_business_unit_roles(userId);
CREATE INDEX IF NOT EXISTS idx_ubr_group ON user_business_unit_roles(organizationalGroupId);

-- template_fields
CREATE INDEX IF NOT EXISTS idx_tfields_template ON template_fields(templateId);

-- extraction_runs
CREATE INDEX IF NOT EXISTS idx_extraction_created ON extraction_runs(createdById);

-- extracted_fields
CREATE INDEX IF NOT EXISTS idx_extracted_run ON extracted_fields(extractionRunId);

-- ============================================================================
-- PARTE 3: CONSTRAINTS UNIQUE
-- SO RODAR se a PARTE 1 nao retornou duplicatas!
-- ============================================================================

-- CNPJ unico por fornecedor na base geral
ALTER TABLE suppliers ADD CONSTRAINT uq_suppliers_cnpj UNIQUE (cnpj);

-- Vinculo unico por par fornecedor+empresa
ALTER TABLE supplier_company_links ADD CONSTRAINT uq_scl_supplier_company UNIQUE (supplierId, companyId);

-- ============================================================================
-- PARTE 4: BACKFILL organizationalGroupId
-- Atribui grupo 1 (Grupo Arqueo Brasil) a todos os registros legados com NULL.
-- Nenhum dado é excluido - apenas preenche campos vazios.
-- ============================================================================

UPDATE suppliers SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;
UPDATE documents SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;
UPDATE contracts SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;
UPDATE interactions SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;
UPDATE performance_evaluations SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;
UPDATE contract_templates SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;

-- ============================================================================
-- PARTE 5: CONVERTER VARCHAR PARA DECIMAL (valores monetarios)
-- Converte strings de valores financeiros para tipo DECIMAL(15,2).
-- Dados existentes sao preservados - MySQL converte automaticamente strings
-- numericas validas. Strings vazias viram NULL.
-- ============================================================================

-- Limpar strings vazias antes da conversao (senao viram 0.00)
UPDATE contract_amendments SET valueChange = NULL WHERE valueChange = '';
UPDATE contract_amendments SET newTotalValue = NULL WHERE newTotalValue = '';
UPDATE financial_milestones SET paidValue = NULL WHERE paidValue = '';

-- Converter colunas
ALTER TABLE contract_amendments MODIFY COLUMN valueChange DECIMAL(15,2) NULL;
ALTER TABLE contract_amendments MODIFY COLUMN newTotalValue DECIMAL(15,2) NULL;
ALTER TABLE financial_milestones MODIFY COLUMN plannedValue DECIMAL(15,2) NOT NULL;
ALTER TABLE financial_milestones MODIFY COLUMN paidValue DECIMAL(15,2) NULL;
