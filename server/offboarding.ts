// ============================================================================
// MÓDULO: OFFBOARDING — checklist de encerramento de fornecedor.
// ============================================================================
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { offboardingChecklists, type OffboardingChecklist } from "../drizzle/schema";

export type ChecklistItem = { id: string; label: string; done: boolean; doneAt?: string | null; doneById?: number | null; notes?: string };

/** Itens padrão de encerramento (boas práticas de TPRM / LGPD). */
export function defaultItems(): ChecklistItem[] {
  const labels = [
    "Revogar acessos a sistemas e credenciais",
    "Encerrar / rescindir contratos ativos",
    "Recuperar ou devolver ativos e equipamentos",
    "Confirmar exclusão/devolução de dados sensíveis (LGPD)",
    "Quitar pendências financeiras",
    "Comunicar áreas internas envolvidas",
    "Arquivar documentação e avaliação final",
    "Atualizar status do fornecedor para inativo",
  ];
  return labels.map((label, i) => ({ id: `item_${i + 1}`, label, done: false, doneAt: null, doneById: null }));
}

/** Retorna o checklist mais recente do fornecedor (ou null). */
export async function getBySupplier(supplierId: number): Promise<OffboardingChecklist | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(offboardingChecklists)
    .where(eq(offboardingChecklists.supplierId, supplierId))
    .orderBy(desc(offboardingChecklists.createdAt)).limit(1);
  return row ?? null;
}

export async function getById(id: number): Promise<OffboardingChecklist | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(offboardingChecklists).where(eq(offboardingChecklists.id, id)).limit(1);
  return row;
}

export async function start(data: {
  supplierId: number; reason?: string; startedById?: number; organizationalGroupId?: number | null;
}): Promise<OffboardingChecklist> {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const result = await db.insert(offboardingChecklists).values({
    supplierId: data.supplierId, reason: data.reason, items: defaultItems() as any,
    status: "in_progress", startedById: data.startedById,
    organizationalGroupId: data.organizationalGroupId ?? null,
  });
  const id = (result[0] as any).insertId as number;
  return (await getById(id))!;
}

export async function updateItems(id: number, items: ChecklistItem[], userId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // preenche doneAt/doneById quando um item passa a concluído
  const stamped = items.map((it) => it.done && !it.doneAt
    ? { ...it, doneAt: new Date().toISOString(), doneById: userId ?? it.doneById ?? null }
    : it);
  await db.update(offboardingChecklists).set({ items: stamped as any }).where(eq(offboardingChecklists.id, id));
}

export async function setStatus(id: number, status: OffboardingChecklist["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const patch: any = { status };
  if (status === "completed") patch.completedAt = new Date();
  await db.update(offboardingChecklists).set(patch).where(eq(offboardingChecklists.id, id));
}
