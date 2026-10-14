// ============================================================================
// API REST pública de Fornecedores — /api/v1
//
// Camada fina sobre as mesmas funções de banco usadas pela tRPC, pensada para
// integração server-to-server (ex.: o connector AtenaOS / Cloudflare Worker).
// Autenticação por chave estática no header, lida de process.env.API_KEY:
//   Authorization: Bearer <API_KEY>      (preferido)
//   x-api-key: <API_KEY>                 (alternativa)
//
// Diferente da tRPC (cookie de sessão, método/encoding específicos), aqui é
// JSON REST puro: GET/POST/PUT/DELETE com corpo JSON comum.
// ============================================================================
import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as db from "./db";

const API_KEY = process.env.API_KEY ?? "";
const ACTOR_EMAIL = "api:atena-connector";

// Comparação em tempo constante (evita timing attack na chave).
function keysMatch(provided: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(API_KEY);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function extractKey(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }
  const x = req.headers["x-api-key"];
  if (typeof x === "string" && x.trim()) return x.trim();
  return null;
}

// Middleware de autenticação por chave.
function requireApiKey(req: Request, res: Response, next: () => void) {
  if (!API_KEY) {
    res.status(503).json({
      error: "api_key_not_configured",
      message: "API_KEY não configurada no servidor.",
    });
    return;
  }
  const key = extractKey(req);
  if (!key || !keysMatch(key)) {
    res.status(401).json({
      error: "unauthorized",
      message: "Chave de API ausente ou inválida. Envie em 'Authorization: Bearer <chave>' ou 'x-api-key'.",
    });
    return;
  }
  next();
}

// Normaliza um registro de fornecedor para o formato público estável.
// Aceita tanto a linha crua quanto o shape { supplier, category } do getById/list.
function toPublic(row: any) {
  const s = row?.supplier ?? row;
  if (!s) return null;
  return {
    id: s.id,
    nome: s.companyName,
    nomeFantasia: s.tradeName ?? null,
    documento: s.cnpj,
    email: s.email ?? null,
    telefone: s.phone ?? null,
    status: s.status,
    criticidade: s.criticality ?? null,
    cidade: s.city ?? null,
    estado: s.state ?? null,
    criadoEm: s.createdAt ?? null,
    atualizadoEm: s.updatedAt ?? null,
  };
}

function toContact(c: any) {
  return {
    id: c.id,
    nome: c.name ?? null,
    cargo: c.role ?? c.position ?? null,
    email: c.email ?? null,
    telefone: c.phone ?? null,
  };
}

// Auditoria best-effort: nunca derruba a escrita se o log falhar.
async function audit(action: string, entityId: number, changes?: any) {
  try {
    await db.createAuditLog({
      entityType: "supplier",
      entityId,
      action: action as any,
      changes,
      userId: null as any,
      userEmail: ACTOR_EMAIL,
    } as any);
  } catch {
    /* ignora: auditoria não deve bloquear a API */
  }
}

