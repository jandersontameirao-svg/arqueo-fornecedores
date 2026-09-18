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
import { suppliers, documents, complianceAlerts, atenaChats } from "../drizzle/schema";

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
    name: "list_contracts", description: "Lista os contratos de um fornecedor (id, número, título, status, vigência, valor, se tem texto). Use para localizar o contrato antes de ler ou revisar.",
    parameters: { type: "object", properties: { supplierId: { type: "number" } }, required: ["supplierId"] },
  }},
  { type: "function", function: {
    name: "get_contract", description: "Lê o conteúdo integral e os metadados de um contrato armazenado pelo id. Use quando precisar analisar/ler um contrato específico.",
    parameters: { type: "object", properties: { contractId: { type: "number" } }, required: ["contractId"] },
  }},
  { type: "function", function: {
    name: "review_contract", description: "Revisão automática de conformidade de um contrato: aponta cláusulas essenciais presentes/ausentes, vigência vencida ou faltante, valor e partes ausentes. Use os achados para propor correções priorizadas.",
    parameters: { type: "object", properties: { contractId: { type: "number" } }, required: ["contractId"] },
  }},
  { type: "function", function: {
    name: "update_contract", description: "Aplica correções APROVADAS a um contrato (texto revisado, vigência, valor, status, observações). Salva a versão anterior no histórico e registra auditoria. Só execute depois que o usuário CONFIRMAR explicitamente as alterações.",
    parameters: { type: "object", properties: {
      contractId: { type: "number" },
      content: { type: "string", description: "Novo texto integral do contrato (opcional)" },
      startDate: { type: "string", description: "Início da vigência, ISO YYYY-MM-DD (opcional)" },
      endDate: { type: "string", description: "Fim da vigência, ISO YYYY-MM-DD (opcional)" },
      totalValue: { type: "number", description: "Valor total (opcional)" },
      status: { type: "string", enum: ["draft","review","active","suspended","expired","terminated"], description: "Novo status (opcional)" },
      notes: { type: "string", description: "Observações (opcional)" },
      changeDescription: { type: "string", description: "Resumo curto do que mudou (para o histórico de versões)" },
    }, required: ["contractId"] },
  }},
  { type: "function", function: {
    name: "deliver_document", description: "Entrega ao usuário um documento (texto) para download — use ao gerar/editar um documento solicitado. Forneça o conteúdo COMPLETO já com as alterações.",
    parameters: { type: "object", properties: {
      filename: { type: "string", description: "Nome do arquivo, ex.: contrato_revisado.md" },
      content: { type: "string", description: "Conteúdo completo do documento final" },
    }, required: ["filename", "content"] },
  }},
];

// Cláusulas essenciais verificadas na revisão de contratos (heurística por palavras-chave, pt-BR).
const CONTRACT_CLAUSES: Array<{ chave: string; termos: RegExp }> = [
  { chave: "Objeto", termos: /\bobjeto\b/i },
  { chave: "Vigência/Prazo", termos: /vig[êe]ncia|prazo de vig|prazo contratual/i },
  { chave: "Valor/Preço", termos: /valor|pre[çc]o|remunera[çc][ãa]o/i },
  { chave: "Forma de pagamento", termos: /forma de pagamento|condi[çc][õo]es de pagamento|pagamento/i },
  { chave: "Reajuste/Índice", termos: /reajust|[íi]ndice|IPCA|IGP-?M|INPC/i },
  { chave: "Multa/Penalidade", termos: /multa|penalidade|cl[áa]usula penal/i },
  { chave: "Rescisão", termos: /rescis[ãa]o|resili[çc][ãa]o|resolu[çc][ãa]o contratual/i },
  { chave: "Confidencialidade", termos: /confidencialidade|sigilo|n[ãa]o divulga/i },
  { chave: "LGPD/Proteção de dados", termos: /LGPD|prote[çc][ãa]o de dados|dados pessoais|13\.?709/i },
  { chave: "Foro/Legislação", termos: /foro|comarca|legisla[çc][ãa]o aplic/i },
  { chave: "Obrigações das partes", termos: /obriga[çc][õo]es|deveres das partes|responsabilidades/i },
  { chave: "SLA/Nível de serviço", termos: /SLA|n[íi]vel de servi[çc]o|prazo de atendimento/i },
];

