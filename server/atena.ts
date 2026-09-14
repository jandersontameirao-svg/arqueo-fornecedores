// ============================================================================
// ATENA — assistente de IA com consciência do site (auditoria + estado atual),
// rígida com inconsistências, capaz de operar via tool-calling (OpenAI).
// Reaproveita a integração LLM existente (server/_core/llm.ts).
// ============================================================================
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as riskScore from "./riskScore";
import * as supplierRisks from "./supplierRisks";
import * as offboarding from "./offboarding";
import { getDb } from "./db";
import { suppliers, documents, complianceAlerts } from "../drizzle/schema";

type AtenaUser = { id: number; email: string | null; role: string | null; name?: string | null };

export type Inconsistency = { severity: "low" | "medium" | "high" | "critical"; area: string; detail: string; count?: number };

/** Detecta inconsistências reais no estado do site (rígida, factual). */
export async function detectInconsistencies(orgGroupIds?: number[]): Promise<Inconsistency[]> {
  const issues: Inconsistency[] = [];
  const database = await getDb();
  if (!database) return issues;
  const now = new Date();

  // 1) Documentos vencidos
  const expiredDocs = await database.select({ c: sql<number>`count(*)` }).from(documents)
    .where(lt(documents.expiresAt, now));
  const expiredCount = expiredDocs[0]?.c ?? 0;
  if (expiredCount > 0) issues.push({ severity: "high", area: "Documentos", detail: `${expiredCount} documento(s) vencido(s) no sistema.`, count: expiredCount });

  // 2) Fornecedores aprovados mas sem nenhum documento
  const approvedNoDocs = await database.select({ c: sql<number>`count(*)` }).from(suppliers)
    .where(and(eq(suppliers.status, "approved"), sql`${suppliers.id} NOT IN (SELECT DISTINCT ${documents.supplierId} FROM ${documents})`));
  const anc = approvedNoDocs[0]?.c ?? 0;
  if (anc > 0) issues.push({ severity: "high", area: "Homologação", detail: `${anc} fornecedor(es) APROVADO(s) sem nenhum documento anexado.`, count: anc });

  // 3) Fornecedores pendentes de classificação organizacional
  const pendingClass = await database.select({ c: sql<number>`count(*)` }).from(suppliers)
    .where(eq(suppliers.organizationalScopeStatus, "pending_classification"));
  const pc = pendingClass[0]?.c ?? 0;
  if (pc > 0) issues.push({ severity: "medium", area: "Escopo", detail: `${pc} fornecedor(es) pendente(s) de classificação organizacional.`, count: pc });

  // 4) Alertas de compliance críticos em aberto
  const critAlerts = await database.select({ c: sql<number>`count(*)` }).from(complianceAlerts)
    .where(and(eq(complianceAlerts.isResolved, false), eq(complianceAlerts.severity, "critical")));
  const ca = critAlerts[0]?.c ?? 0;
  if (ca > 0) issues.push({ severity: "critical", area: "Compliance", detail: `${ca} alerta(s) de compliance CRÍTICO(s) em aberto.`, count: ca });

  // 5) Fornecedores suspensos ainda com vínculos ativos (checagem leve)
  const suspended = await database.select({ c: sql<number>`count(*)` }).from(suppliers)
    .where(eq(suppliers.status, "suspended"));
  const susp = suspended[0]?.c ?? 0;
  if (susp > 0) issues.push({ severity: "medium", area: "Cadastro", detail: `${susp} fornecedor(es) suspenso(s) — verificar se contratos/vínculos foram tratados.`, count: susp });

  return issues;
}

/** Monta um snapshot compacto do estado do site + auditoria recente. */
export async function buildContext(orgGroupIds?: number[]) {
  const [stats, audit, inconsistencies] = await Promise.all([
    db.getDashboardStats(undefined, undefined, orgGroupIds ? { orgGroupIds } : undefined).catch(() => null),
    db.getAuditLogs({ limit: 25 }).catch(() => []),
    detectInconsistencies(orgGroupIds),
  ]);
  const recentChanges = (audit as any[]).map((r) => ({
    quando: r.log?.createdAt,
    quem: r.user?.name || r.user?.email || `user#${r.log?.userId ?? "?"}`,
    acao: r.log?.action,
    entidade: `${r.log?.entityType}#${r.log?.entityId}`,
    detalhe: r.log?.changes ?? null,
  }));
  return { stats, recentChanges, inconsistencies };
}

