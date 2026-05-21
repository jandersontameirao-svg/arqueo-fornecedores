/**
 * LISTA BRANCA DE SUPERADMINS — IMUTÁVEL EM RUNTIME
 *
 * Apenas estes emails podem ter o papel superadmin_global.
 * Qualquer tentativa de atribuir superadmin_global a outro email
 * será bloqueada no upsertUser, no resolveOrgContext e no updateUserGlobalRole.
 *
 * Para adicionar ou remover um superadmin, edite esta lista e faça deploy.
 * Não é possível promover superadmins via interface ou banco de dados.
 */
export const SUPERADMIN_EMAILS: ReadonlySet<string> = new Set([
  "jandersontameirao@gmail.com",
  "fernanda@arqueoproject.com.br",
]);

/**
 * Verifica se um email pertence à lista branca de superadmins.
 * Comparação case-insensitive para evitar bypass por capitalização.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.has(email.toLowerCase().trim());
}
