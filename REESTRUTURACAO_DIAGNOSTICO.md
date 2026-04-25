# Diagnóstico — Reestruturação v6.0

## Estado Atual do Sistema

### Schema (18 tabelas)
- users, supplierCategories, suppliers, supplierContacts, documents
- approvalWorkflows, approvalSteps, auditLogs, interactions, performanceEvaluations
- complianceAlerts, contracts, contractItems, contractTemplates, contractAmendments
- financialMilestones, businessUnits, companies, supplierLinks
- documentExpirationNotifications, contractExpirationNotifications
- contractVersions, contractSigners, contractClicksignEvents

### Modelo Atual de Fornecedores
- suppliers.companyId (varchar) = empresa estática (ex: "arqueogis-preventiva")
- suppliers.groupId (int FK → businessUnits.id) = grupo/área de negócio
- supplierLinks = vínculo entre empresas do mesmo grupo
- Problema: fornecedor é "propriedade" de uma empresa, não da base geral

### O que precisa mudar (schema)
1. Separar dados gerais do fornecedor (base geral) dos dados de vínculo
2. Mover categoryId, criticality, companyId, groupId, status, approvedAt, approvedById, notes para a tabela de vínculos
3. Criar tabela supplier_company_links com dados específicos do vínculo
4. Manter suppliers como base geral (CNPJ único)

### Páginas Frontend (17 páginas)
- Home, SelectBusinessUnit, SelectCompany
- Suppliers, SupplierDetail, SupplierForm, SupplierLink
- Categories, Documents, Approvals, Compliance
- Interactions, Evaluations, Audit, Users, Reports
- ContractTemplates, Onboarding

### Navegação Atual
- DashboardLayout com sidebar (precisa ser substituído por topbar + nav horizontal)

### Integrações Existentes (PRESERVAR)
- Clicksign (assinatura digital de contratos)
- LLM (extração de dados de documentos, auto-preenchimento de contratos)
- S3 (armazenamento de arquivos)
- OAuth (autenticação)
- Notificações (expiração de documentos e contratos)

### Fluxos Existentes (PRESERVAR)
- Upload de documentos com S3
- Workflow de aprovação
- Auditoria completa
- Avaliações de desempenho
- Interações com fornecedores
- Contratos com Clicksign
- Templates de contratos
- Aditivos contratuais
- Marcos financeiros
- Vinculação entre empresas (supplierLinks)
- Onboarding público