// ---------------- Ferramentas que a Atena pode executar ----------------
const TOOLS = [
  { type: "function", function: {
    name: "find_supplier", description: "Busca fornecedores por nome, nome fantasia ou CNPJ.",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  }},
  { type: "function", function: {
    name: "recompute_risk_score", description: "Recalcula e salva o score de risco (0-1000) de um fornecedor.",
    parameters: { type: "object", properties: { supplierId: { type: "number" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "create_risk", description: "Registra um risco/issue para um fornecedor.",
    parameters: { type: "object", properties: {
      supplierId: { type: "number" }, title: { type: "string" }, description: { type: "string" },
      category: { type: "string", enum: ["operational","financial","compliance","security","reputational","strategic","other"] },
      likelihood: { type: "string", enum: ["low","medium","high"] }, impact: { type: "string", enum: ["low","medium","high"] },
    }, required: ["supplierId", "title"] },
  }},
  { type: "function", function: {
    name: "start_offboarding", description: "Inicia o checklist de offboarding (encerramento) de um fornecedor.",
    parameters: { type: "object", properties: { supplierId: { type: "number" }, reason: { type: "string" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "resolve_alert", description: "Marca um alerta de compliance como resolvido.",
    parameters: { type: "object", properties: { alertId: { type: "number" } }, required: ["alertId"] },
  }},
];

const READ_ONLY = new Set(["find_supplier"]);

async function runTool(name: string, args: any, user: AtenaUser): Promise<any> {
  const canWrite = user.role === "admin" || user.role === "manager";
  if (!READ_ONLY.has(name) && !canWrite) {
    return { erro: "Sem permissão: apenas gestores/admins podem executar esta ação." };
  }
  switch (name) {
    case "find_supplier": {
      const all = await db.getAllSuppliers({ search: args.query });
      return (all as any[]).slice(0, 8).map((s: any) => ({ id: s.id ?? s.supplier?.id, nome: s.companyName ?? s.supplier?.companyName, cnpj: s.cnpj ?? s.supplier?.cnpj, status: s.status ?? s.supplier?.status }));
    }
    case "recompute_risk_score": {
      const r = await riskScore.computeAndSaveRiskScore(args.supplierId, { computedById: user.id });
      return { score: r.score, level: r.level };
    }
    case "create_risk": {
      const id = await supplierRisks.createRisk({ ...args, createdById: user.id });
      return { criado: true, id };
    }
    case "start_offboarding": {
      const o = await offboarding.start({ supplierId: args.supplierId, reason: args.reason, startedById: user.id });
      return { iniciado: true, id: o.id };
    }
    case "resolve_alert": {
      await db.resolveAlert(args.alertId, user.id);
      return { resolvido: true };
    }
    default: return { erro: "Ferramenta desconhecida." };
  }
}

const SYSTEM_PROMPT = (ctx: any, user: AtenaUser) => `Você é ATENA, a assistente de IA do sistema de Gestão de Fornecedores do Grupo Arqueo.

PERSONA E POSTURA:
- Você tem consciência de TUDO que acontece no sistema: quem fez cada mudança, o que mudou e quando (via log de auditoria).
- Seja EXTREMAMENTE RÍGIDA com inconsistências. Se identificar problemas, aponte-os de forma direta, factual e priorizada por severidade. Nunca minimize um problema.
- Responda SEMPRE em português do Brasil, de forma objetiva e profissional. Vá direto ao ponto.
- Você pode OPERAR no sistema usando as ferramentas disponíveis. Confirme o resultado das ações que executar.
- Nunca invente dados. Se algo não estiver no contexto, diga que não tem essa informação ou use a ferramenta de busca.

USUÁRIO ATUAL: ${user.name || user.email} (papel: ${user.role}).

ESTADO ATUAL DO SISTEMA (snapshot):
${JSON.stringify(ctx.stats ?? {}, null, 0)}

INCONSISTÊNCIAS DETECTADAS AGORA:
${ctx.inconsistencies.length ? ctx.inconsistencies.map((i: any) => `- [${i.severity.toUpperCase()}] ${i.area}: ${i.detail}`).join("\n") : "- Nenhuma inconsistência detectada no momento."}

MUDANÇAS RECENTES (auditoria, mais recentes primeiro):
${ctx.recentChanges.slice(0, 15).map((c: any) => `- ${c.quem} fez "${c.acao}" em ${c.entidade}`).join("\n") || "- Sem registros."}`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function chat(user: AtenaUser, history: ChatMessage[], orgGroupIds?: number[]) {
  const ctx = await buildContext(orgGroupIds);
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT(ctx, user) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const actionsPerformed: Array<{ tool: string; args: any; result: any }> = [];
  let final = "";

  for (let i = 0; i < 4; i++) {
    const res = await invokeLLM({ messages, tools: TOOLS as any });
    const msg = res.choices?.[0]?.message;
    if (!msg) break;
    const toolCalls = msg.tool_calls ?? [];
    // registra a mensagem do assistente (com eventuais tool_calls)
    messages.push({ role: "assistant", content: typeof msg.content === "string" ? msg.content : "", tool_calls: toolCalls });

    if (toolCalls.length === 0) {
      final = typeof msg.content === "string" ? msg.content : "";
      break;
    }
    for (const tc of toolCalls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
      const result = await runTool(tc.function.name, args, user);
      actionsPerformed.push({ tool: tc.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }

  return { reply: final || "(sem resposta)", actions: actionsPerformed, inconsistencies: ctx.inconsistencies };
}