const createSchema = z.object({
  nome: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  nomeFantasia: z.string().optional(),
  tradeName: z.string().optional(),
  documento: z.string().optional(),
  cnpj: z.string().optional(),
  email: z.string().email(),
  telefone: z.string().optional(),
  phone: z.string().optional(),
  criticidade: z.enum(["low", "medium", "high", "critical"]).optional(),
  criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
  cidade: z.string().optional(),
  city: z.string().optional(),
  estado: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

// Aceita campos em pt-BR (nome/documento/…) ou os nomes internos (companyName/cnpj/…).
function mapInput(b: z.infer<typeof createSchema>) {
  const companyName = b.companyName ?? b.nome;
  const cnpjRaw = b.cnpj ?? b.documento;
  return {
    companyName,
    tradeName: b.tradeName ?? b.nomeFantasia,
    cnpj: cnpjRaw ? cnpjRaw.replace(/[.\/\-\s]/g, "") : undefined,
    email: b.email,
    phone: b.phone ?? b.telefone,
    criticality: (b.criticality ?? b.criticidade) as any,
    city: b.city ?? b.cidade,
    state: b.state ?? b.estado,
    notes: b.notes,
  };
}

export function registerPublicApiRoutes(app: Express) {
  // Health check (exige chave, igual às demais rotas).
  app.get("/api/v1/ping", requireApiKey, (_req, res) => {
    res.json({ ok: true, service: "arqueo-fornecedores", time: new Date().toISOString() });
  });

  // Listar fornecedores. Filtros opcionais: status, criticality, search, companyId, limit, offset.
  app.get("/api/v1/fornecedores", requireApiKey, async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
      const rows = await db.getAllSuppliers({
        status: req.query.status ? String(req.query.status) : undefined,
        criticality: req.query.criticality ? String(req.query.criticality) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        companyId: req.query.companyId ? String(req.query.companyId) : undefined,
      });
      const all = (rows as any[]).map(toPublic).filter(Boolean);
      res.json({ data: all.slice(offset, offset + limit), count: all.length, limit, offset });
    } catch (e: any) {
      res.status(500).json({ error: "internal_error", message: e?.message ?? "Erro ao listar fornecedores." });
    }
  });

  // Detalhe de um fornecedor + contatos.
  app.get("/api/v1/fornecedores/:id", requireApiKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: "bad_request", message: "id inválido." }); return; }
      const row = await db.getSupplierById(id);
      if (!row) { res.status(404).json({ error: "not_found", message: "Fornecedor não encontrado." }); return; }
      const contacts = await db.getSupplierContacts(id).catch(() => []);
      res.json({ data: { ...toPublic(row), contatos: (contacts as any[]).map(toContact) } });
    } catch (e: any) {
      res.status(500).json({ error: "internal_error", message: e?.message ?? "Erro ao buscar fornecedor." });
    }
  });

  // Criar fornecedor.
  app.post("/api/v1/fornecedores", requireApiKey, async (req, res) => {
    try {
      const parsed = createSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: "validation_error", message: "Dados inválidos.", issues: parsed.error.issues });
        return;
      }
      const data = mapInput(parsed.data);
      if (!data.companyName) { res.status(400).json({ error: "validation_error", message: "nome (ou companyName) é obrigatório." }); return; }
      if (!data.cnpj) { res.status(400).json({ error: "validation_error", message: "documento (ou cnpj) é obrigatório." }); return; }

      const id = await db.createSupplier({
        companyName: data.companyName,
        tradeName: data.tradeName,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
        criticality: data.criticality ?? "medium",
        notes: data.notes,
        createdById: null,
        organizationalGroupId: null,
      } as any);

      // Workflow de homologação, igual ao fluxo da tRPC.
      try {
        const workflowId = await db.createWorkflow({ supplierId: id, totalSteps: 2, createdById: null } as any);
        await db.createWorkflowStep({ workflowId, stepNumber: 1, stepName: "Verificação de Documentos" });
        await db.createWorkflowStep({ workflowId, stepNumber: 2, stepName: "Aprovação Final" });
      } catch { /* workflow é complementar; não bloqueia a criação */ }

      await audit("create", id, { via: "api/v1", companyName: data.companyName });
      const row = await db.getSupplierById(id);
      res.status(201).json({ data: toPublic(row) });
    } catch (e: any) {
      const dup = /duplicate|unique/i.test(e?.message ?? "");
      res.status(dup ? 409 : 500).json({
        error: dup ? "conflict" : "internal_error",
        message: dup ? "Já existe fornecedor com esse CNPJ." : (e?.message ?? "Erro ao criar fornecedor."),
      });
    }
  });

  // Editar fornecedor (parcial).
  app.put("/api/v1/fornecedores/:id", requireApiKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: "bad_request", message: "id inválido." }); return; }
      const existing = await db.getSupplierById(id);
      if (!existing) { res.status(404).json({ error: "not_found", message: "Fornecedor não encontrado." }); return; }

      const parsed = createSchema.partial({ email: true } as any).safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: "validation_error", message: "Dados inválidos.", issues: parsed.error.issues });
        return;
      }
      const mapped = mapInput({ email: existing.supplier?.email, ...parsed.data } as any);
      // Monta só os campos presentes (não sobrescreve com undefined).
      const patch: Record<string, any> = {};
      for (const [k, v] of Object.entries(mapped)) if (v !== undefined && k !== "email") patch[k] = v;
      if (parsed.data.email) patch.email = parsed.data.email;

      await db.updateSupplier(id, patch);
      await audit("update", id, { via: "api/v1", fields: Object.keys(patch) });
      const row = await db.getSupplierById(id);
      res.json({ data: toPublic(row) });
    } catch (e: any) {
      res.status(500).json({ error: "internal_error", message: e?.message ?? "Erro ao editar fornecedor." });
    }
  });

  // Apagar fornecedor (hard delete, igual ao da tRPC).
  app.delete("/api/v1/fornecedores/:id", requireApiKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: "bad_request", message: "id inválido." }); return; }
      const existing = await db.getSupplierById(id);
      if (!existing) { res.status(404).json({ error: "not_found", message: "Fornecedor não encontrado." }); return; }
      await db.hardDeleteSupplier(id);
      await audit("delete", id, { via: "api/v1", hardDelete: true });
      res.json({ data: { id, deleted: true } });
    } catch (e: any) {
      res.status(500).json({ error: "internal_error", message: e?.message ?? "Erro ao apagar fornecedor." });
    }
  });
}
