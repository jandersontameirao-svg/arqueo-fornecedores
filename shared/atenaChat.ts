// Configuração do chat da Atena compartilhada entre cliente e servidor.
//
// Apenas estes e-mails podem EXCLUIR o próprio histórico de conversa da Atena.
// Os demais usuários têm o chat sempre preservado (sem opção de excluir).
export const ATENA_CAN_CLEAR_CHAT_EMAILS: ReadonlySet<string> = new Set([
  "fernanda@arqueoproject.com.br",
  "janderson@grupoarqueo.com.br",
]);

/** Verifica (case-insensitive) se o usuário pode excluir o próprio chat da Atena. */
export function canClearAtenaChat(email: string | null | undefined): boolean {
  if (!email) return false;
  return ATENA_CAN_CLEAR_CHAT_EMAILS.has(email.toLowerCase().trim());
}

// Superusuários da Atena: podem OPERACIONALIZAR tudo (poder total), independente
// do cargo. Os demais usuários operam no máximo o que o próprio cargo autoriza.
export const ATENA_SUPERUSER_EMAILS: ReadonlySet<string> = new Set([
  "fernanda@arqueoproject.com.br",
  "janderson@grupoarqueo.com.br",
]);

/** Verifica (case-insensitive) se o usuário é superusuário da Atena (poder total). */
export function isAtenaSuperuser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ATENA_SUPERUSER_EMAILS.has(email.toLowerCase().trim());
}
