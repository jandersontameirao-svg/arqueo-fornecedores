// ============================================================================
// MÓDULO: RISK REGISTER / ISSUES — registro e tratamento de riscos por fornecedor.
// ============================================================================
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { supplierRisks, type InsertSupplierRisk, type SupplierRisk } from "../drizzle/schema";

/** Deriva severidade a partir de probabilidade x impacto (matriz de risco 3x3). */
export function deriveSeverity(likelihood: string, impact: string): SupplierRisk["severity"] {
  const map: Record<string, number> = { low: 1, medium: 2, high: 3 };
  const product = (map[likelihood] ?? 2) * (map[impact] ?? 2);
  if (product >= 9) return "critical";
  if (product >= 6) return "high";
  if (product >= 3) return "medium";
  return "low";
}

export async function listRisksBySupplier(supplierId: number): Promise<SupplierRisk[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierRisks)
    .where(eq(supplierRisks.supplierId, supplierId))
    .orderBy(desc(supplierRisks.createdAt));
}

export async function getRiskById(id: number): Promise<SupplierRisk | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(supplierRisks).where(eq(supplierRisks.id, id)).limit(1);
  return row;
}

export async function createRisk(data: InsertSupplierRisk): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const values = { ...data, severity: deriveSeverity(data.likelihood ?? "medium", data.impact ?? "medium") };
  const result = await db.insert(supplierRisks).values(values);
  return (result[0] as any).insertId as number;
}

export async function updateRisk(id: number, data: Partial<InsertSupplierRisk>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const patch: Partial<InsertSupplierRisk> = { ...data };
  if (data.likelihood || data.impact) {
    const current = await getRiskById(id);
    patch.severity = deriveSeverity(data.likelihood ?? current?.likelihood ?? "medium", data.impact ?? current?.impact ?? "medium");
  }
  // Ao fechar/mitigar/aceitar, marca a data de resolução
  if (data.status && ["mitigated", "accepted", "closed"].includes(data.status) && !data.resolvedAt) {
    patch.resolvedAt = new Date();
  }
  await db.update(supplierRisks).set(patch).where(eq(supplierRisks.id, id));
}

export async function deleteRisk(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(supplierRisks).where(eq(supplierRisks.id, id));
}
