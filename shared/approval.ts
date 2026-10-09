// ============================================================================
// Política de alçada de aprovação por valor de contrato.
// Contratos com valor total acima do limite exigem aprovação da diretoria;
// abaixo, o gestor da área resolve. Centralizado para cliente, servidor e Atena.
// Ajuste o limite aqui (ou futuramente via env/config de banco).
// ============================================================================
export const APPROVAL_DIRECTOR_THRESHOLD_BRL = 50_000;

/** Retorna true se o valor do contrato exige aprovação da diretoria. */
export function requiresDirectorApproval(totalValue: number | string | null | undefined): boolean {
  const v = Number(totalValue || 0);
  return v > APPROVAL_DIRECTOR_THRESHOLD_BRL;
}

/** Texto curto para exibir a política na interface. */
export const APPROVAL_POLICY_LABEL =
  `Contratos acima de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(APPROVAL_DIRECTOR_THRESHOLD_BRL)} exigem aprovação da diretoria.`;
