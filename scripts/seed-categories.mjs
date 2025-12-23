import { drizzle } from "drizzle-orm/mysql2";
import { config } from "dotenv";

config();

const categories = [
  { name: "Serviços", description: "Fornecedores de serviços gerais", color: "#3B82F6" },
  { name: "Matérias-primas", description: "Fornecedores de matérias-primas e insumos", color: "#10B981" },
  { name: "Tecnologia", description: "Fornecedores de tecnologia e software", color: "#8B5CF6" },
  { name: "Logística", description: "Fornecedores de transporte e logística", color: "#F59E0B" },
  { name: "Equipamentos", description: "Fornecedores de máquinas e equipamentos", color: "#EF4444" },
  { name: "Consultoria", description: "Fornecedores de consultoria e assessoria", color: "#06B6D4" },
];

async function seedCategories() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in environment");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Inserting categories...");

  for (const category of categories) {
    try {
      await db.execute({
        sql: `INSERT INTO supplier_categories (name, description, color, createdAt, updatedAt) 
              VALUES (?, ?, ?, NOW(), NOW())
              ON DUPLICATE KEY UPDATE description = VALUES(description), color = VALUES(color)`,
        args: [category.name, category.description, category.color],
      });
      console.log(`✓ Category "${category.name}" inserted/updated`);
    } catch (error) {
      console.error(`✗ Error inserting "${category.name}":`, error);
    }
  }

  console.log("\nCategories seeded successfully!");
  process.exit(0);
}

seedCategories();
