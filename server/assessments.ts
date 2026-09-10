// ============================================================================
// MÓDULO: ASSESSMENTS / QUESTIONÁRIOS — templates + envio ao fornecedor via
// portal tokenizado + cálculo de risco inerente a partir das respostas.
// ============================================================================
import { randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  assessmentTemplates, supplierAssessments,
  type AssessmentTemplate, type InsertAssessmentTemplate,
  type SupplierAssessment,
} from "../drizzle/schema";

// Estrutura de uma pergunta armazenada em assessmentTemplates.questions (json):
//   { id: string, text: string, type: "yes_no" | "scale_0_10" | "text",
//     weight: number (0–10), riskyAnswer?: "yes" | "no" }
export type Question = {
  id: string; text: string; type: "yes_no" | "scale_0_10" | "text";
  weight?: number; riskyAnswer?: "yes" | "no";
};

type RiskLevel = "low" | "medium" | "high" | "critical";
function levelFromScore(s: number): RiskLevel {
  if (s < 250) return "low";
  if (s < 500) return "medium";
  if (s < 750) return "high";
  return "critical";
}

/** Calcula o risco inerente (0–1000) a partir das respostas e das perguntas do template. */
export function scoreAnswers(questions: Question[], answers: Record<string, any>): { score: number; level: RiskLevel } {
  let raw = 0, max = 0;
  for (const q of questions) {
    const w = q.weight ?? 1;
    if (q.type === "text") continue; // texto livre não pontua
    max += w * 10;
    const a = answers?.[q.id];
    if (a == null) { raw += w * 10; continue; } // não respondida = risco máximo
    if (q.type === "yes_no") {
      const risky = q.riskyAnswer ?? "no";
      if (String(a) === risky) raw += w * 10;
    } else if (q.type === "scale_0_10") {
      const v = Math.max(0, Math.min(10, Number(a) || 0)); // maior = melhor
      raw += w * (10 - v);
    }
  }
  const score = max > 0 ? Math.round((raw / max) * 1000) : 0;
  return { score, level: levelFromScore(score) };
}

// ---------- Templates ----------
export async function listTemplates(activeOnly = false): Promise<AssessmentTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(assessmentTemplates).orderBy(desc(assessmentTemplates.createdAt));
  return activeOnly ? rows.filter((t) => t.isActive) : rows;
}
export async function getTemplate(id: number): Promise<AssessmentTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, id)).limit(1);
  return row;
}
export async function createTemplate(data: InsertAssessmentTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const result = await db.insert(assessmentTemplates).values(data);
  return (result[0] as any).insertId as number;
}
export async function updateTemplate(id: number, data: Partial<InsertAssessmentTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(assessmentTemplates).set(data).where(eq(assessmentTemplates.id, id));
}

// ---------- Assessments ----------
export async function listBySupplier(supplierId: number): Promise<SupplierAssessment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierAssessments)
    .where(eq(supplierAssessments.supplierId, supplierId))
    .orderBy(desc(supplierAssessments.createdAt));
}
export async function getAssessmentById(id: number): Promise<SupplierAssessment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(supplierAssessments).where(eq(supplierAssessments.id, id)).limit(1);
  return row;
}
export async function createAssessment(data: {
  supplierId: number; templateId: number; organizationalGroupId?: number | null; createdById?: number;
}): Promise<SupplierAssessment> {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const token = randomBytes(24).toString("hex");
  const result = await db.insert(supplierAssessments).values({
    supplierId: data.supplierId, templateId: data.templateId, token,
    status: "sent", sentAt: new Date(),
    organizationalGroupId: data.organizationalGroupId ?? null, createdById: data.createdById,
  });
  const id = (result[0] as any).insertId as number;
  return (await getAssessmentById(id))!;
}

/** Portal público: dados mínimos do questionário para o fornecedor responder. */
export async function getPortalByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [a] = await db.select().from(supplierAssessments).where(eq(supplierAssessments.token, token)).limit(1);
  if (!a) return null;
  const template = await getTemplate(a.templateId);
  return {
    status: a.status,
    templateName: template?.name ?? "Questionário",
    description: template?.description ?? null,
    questions: (template?.questions as Question[]) ?? [],
    answers: (a.answers as Record<string, any>) ?? {},
    submitted: a.status === "submitted" || a.status === "reviewed",
  };
}

/** Portal público: salvar respostas e calcular risco inerente. */
export async function submitByToken(token: string, answers: Record<string, any>): Promise<{ ok: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const [a] = await db.select().from(supplierAssessments).where(eq(supplierAssessments.token, token)).limit(1);
  if (!a) throw new Error("Questionário não encontrado");
  if (a.status === "submitted" || a.status === "reviewed") throw new Error("Questionário já respondido");
  const template = await getTemplate(a.templateId);
  const questions = (template?.questions as Question[]) ?? [];
  const { score, level } = scoreAnswers(questions, answers);
  await db.update(supplierAssessments).set({
    answers, score, riskLevel: level, status: "submitted", submittedAt: new Date(),
  }).where(eq(supplierAssessments.id, a.id));
  return { ok: true };
}

export async function reviewAssessment(id: number, reviewedById: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierAssessments).set({
    status: "reviewed", reviewedAt: new Date(), reviewedById,
  }).where(eq(supplierAssessments.id, id));
}
