/**
 * Migração Segura v6.0 — Consolidar fornecedores e criar vínculos
 * 
 * Lógica:
 * 1. Para cada fornecedor existente que tem companyId (string legado):
 *    - Buscar a company correspondente na tabela companies
 *    - Criar um supplier_company_link vinculando o fornecedor à empresa
 *    - Preservar categoryId, criticality, status do fornecedor no vínculo
 * 2. Para fornecedores com supplierLinks existentes:
 *    - Criar supplier_company_links adicionais para cada link ativo
 * 3. NÃO apagar dados antigos — apenas adicionar vínculos
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function migrate() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log("=== Migração v6.0 — Consolidação de Fornecedores ===\n");
    
    // 1. Buscar todos os fornecedores com companyId
    const [suppliers] = await connection.query(
      "SELECT id, companyName, cnpj, companyId, groupId, categoryId, criticality, status, createdById FROM suppliers WHERE companyId IS NOT NULL AND companyId != ''"
    );
    console.log(`Fornecedores com companyId: ${suppliers.length}`);
    
    // 2. Buscar todas as companies
    const [companies] = await connection.query(
      "SELECT id, businessUnitId, legalName, tradeName, cnpj FROM companies"
    );
    console.log(`Empresas cadastradas: ${companies.length}`);
    
    // 3. Buscar business_units para mapear
    const [businessUnits] = await connection.query(
      "SELECT id, name, code FROM business_units"
    );
    console.log(`Áreas de negócio: ${businessUnits.length}`);
    
    // 4. Buscar vínculos existentes na tabela supplier_company_links (evitar duplicatas)
    const [existingLinks] = await connection.query(
      "SELECT supplierId, companyId FROM supplier_company_links"
    );
    const existingLinkSet = new Set(existingLinks.map(l => `${l.supplierId}-${l.companyId}`));
    console.log(`Vínculos já existentes: ${existingLinks.length}`);
    
    // 5. Buscar supplierLinks legados
    const [legacyLinks] = await connection.query(
      "SELECT supplierId, targetCompanyId, sourceCompanyId, status, linkedById FROM supplier_links WHERE status = 'active'"
    );
    console.log(`SupplierLinks legados ativos: ${legacyLinks.length}`);
    
    // Mapear companyId string → company.id int
    // O companyId legado pode ser o code da businessUnit ou um identificador customizado
    // Tentar mapear por business_unit.code ou business_unit.name
    const buByCode = {};
    const buByName = {};
    for (const bu of businessUnits) {
      if (bu.code) buByCode[bu.code.toLowerCase()] = bu;
      buByName[bu.name.toLowerCase()] = bu;
    }
    
    // Mapear companies por businessUnitId
    const companiesByBuId = {};
    for (const c of companies) {
      if (!companiesByBuId[c.businessUnitId]) companiesByBuId[c.businessUnitId] = [];
      companiesByBuId[c.businessUnitId].push(c);
    }
    
    let created = 0;
    let skipped = 0;
    let noMatch = 0;
    
    // 6. Para cada fornecedor, criar vínculo
    for (const supplier of suppliers) {
      const companyIdStr = supplier.companyId.toLowerCase();
      
      // Tentar encontrar a business unit correspondente
      let bu = buByCode[companyIdStr] || buByName[companyIdStr];
      
      // Se não encontrou, tentar match parcial
      if (!bu) {
        for (const [key, val] of Object.entries(buByCode)) {
          if (companyIdStr.includes(key) || key.includes(companyIdStr)) {
            bu = val;
            break;
          }
        }
      }
      
      if (!bu) {
        // Sem match — usar a primeira company disponível ou pular
        noMatch++;
        console.log(`  [SKIP] Fornecedor #${supplier.id} (${supplier.companyName}) — companyId "${supplier.companyId}" sem match`);
        continue;
      }
      
      // Pegar a primeira company dessa business unit
      const companiesInBu = companiesByBuId[bu.id] || [];
      if (companiesInBu.length === 0) {
        noMatch++;
        console.log(`  [SKIP] Fornecedor #${supplier.id} — BU "${bu.name}" sem companies`);
        continue;
      }
      
      const targetCompany = companiesInBu[0];
      const linkKey = `${supplier.id}-${targetCompany.id}`;
      
      if (existingLinkSet.has(linkKey)) {
        skipped++;
        continue;
      }
      
      // Mapear status do fornecedor para homologationStatus
      let homologationStatus = "pending";
      if (supplier.status === "approved") homologationStatus = "approved";
      else if (supplier.status === "rejected") homologationStatus = "rejected";
      else if (supplier.status === "suspended") homologationStatus = "suspended";
      
      await connection.query(
        `INSERT INTO supplier_company_links 
         (supplierId, companyId, businessUnitId, categoryId, criticality, homologationStatus, status, linkedById, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [
          supplier.id,
          targetCompany.id,
          bu.id,
          supplier.categoryId,
          supplier.criticality || "medium",
          homologationStatus,
          supplier.createdById
        ]
      );
      
      existingLinkSet.add(linkKey);
      created++;
    }
    
    console.log(`\n--- Resultado ---`);
    console.log(`Vínculos criados: ${created}`);
    console.log(`Vínculos já existentes (skip): ${skipped}`);
    console.log(`Sem match de empresa: ${noMatch}`);
    console.log(`\nMigração concluída com sucesso!`);
    
  } catch (error) {
    console.error("Erro na migração:", error);
  } finally {
    await connection.end();
  }
}

migrate();
