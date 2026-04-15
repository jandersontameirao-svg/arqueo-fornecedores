import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const units = [
  {
    name: "Grupo Arqueo Brasil",
    code: "Brasil",
    description: "Operações do Grupo Arqueo no Brasil, abrangendo todas as empresas e unidades de negócio nacionais.",
    status: "active",
  },
  {
    name: "Grupo Arqueo Africa",
    code: "África",
    description: "Operações do Grupo Arqueo no continente africano, incluindo projetos e empresas em países da África.",
    status: "active",
  },
  {
    name: "Foods and Drinks",
    code: "F&D",
    description: "Divisão de alimentos e bebidas do Grupo Arqueo, englobando empresas do setor alimentício e de bebidas.",
    status: "active",
  },
];

for (const unit of units) {
  // Check if already exists
  const [existing] = await conn.execute(
    "SELECT id FROM business_units WHERE name = ?",
    [unit.name]
  );
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`Área "${unit.name}" já existe (id=${existing[0].id}), pulando...`);
    continue;
  }

  const [result] = await conn.execute(
    "INSERT INTO business_units (name, code, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
    [unit.name, unit.code, unit.description, unit.status]
  );
  console.log(`✅ Área "${unit.name}" criada com id=${result.insertId}`);
}

await conn.end();
console.log("\n🎉 Áreas de negócio do Grupo Arqueo cadastradas com sucesso!");
