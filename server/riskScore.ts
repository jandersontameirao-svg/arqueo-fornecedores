// ============================================================================
// MÓDULO: SCORE DE RISCO (0–1000) — modelo ponderado transparente.
// Quanto MAIOR o score, MAIOR o risco. Cada cálculo é persistido como histórico.
// Inspirado no modelo de risk scoring do lt-vrm, adaptado ao domínio local.
// ============================================================================
import { and, desc, eq } from "drizzle-orm";
import { getDb, getSupplierById, getSupplierDocuments, getSupplierEvaluations } from "./db";
import {
  complianceAlerts,
  supplierRisks,
  supplierRiskScores,
  type SupplierRiskScore,
} from "../drizzle/schema";

export type RiskFactor = { key: string; label: string; points: number; detail: string };
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskBreakdown = { total: number; level: RiskLevel; factors: RiskFactor[] };

const MAX_SCORE = 1000;

function levelFromScore(score: number): RiskLevel {
  if (score < 250) return "low";
  if (score < 500) return "medium";
  if (score < 750) return "high";
  return "critical";
}

/**
 * Calcula (sem persistir) o score de risco de um fornecedor a partir de dados reais:
 * criticidade, documentos vencidos/a vencer, última avaliação, alertas de compliance
 * abertos e riscos abertos no Risk Register.
 */
export async function computeRiskBreakdown(supplierId: number): Promise<RiskBreakdown> {
  const factors: RiskFactor[] = [];
  const row = await getSupplierById(supplierId);
  if (!row) throw new Error("Fornecedor não encontrado");
  const supplier = row.supplier;

  // 1) Criticidade cadastrada do fornecedor
  const critMap: Record<string, number> = { low: 0, medium: 100, high: 200, critical: 300 };
  const critPts = critMap[supplier.criticality ?? "medium"] ?? 100;
  factors.push({ key: "criticality", label: "Criticidade", points: critPts, detail: `Criticidade "${supplier.criticality ?? "medium"}"` });

  // 2) Status geral na base
  let statusPts = 0;
  if (supplier.status === "suspended" || supplier.status === "rejected") statusPts = 100;
  else if (supplier.status === "pending") statusPts = 40;
  else if (supplier.status === "inactive") statusPts = 60;
  factors.push({ key: "status", label: "Status cadastral", points: statusPts, detail: `Status "${supplier.status}"` });

  // 3) Documentos vencidos e a vencer
  const docs = await getSupplierDocuments(supplierId);
  const now = Date.now();
  const in30d = now + 30 * 24 * 60 * 60 * 1000;
  let expired = 0, expiringSoon = 0;
  for (const d of docs) {
    if (!d.expiresAt) continue;
    const t = new Date(d.expiresAt).getTime();
    if (t < now) expired++;
    else if (t < in30d) expiringSoon++;
  }
  const expiredPts = Math.min(expired * 60, 240);
  const soonPts = Math.min(expiringSoon * 20, 100);
  factors.push({ key: "docs_expired", label: "Documentos vencidos", points: expiredPts, detail: `${expired} documento(s) vencido(s)` });
  factors.push({ key: "docs_expiring", label: "Documentos a vencer (30d)", points: soonPts, detail: `${expiringSoon} documento(s) a vencer` });

  // 4) Última avaliação de desempenho (overallScore 0–100, maior = melhor)
  const evals = await getSupplierEvaluations(supplierId);
  let evalPts = 120; // penalidade por ausência de avaliação
  let evalDetail = "Sem avaliação de desempenho registrada";
  if (evals.length > 0) {
    const latest = evals[0].evaluation;
    const overall = latest.overallScore != null ? Number(latest.overallScore) : null;
    if (overall != null && !Number.isNaN(overall)) {
      evalPts = Math.round(Math.max(0, Math.min(100, 100 - overall)) * 2.5); // até 250
      evalDetail = `Última avaliação: ${overall.toFixed(1)}/100`;
    }
  }
  factors.push({ key: "evaluation", label: "Desempenho", points: evalPts, detail: evalDetail });

  const db = await getDb();
  // 5) Alertas de compliance abertos
  let alertPts = 0, openAlerts = 0;
  if (db) {
    const alerts = await db.select().from(complianceAlerts)
      .where(and(eq(complianceAlerts.supplierId, supplierId), eq(complianceAlerts.isResolved, false)));
    const sevMap: Record<string, number> = { low: 10, medium: 25, high: 50, critical: 80 };
    openAlerts = alerts.length;
    alertPts = Math.min(alerts.reduce((s, a) => s + (sevMap[a.severity] ?? 25), 0), 250);
  }
  factors.push({ key: "compliance", label: "Alertas de compliance", points: alertPts, detail: `${openAlerts} alerta(s) aberto(s)` });

  // 6) Riscos abertos no Risk Register
  let riskPts = 0, openRisks = 0;
  if (db) {
    const risks = await db.select().from(supplierRisks)
      .where(and(eq(supplierRisks.supplierId, supplierId), eq(supplierRisks.status, "open")));
    const sevMap: Record<string, number> = { low: 10, medium: 25, high: 50, critical: 80 };
    openRisks = risks.length;
    riskPts = Math.min(risks.reduce((s, r) => s + (sevMap[r.severity] ?? 25), 0), 200);
  }
  factors.push({ key: "risk_register", label: "Riscos abertos", points: riskPts, detail: `${openRisks} risco(s) em aberto` });

  const rawTotal = factors.reduce((s, f) => s + f.points, 0);
  const total = Math.min(rawTotal, MAX_SCORE);
  return { total, level: levelFromScore(total), factors };
}

/** Calcula e persiste um novo registro histórico de score. */
export async function computeAndSaveRiskScore(
  supplierId: number,
  opts?: { computedById?: number; organizationalGroupId?: number | null; notes?: string },
): Promise<SupplierRiskScore> {
  const breakdown = await computeRiskBreakdown(supplierId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(supplierRiskScores).values({
    supplierId,
    score: breakdown.total,
    level: breakdown.level,
    breakdown: breakdown as any,
    notes: opts?.notes,
    computedById: opts?.computedById,
    organizationalGroupId: opts?.organizationalGroupId ?? null,
  });
  const insertId = (result[0] as any).insertId as number;
  const saved = await getRiskScoreById(insertId);
  return saved!;
}

export async function getRiskScoreById(id: number): Promise<SupplierRiskScore | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(supplierRiskScores).where(eq(supplierRiskScores.id, id)).limit(1);
  return row;
}

/** Último score persistido de um fornecedor (ou null). */
export async function getLatestRiskScore(supplierId: number): Promise<SupplierRiskScore | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(supplierRiskScores)
    .where(eq(supplierRiskScores.supplierId, supplierId))
    .orderBy(desc(supplierRiskScores.computedAt)).limit(1);
  return row ?? null;
}

/** Histórico de scores de um fornecedor (mais recente primeiro). */
export async function getRiskScoreHistory(supplierId: number, limit = 50): Promise<SupplierRiskScore[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierRiskScores)
    .where(eq(supplierRiskScores.supplierId, supplierId))
    .orderBy(desc(supplierRiskScores.computedAt)).limit(limit);
}
