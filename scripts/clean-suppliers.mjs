/**
 * Script de limpeza: apaga todos os registros da tabela suppliers.
 * As tabelas filhas com onDelete: "cascade" são limpas automaticamente.
 * Tabelas preservadas: contratos, templates, categorias, empresas, usuários, etc.
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const db = await createConnection(process.env.DATABASE_URL);

try {
  // Contar antes
  const [[{ total }]] = await db.execute("SELECT COUNT(*) as total FROM suppliers");
  console.log(`Fornecedores antes da limpeza: ${total}`);

  if (total === 0) {
    console.log("Tabela já está vazia. Nenhuma ação necessária.");
    process.exit(0);
  }

  // Desabilitar FK checks temporariamente para garantir cascata limpa
  await db.execute("SET FOREIGN_KEY_CHECKS = 0");
  
  // Limpar tabelas filhas explicitamente (segurança extra)
  const childTables = [
    "supplier_company_links",
    "supplier_contacts",
    "supplier_documents",
    "supplier_evaluations",
    "supplier_links",
    "supplier_document_links",
  ];

  for (const table of childTables) {
    try {
      const [[{ count }]] = await db.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
      if (count > 0) {
        await db.execute(`DELETE FROM \`${table}\``);
        console.log(`  Limpou ${table}: ${count} registros removidos`);
      }
    } catch (e) {
      // Tabela pode não existir — ignorar
      console.log(`  Tabela ${table} não encontrada ou já vazia`);
    }
  }

  // Apagar os fornecedores
  const [result] = await db.execute("DELETE FROM suppliers");
  console.log(`Fornecedores removidos: ${result.affectedRows}`);

  await db.execute("SET FOREIGN_KEY_CHECKS = 1");

  // Confirmar
  const [[{ totalAfter }]] = await db.execute("SELECT COUNT(*) as totalAfter FROM suppliers");
  console.log(`Fornecedores após limpeza: ${totalAfter}`);

  if (totalAfter === 0) {
    console.log("✓ Limpeza concluída com sucesso.");
  } else {
    console.error("✗ Ainda há fornecedores na tabela. Verifique manualmente.");
    process.exit(1);
  }
} finally {
  await db.end();
}
