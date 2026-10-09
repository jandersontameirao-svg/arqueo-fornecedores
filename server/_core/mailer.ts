// ============================================================================
// Envio de e-mail via SMTP (nodemailer). Configurado por variáveis de ambiente.
// Se o SMTP não estiver configurado, as funções viram no-op seguro (apenas logam),
// para não quebrar o sistema em ambientes sem e-mail.
//
// .env esperado:
//   SMTP_HOST=smtp.office365.com
//   SMTP_PORT=587
//   SMTP_SECURE=false            # true para porta 465
//   SMTP_USER=alertas@grupoarqueo.com.br
//   SMTP_PASS=***                # senha ou app-password
//   SMTP_FROM="Arqueo Fornecedores <alertas@grupoarqueo.com.br>"
//   ALERT_RECIPIENTS=fernanda@arqueoproject.com.br,janderson@grupoarqueo.com.br
// ============================================================================
import nodemailer, { type Transporter } from "nodemailer";

export function isMailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Destinatários padrão dos alertas administrativos (ALERT_RECIPIENTS, separados por vírgula). */
export function defaultAlertRecipients(): string[] {
  return (process.env.ALERT_RECIPIENTS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
}

let transporter: Transporter | null = null;
function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Envia um e-mail. Retorna true se enviado, false se SMTP não configurado ou falhou.
 * Nunca lança — falha de e-mail não deve derrubar o processo que a chamou.
 */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}): Promise<boolean> {
  const to = Array.isArray(opts.to) ? opts.to.filter(Boolean).join(",") : opts.to;
  if (!to) {
    console.warn("[mailer] sem destinatário — e-mail não enviado.");
    return false;
  }
  const tx = getTransporter();
  if (!tx) {
    console.log(`[mailer] SMTP não configurado — e-mail "${opts.subject}" para ${to} NÃO enviado (no-op).`);
    return false;
  }
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
    await tx.sendMail({ from, to, subject: opts.subject, html: opts.html, text: opts.text });
    console.log(`[mailer] e-mail enviado: "${opts.subject}" -> ${to}`);
    return true;
  } catch (e) {
    console.error(`[mailer] falha ao enviar "${opts.subject}" para ${to}:`, e);
    return false;
  }
}
