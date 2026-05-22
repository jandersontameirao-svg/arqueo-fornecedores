/**
 * Script para definir senha do administrador para deploy externo.
 * 
 * Uso:
 *   DATABASE_URL="mysql://..." node scripts/set-admin-password.mjs <email> <senha>
 * 
 * Exemplo:
 *   DATABASE_URL="mysql://user:pass@host:3306/db" node scripts/set-admin-password.mjs jandersontameirao@gmail.com MinhaS3nha!
 */

import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const [,, email, password] = process.argv;

if (!email || !password) {
  console.error("Uso: node scripts/set-admin-password.mjs <email> <senha>");
  console.error("Exemplo: node scripts/set-admin-password.mjs admin@email.com MinhaSenha123");
  process.exit(1);
}

if (password.length < 6) {
  console.error("ERRO: Senha deve ter pelo menos 6 caracteres.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERRO: DATABASE_URL não está definida.");
  console.error("Defina: export DATABASE_URL='mysql://user:pass@host:3306/db'");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(databaseUrl);
  
  try {
    // Verificar se o usuário existe
    const [rows] = await connection.execute(
      "SELECT id, name, email, role, globalRole, loginMethod FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    
    if (rows.length === 0) {
      console.error(`ERRO: Usuário com email "${email}" não encontrado no banco.`);
      process.exit(1);
    }
    
    const user = rows[0];
    console.log(`\nUsuário encontrado:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Nome: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Global Role: ${user.globalRole}`);
    console.log(`  Login Method: ${user.loginMethod}`);
    
    // Gerar hash
    const hash = await bcrypt.hash(password, 12);
    
    // Atualizar senha e loginMethod
    await connection.execute(
      "UPDATE users SET passwordHash = ?, loginMethod = 'internal', updatedAt = NOW() WHERE id = ?",
      [hash, user.id]
    );
    
    console.log(`\n✓ Senha definida com sucesso para ${user.email}`);
    console.log(`✓ Login method atualizado para 'internal'`);
    console.log(`\nAgora você pode fazer login em /login com:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Senha: (a que você definiu)`);
    
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error("ERRO:", err.message);
  process.exit(1);
});
