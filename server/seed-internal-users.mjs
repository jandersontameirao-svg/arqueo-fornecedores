/**
 * Seed idempotente para criar/atualizar os dois usuários internos.
 * Execução: node server/seed-internal-users.mjs
 * 
 * Regras:
 * - Identifica usuários pelo email como chave lógica única.
 * - Se o usuário já existir: atualiza role e passwordHash se necessário.
 * - Não duplica registros.
 * - Não corrompe dados existentes.
 * - Senhas armazenadas com bcrypt (salt rounds = 12).
 * - Não expõe senhas em logs ou respostas.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Import schema
import { users } from "../drizzle/schema.ts";

const SALT_ROUNDS = 12;

const INTERNAL_USERS = [
  {
    name: "Gente e Gestão",
    email: "gentegestao@grupoarqueo.com.br",
    password: "grupoarqueo2026",
    role: "manager",
    loginMethod: "internal",
  },
  {
    name: "Fernanda",
    email: "fernanda@arqueoproject.com.br",
    password: "kesulindo123",
    role: "admin",
    loginMethod: "internal",
  },
];

async function seedInternalUsers() {
  if (!process.env.DATABASE_URL) {
    console.error("[Seed] DATABASE_URL não configurada.");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  console.log("[Seed] Conectado ao banco de dados.");

  for (const userData of INTERNAL_USERS) {
    const { name, email, password, role, loginMethod } = userData;

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Verificar se o usuário já existe por email
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
      // Atualizar role, passwordHash e loginMethod se necessário
      const user = existing[0];
      const updates = {};
      if (user.role !== role) updates.role = role;
      if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        updates.passwordHash = passwordHash;
      }
      if (user.loginMethod !== loginMethod) updates.loginMethod = loginMethod;
      if (user.name !== name) updates.name = name;

      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, user.id));
        console.log(`[Seed] Usuário "${email}" atualizado (campos: ${Object.keys(updates).join(", ")}).`);
      } else {
        console.log(`[Seed] Usuário "${email}" já está atualizado. Nenhuma alteração.`);
      }
    } else {
      // Criar novo usuário com openId interno
      const openId = `internal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await db.insert(users).values({
        openId,
        name,
        email,
        loginMethod,
        passwordHash,
        role,
        isActive: true,
        lastSignedIn: new Date(),
      });
      console.log(`[Seed] Usuário "${email}" criado com role "${role}".`);
    }
  }

  console.log("[Seed] Concluído. Nenhuma senha exposta.");
  process.exit(0);
}

seedInternalUsers().catch((err) => {
  console.error("[Seed] Erro:", err.message);
  process.exit(1);
});
