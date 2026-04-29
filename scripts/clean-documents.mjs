/**
 * Script de limpeza: apaga todos os registros da tabela documents e relacionadas.
 * Preservado: contratos, templates, fornecedores (já limpos), categorias, empresas, usuários.
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const db = await createConnection(process.env.DATABASE_URL);

try {
  const [[{ total }]] = await db.execute("SELECT COUNT(*) as total FROM documents");
  console.log(`Documentos antes da limpeza: ${total}`);

  if (total === 0) {
    console.log("Tabela já está vazia.");
    process.exit(0);
  }

  await db.execute("SET FOREIGN_KEY_CHECKS = 0");

  // Tabelas filhas de documents
  const childTables = [
    "supplier_document_links",
    "document_expiration_notifications",
  ];

  for (const table of childTables) {
    try {
      const [[{ count }]] = await db.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
      if (count > 0) {
        await db.execute(`DELETE FROM \`${table}\``);
        console.log(`  Limpou ${table}: ${count} registros removidos`);
      } else {
        console.log(`  ${table}: já vazia`);
      }
    } catch (e) {
      console.log(`  Tabela ${table} não encontrada`);
    }
  }

  const [result] = await db.execute("DELETE FROM documents");
  console.log(`Documentos removidos: ${result.affectedRows}`);

  await db.execute("SET FOREIGN_KEY_CHECKS = 1");

  const [[{ totalAfter }]] = await db.execute("SELECT COUNT(*) as totalAfter FROM documents");
  console.log(`Documentos após limpeza: ${totalAfter}`);

  if (totalAfter === 0) {
    console.log("✓ Limpeza concluída com sucesso.");
  } else {
    console.error("✗ Ainda há documentos na tabela.");
    process.exit(1);
  }
} finally {
  await db.end();
}
