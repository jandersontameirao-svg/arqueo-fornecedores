/**
 * Seed Companies v6.0 — Popular tabela companies com as empresas do Grupo Arqueo
 * e depois criar vínculos para fornecedores existentes.
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Empresas do Grupo Arqueo Brasil (businessUnitId = 1)
const COMPANIES = [
  {
    businessUnitId: 1,
    legalName: "Arqueogis Preventiva",
    tradeName: "Arqueogis Preventiva",
    cnpj: null,
    legacyId: "arqueogis-preventiva",
  },
  {
    businessUnitId: 1,
    legalName: "Arqueoproject",
    tradeName: "Arqueoproject",
    cnpj: null,
    legacyId: "arqueoproject",
  },
  {
    businessUnitId: 1,
    legalName: "Arqueogis Geoprocessamento",
    tradeName: "Arqueogis Geoprocessamento",
    cnpj: null,
    legacyId: "arqueogis-geoprocessamento",
  },
];

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log("=== Seed Companies v6.0 ===\n");

    // 1. Inserir companies (se não existirem)
    for (const company of COMPANIES) {
      const [existing] = await connection.query(
        "SELECT id FROM companies WHERE legalName = ? AND businessUnitId = ?",
        [company.legalName, company.businessUnitId]
      );

      if (existing.length > 0) {
        company.dbId = existing[0].id;
        console.log(`  [EXISTS] ${company.legalName} → id=${company.dbId}`);
      } else {
        const [result] = await connection.query(
          `INSERT INTO companies (businessUnitId, legalName, tradeName, cnpj, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
          [company.businessUnitId, company.legalName, company.tradeName, company.cnpj]
        );
        company.dbId = result.insertId;
        console.log(`  [CREATED] ${company.legalName} → id=${company.dbId}`);
      }
    }

    // 2. Mapear legacyId → dbId
    const legacyToDbId = {};
    for (const c of COMPANIES) {
      legacyToDbId[c.legacyId] = c.dbId;
    }
    console.log("\nMapa legacyId → dbId:", legacyToDbId);

    // 3. Buscar fornecedores com companyId legado
    const [suppliers] = await connection.query(
      "SELECT id, companyName, cnpj, companyId, groupId, categoryId, criticality, status, createdById FROM suppliers WHERE companyId IS NOT NULL AND companyId != ''"
    );
    console.log(`\nFornecedores com companyId: ${suppliers.length}`);

    // 4. Buscar vínculos existentes
    const [existingLinks] = await connection.query(
      "SELECT supplierId, companyId FROM supplier_company_links"
    );
    const existingLinkSet = new Set(existingLinks.map(l => `${l.supplierId}-${l.companyId}`));

    let created = 0;
    let skipped = 0;
    let noMatch = 0;

    for (const supplier of suppliers) {
      const companyDbId = legacyToDbId[supplier.companyId];
      if (!companyDbId) {
        noMatch++;
        console.log(`  [NO MATCH] Fornecedor #${supplier.id} (${supplier.companyName}) — companyId "${supplier.companyId}"`);
        continue;
      }

      const linkKey = `${supplier.id}-${companyDbId}`;
      if (existingLinkSet.has(linkKey)) {
        skipped++;
        continue;
      }

      // Mapear status → homologationStatus
      let homologationStatus = "pending";
      if (supplier.status === "approved") homologationStatus = "approved";
      else if (supplier.status === "rejected") homologationStatus = "rejected";
      else if (supplier.status === "suspended") homologationStatus = "suspended";

      // Buscar businessUnitId da company
      const company = COMPANIES.find(c => c.dbId === companyDbId);
      const buId = company ? company.businessUnitId : null;

      await connection.query(
        `INSERT INTO supplier_company_links 
         (supplierId, companyId, businessUnitId, categoryId, criticality, homologationStatus, status, linkedById, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [
          supplier.id,
          companyDbId,
          buId,
          supplier.categoryId,
          supplier.criticality || "medium",
          homologationStatus,
          supplier.createdById
        ]
      );

      existingLinkSet.add(linkKey);
      created++;
      console.log(`  [LINKED] Fornecedor #${supplier.id} (${supplier.companyName}) → Company #${companyDbId}`);
    }

    // 5. Processar supplierLinks legados
    const [legacyLinks] = await connection.query(
      "SELECT sl.*, s.categoryId, s.criticality, s.status as supplierStatus, s.createdById FROM supplier_links sl JOIN suppliers s ON sl.supplierId = s.id WHERE sl.status = 'active'"
    );
    console.log(`\nSupplierLinks legados: ${legacyLinks.length}`);

    let legacyCreated = 0;
    for (const link of legacyLinks) {
      const targetDbId = legacyToDbId[link.targetCompanyId];
      if (!targetDbId) continue;

      const linkKey = `${link.supplierId}-${targetDbId}`;
      if (existingLinkSet.has(linkKey)) continue;

      let homologationStatus = "pending";
      if (link.supplierStatus === "approved") homologationStatus = "approved";

      const company = COMPANIES.find(c => c.dbId === targetDbId);
      const buId = company ? company.businessUnitId : null;

      await connection.query(
        `INSERT INTO supplier_company_links 
         (supplierId, companyId, businessUnitId, categoryId, criticality, homologationStatus, status, linkedById, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [
          link.supplierId,
          targetDbId,
          buId,
          link.categoryId,
          link.criticality || "medium",
          homologationStatus,
          link.linkedById
        ]
      );

      existingLinkSet.add(linkKey);
      legacyCreated++;
    }

    console.log(`\n--- Resultado ---`);
    console.log(`Companies criadas: ${COMPANIES.filter(c => c.dbId).length}`);
    console.log(`Vínculos diretos criados: ${created}`);
    console.log(`Vínculos legados criados: ${legacyCreated}`);
    console.log(`Sem match: ${noMatch}`);
    console.log(`Já existentes (skip): ${skipped}`);
    console.log(`\nMigração concluída com sucesso!`);

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await connection.end();
  }
}

seed();