const READ_ONLY = new Set(["find_supplier", "supplier_summary", "list_pending_approvals", "list_expiring", "list_open_alerts", "list_assessment_templates", "list_contracts", "get_contract", "review_contract", "deliver_document"]);
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
    case "list_contracts": {
      const rows = await db.getContractsBySupplier(args.supplierId).catch(() => []);
      return (rows as any[]).slice(0, 25).map((c) => ({
        id: c.id, numero: c.number, titulo: c.title, tipo: c.contractType, status: c.status,
        inicio: c.startDate, fim: c.endDate, valor: c.totalValue, temTexto: !!(c.content && c.content.length > 0),
      }));
    }
    case "get_contract": {
      const c: any = await db.getContractById(args.contractId);
      if (!c) return { erro: "Contrato não encontrado." };
      const MAX = 24000;
      const texto: string = c.content || "";
      return {
        id: c.id, numero: c.number, titulo: c.title, objeto: c.object, tipo: c.contractType, status: c.status,
        vigencia: { inicio: c.startDate, fim: c.endDate, assinadoEm: c.signedAt },
        valor: c.totalValue, moeda: c.currency, pagamento: c.paymentTerms,
        contratada: { nome: c.contractorName, cnpj: c.contractorCnpj, representante: c.contractorRepresentative },
        conteudo: texto.length > MAX ? texto.slice(0, MAX) + "\n[...contrato truncado...]" : texto,
        conteudoTruncado: texto.length > MAX,
        semTexto: !texto,
      };
    }
    case "review_contract": {
      const c: any = await db.getContractById(args.contractId);
      if (!c) return { erro: "Contrato não encontrado." };
      const texto: string = c.content || "";
      const presentes: string[] = [];
      const ausentes: string[] = [];
      if (texto) for (const cl of CONTRACT_CLAUSES) (cl.termos.test(texto) ? presentes : ausentes).push(cl.chave);
      const alertas: string[] = [];
      const now = Date.now();
      if (!texto) alertas.push("Contrato sem texto (content) — não é possível revisar cláusulas; importe/anexe o conteúdo.");
      if (!c.endDate) alertas.push("Sem data de fim de vigência (endDate).");
      else if (new Date(c.endDate).getTime() < now && !["expired", "terminated"].includes(c.status)) alertas.push(`Vigência vencida em ${new Date(c.endDate).toLocaleDateString("pt-BR")}, mas status ainda é "${c.status}".`);
      if (!c.totalValue || Number(c.totalValue) <= 0) alertas.push("Valor total ausente ou zerado.");
      if (!c.contractorCnpj) alertas.push("CNPJ da contratada ausente.");
      return {
        contratoId: c.id, titulo: c.title, status: c.status,
        clausulasPresentes: presentes, clausulasAusentes: ausentes, alertas,
        resumo: `${presentes.length}/${CONTRACT_CLAUSES.length} cláusulas essenciais encontradas; ${ausentes.length} ausentes; ${alertas.length} alerta(s).`,
      };
    }
    case "update_contract": {
      const c: any = await db.getContractById(args.contractId);
      if (!c) return { erro: "Contrato não encontrado." };
      const patch: any = {};
      if (typeof args.content === "string") patch.content = args.content;
      if (args.startDate) patch.startDate = new Date(args.startDate);
      if (args.endDate) patch.endDate = new Date(args.endDate);
      if (args.totalValue != null) patch.totalValue = String(args.totalValue);
      if (args.status) patch.status = args.status;
      if (typeof args.notes === "string") patch.notes = args.notes;
      if (Object.keys(patch).length === 0) return { erro: "Nenhum campo para atualizar foi informado." };
      // Snapshot da versão atual antes de alterar (histórico/rastreabilidade).
      const nextVersion = (await db.getLatestVersionNumber(args.contractId).catch(() => 0)) + 1;
      await db.createContractVersion({
        contractId: c.id, versionNumber: nextVersion, content: c.content ?? null,
        changeDescription: args.changeDescription || "Revisão via Atena", title: c.title,
        totalValue: c.totalValue ?? null, startDate: c.startDate ?? null, endDate: c.endDate ?? null,
        createdById: user.id,
      } as any).catch(() => {});
      await db.updateContract(args.contractId, patch);
      await db.createAuditLog({ entityType: "contract", entityId: args.contractId, action: "update", changes: { via: "Atena", campos: Object.keys(patch), versaoSalva: nextVersion }, userId: user.id, userEmail: user.email ?? undefined });
      return { atualizado: true, contratoId: args.contractId, camposAlterados: Object.keys(patch), versaoSalva: nextVersion };
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
- CONTRATOS: para ler/revisar/corrigir contratos, use list_contracts (achar), get_contract (ler na íntegra), review_contract (checklist de cláusulas essenciais e alertas) e, só após CONFIRMAÇÃO do usuário, update_contract (aplica correções, versiona e audita). Ao revisar, cite cláusulas ausentes e proponha a redação da correção antes de gravar.
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

// ---------------- Persistência do histórico de conversa (por usuário) ----------------
export async function getSavedChat(userId: number): Promise<ChatMessage[]> {
  const db2 = await getDb();
  if (!db2) return [];
  const [row] = await db2.select().from(atenaChats).where(eq(atenaChats.userId, userId)).limit(1);
  return (row?.messages as ChatMessage[]) ?? [];
}

export async function saveChat(userId: number, messages: ChatMessage[]): Promise<void> {
  const db2 = await getDb();
  if (!db2) return;
  // Guarda apenas role+content (sem anexos/documentos), limitado às últimas 200 mensagens.
  const clean = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-200)
    .map((m) => ({ role: m.role, content: m.content }));
  await db2.insert(atenaChats)
    .values({ userId, messages: clean as any })
    .onDuplicateKeyUpdate({ set: { messages: clean as any } });
}

export async function clearChat(userId: number): Promise<void> {
  const db2 = await getDb();
  if (!db2) return;
  await db2.delete(atenaChats).where(eq(atenaChats.userId, userId));
}
