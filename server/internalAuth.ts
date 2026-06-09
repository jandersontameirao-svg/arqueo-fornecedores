/**
 * Internal Authentication — Login por email/senha para usuários internos.
 * Preserva o fluxo OAuth existente. Não expõe senhas em logs/respostas.
 */
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, SESSION_TTL_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "./routers";

/**
 * Registra a rota POST /api/auth/login para login interno (email + senha).
 * O fluxo:
 * 1. Recebe email + password no body
 * 2. Busca usuário por email no banco
 * 3. Verifica se passwordHash existe (é usuário interno)
 * 4. Compara senha com bcrypt
 * 5. Cria session JWT e seta cookie (mesmo formato do OAuth)
 */
export function registerInternalAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios." });
        return;
      }

      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
        res.status(429).json({ error: "Muitas tentativas de login. Tente novamente em 15 minutos." });
        return;
      }

      // Buscar usuário por email
      const user = await db.getUserByEmail(email.trim().toLowerCase());

      if (!user) {
        // Mensagem genérica para não revelar se o email existe
        res.status(401).json({ error: "Credenciais inválidas." });
        return;
      }

      // Verificar se é um usuário interno (tem passwordHash)
      if (!user.passwordHash) {
        res.status(401).json({ error: "Credenciais inválidas." });
        return;
      }

      // Verificar se o usuário está ativo
      if (!user.isActive) {
        res.status(403).json({ error: "Conta desativada. Contate o administrador." });
        return;
      }

      // Comparar senha
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "Credenciais inválidas." });
        return;
      }

      // Atualizar lastSignedIn
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Criar session JWT (mesmo formato do OAuth)
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: SESSION_TTL_MS,
      });

      // Setar cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_TTL_MS });

      // Retornar dados do usuário (sem passwordHash)
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[InternalAuth] Login failed:", error);
      res.status(500).json({ error: "Erro interno. Tente novamente." });
    }
  });
}
