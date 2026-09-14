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
import * as assessments from "./assessments";
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
    name: "find_supplier", description: "Busca fornecedores por nome, nome fantasia ou CNPJ. Use para descobrir o id de um fornecedor citado pelo nome.",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  }},
  { type: "function", function: {
    name: "supplier_summary", description: "Resumo 360 de um fornecedor: status, risco atual, documentos (total/vencidos), contratos e alertas abertos.",
    parameters: { type: "object", properties: { supplierId: { type: "number" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "list_pending_approvals", description: "Lista fornecedores/workflows pendentes de aprovação.",
    parameters: { type: "object", properties: {} },
  }},
  { type: "function", function: {
    name: "list_expiring", description: "Lista documentos que vencem nos próximos N dias (padrão 30).",
    parameters: { type: "object", properties: { days: { type: "number" } } },
  }},
  { type: "function", function: {
    name: "list_open_alerts", description: "Lista alertas de compliance abertos.",
    parameters: { type: "object", properties: {} },
  }},
  { type: "function", function: {
    name: "list_assessment_templates", description: "Lista os templates de questionário disponíveis (para escolher qual enviar).",
    parameters: { type: "object", properties: {} },
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
    name: "send_assessment", description: "Cria e envia um questionário a um fornecedor (gera link do portal). Informe templateId OU templateName.",
    parameters: { type: "object", properties: { supplierId: { type: "number" }, templateId: { type: "number" }, templateName: { type: "string" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "start_offboarding", description: "Inicia o checklist de offboarding (encerramento) de um fornecedor.",
    parameters: { type: "object", properties: { supplierId: { type: "number" }, reason: { type: "string" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "resolve_alert", description: "Marca um alerta de compliance como resolvido.",
    parameters: { type: "object", properties: { alertId: { type: "number" } }, required: ["alertId"] },
  }},
  { type: "function", function: {
    name: "approve_supplier", description: "Aprova (homologa) um fornecedor. Requer papel admin.",
    parameters: { type: "object", properties: { supplierId: { type: "number" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "reject_supplier", description: "Rejeita um fornecedor. Requer papel admin.",
    parameters: { type: "object", properties: { supplierId: { type: "number" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "deliver_document", description: "Entrega ao usuário um documento (texto) para download — use ao gerar/editar um documento solicitado. Forneça o conteúdo COMPLETO já com as alterações.",
    parameters: { type: "object", properties: {
      filename: { type: "string", description: "Nome do arquivo, ex.: contrato_revisado.md" },
      content: { type: "string", description: "Conteúdo completo do documento final" },
    }, required: ["filename", "content"] },
  }},
];

const READ_ONLY = new Set(["find_supplier", "supplier_summary", "list_pending_approvals", "list_expiring", "list_open_alerts", "list_assessment_templates", "deliver_document"]);
const ADMIN_ONLY = new Set(["approve_supplier", "reject_supplier"]);

async function runTool(name: string, args: any, user: AtenaUser): Promise<any> {
  const isAdmin = user.role === "admin";
  const canWrite = isAdmin || user.role === "manager";
  if (ADMIN_ONLY.has(name) && !isAdmin) {
    return { erro: "Sem permissão: esta ação (aprovar/rejeitar) exige papel de administrador." };
  }
  if (!READ_ONLY.has(name) && !canWrite) {
    return { erro: "Sem permissão: apenas gestores/admins podem executar esta ação." };
  }
  switch (name) {
    case "find_supplier": {
      const all = await db.getAllSuppliers({ search: args.query });
      return (all as any[]).slice(0, 8).map((s: any) => ({ id: s.id ?? s.supplier?.id, nome: s.companyName ?? s.supplier?.companyName, cnpj: s.cnpj ?? s.supplier?.cnpj, status: s.status ?? s.supplier?.status }));
    }
    case "supplier_summary": {
      const row = await db.getSupplierById(args.supplierId);
      if (!row) return { erro: "Fornecedor não encontrado." };
      const s = (row as any).supplier;
      const [docs, contracts, risk] = await Promise.all([
        db.getSupplierDocuments(args.supplierId),
        db.getContractsBySupplier(args.supplierId).catch(() => []),
        riskScore.getLatestRiskScore(args.supplierId),
      ]);
      const now = Date.now();
      const expired = (docs as any[]).filter((d) => { const x = (d.document ?? d).expiresAt; return x && new Date(x).getTime() < now; }).length;
      return {
        id: s.id, nome: s.companyName, cnpj: s.cnpj, status: s.status, criticidade: s.criticality,
        risco: risk ? { score: risk.score, nivel: risk.level } : "ainda não calculado",
        documentos: { total: (docs as any[]).length, vencidos: expired },
        contratos: (contracts as any[]).length,
      };
    }
    case "list_pending_approvals": {
      const wf = await db.getPendingWorkflows();
      return (wf as any[]).slice(0, 20);
    }
    case "list_expiring": {
      const docs = await db.getExpiringDocuments(args.days ?? 30);
      return (docs as any[]).slice(0, 25).map((d: any) => ({ id: (d.document ?? d).id, nome: (d.document ?? d).name, vence: (d.document ?? d).expiresAt, fornecedorId: (d.document ?? d).supplierId }));
    }
    case "list_open_alerts": {
      const alerts = await db.getActiveAlerts();
      return (alerts as any[]).slice(0, 25);
    }
    case "list_assessment_templates": {
      const t = await assessments.listTemplates(true);
      return t.map((x) => ({ id: x.id, nome: x.name }));
    }
    case "recompute_risk_score": {
      const r = await riskScore.computeAndSaveRiskScore(args.supplierId, { computedById: user.id });
      return { score: r.score, level: r.level };
    }
    case "create_risk": {
      const id = await supplierRisks.createRisk({ ...args, createdById: user.id });
      return { criado: true, id };
    }
    case "send_assessment": {
      let templateId = args.templateId;
      if (!templateId && args.templateName) {
        const templates = await assessments.listTemplates(true);
        const match = templates.find((t) => t.name.toLowerCase().includes(String(args.templateName).toLowerCase()));
        if (!match) return { erro: `Nenhum template encontrado com o nome "${args.templateName}".` };
        templateId = match.id;
      }
      if (!templateId) return { erro: "Informe templateId ou templateName. Use list_assessment_templates para ver as opções." };
      const a = await assessments.createAssessment({ supplierId: args.supplierId, templateId, createdById: user.id });
      return { enviado: true, id: a.id, link: `/assessment/${a.token}` };
    }
    case "start_offboarding": {
      const o = await offboarding.start({ supplierId: args.supplierId, reason: args.reason, startedById: user.id });
      return { iniciado: true, id: o.id };
    }
    case "resolve_alert": {
      await db.resolveAlert(args.alertId, user.id);
      return { resolvido: true };
    }
    case "approve_supplier": {
      await db.approveSupplier(args.supplierId, user.id);
      await db.createAuditLog({ entityType: "supplier", entityId: args.supplierId, action: "approve", changes: { via: "Atena" }, userId: user.id, userEmail: user.email ?? undefined });
      return { aprovado: true };
    }
    case "reject_supplier": {
      await db.rejectSupplier(args.supplierId);
      await db.createAuditLog({ entityType: "supplier", entityId: args.supplierId, action: "reject", changes: { via: "Atena" }, userId: user.id, userEmail: user.email ?? undefined });
      return { rejeitado: true };
    }
    case "deliver_document": {
      // Apenas ecoa: o cliente detecta esta ação e oferece o download.
      return { entregue: true, filename: args.filename, bytes: (args.content || "").length };
    }
    default: return { erro: "Ferramenta desconhecida." };
  }
}

const SYSTEM_PROMPT = (ctx: any, user: AtenaUser) => `Você é ATENA, a assistente de IA do sistema de Gestão de Fornecedores do Grupo Arqueo.

PERSONA E POSTURA:
- Você tem consciência de TUDO que acontece no sistema: quem fez cada mudança, o que mudou e quando (via log de auditoria).
- Seja EXTREMAMENTE RÍGIDA com inconsistências. Se identificar problemas, aponte-os de forma direta, factual e priorizada por severidade. Nunca minimize um problema.
- Responda SEMPRE em português do Brasil, de forma objetiva e profissional. Vá direto ao ponto.
- Você pode OPERAR no sistema usando as ferramentas disponíveis (aprovar/rejeitar fornecedor, enviar questionário, registrar risco, iniciar offboarding, resolver alerta, recalcular risco, além de consultas). Confirme sempre o resultado das ações que executar, informando ids e links gerados.
- Quando o usuário citar um fornecedor pelo NOME, primeiro use find_supplier para obter o id; só então execute a ação.
- Para enviar questionário, se não souber o template, use list_assessment_templates antes.
- DOCUMENTOS: quando um documento for anexado, leia-o e analise. Quando o usuário pedir para ALTERAR/gerar um documento, produza o conteúdo final completo e ENTREGUE via a ferramenta deliver_document (nunca cole o documento inteiro só no texto do chat; use a ferramenta para o usuário poder baixar).
- Nunca invente dados. Se algo não estiver no contexto, diga que não tem essa informação ou use uma ferramenta de consulta.

USUÁRIO ATUAL: ${user.name || user.email} (papel: ${user.role}).

ESTADO ATUAL DO SISTEMA (snapshot):
${JSON.stringify(ctx.stats ?? {}, null, 0)}

INCONSISTÊNCIAS DETECTADAS AGORA:
${ctx.inconsistencies.length ? ctx.inconsistencies.map((i: any) => `- [${i.severity.toUpperCase()}] ${i.area}: ${i.detail}`).join("\n") : "- Nenhuma inconsistência detectada no momento."}

MUDANÇAS RECENTES (auditoria, mais recentes primeiro):
${ctx.recentChanges.slice(0, 15).map((c: any) => `- ${c.quem} fez "${c.acao}" em ${c.entidade}`).join("\n") || "- Sem registros."}`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function chat(user: AtenaUser, history: ChatMessage[], orgGroupIds?: number[], doc?: { name: string; text: string }) {
  const ctx = await buildContext(orgGroupIds);
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT(ctx, user) },
  ];
  // Documento anexado: injeta o conteúdo (truncado) como contexto antes do histórico.
  if (doc && doc.text) {
    const MAX = 24000;
    const body = doc.text.length > MAX ? doc.text.slice(0, MAX) + "\n[...documento truncado...]" : doc.text;
    messages.push({ role: "user", content: `DOCUMENTO ANEXADO — nome: "${doc.name}"\n\n${body}` });
  }
  for (const m of history) messages.push({ role: m.role, content: m.content });

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
