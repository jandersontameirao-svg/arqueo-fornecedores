/**
 * Notification stub — notificações desativadas.
 * Para reativar em produção externa, substitua este arquivo por
 * uma integração com SendGrid, AWS SES, Resend, etc.
 */

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Stub silencioso: registra no console e retorna true.
 * Não depende de BUILT_IN_FORGE_API_URL nem BUILT_IN_FORGE_API_KEY.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification] (desativado) ${payload.title}`);
  return true;
}
