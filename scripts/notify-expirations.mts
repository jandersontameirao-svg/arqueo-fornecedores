// ============================================================================
// Job diário: alertas proativos de vencimento (documentos e contratos).
// Dispara as notificações ao gestor/diretoria sem ninguém precisar abrir o sistema.
//
// Rodar na VPS via cron (exemplo, todo dia 08:00):
//   0 8 * * * cd /var/www/arqueo-fornecedores && /usr/bin/env npx tsx scripts/notify-expirations.mts >> logs/notify-expirations.log 2>&1
//
// As funções são idempotentes por dia (usam tabela de rastreamento para não duplicar).
// Entrega hoje: notificação in-app ao gestor (notifyOwner). E-mail ao fornecedor
// depende de serviço/conector de e-mail configurado (ver TODO em server/notifications.ts).
// ============================================================================
import {
  sendBatchExpirationNotifications,
  checkAndNotifyExpiringDocuments,
  checkAndNotifyExpiringContracts7Days,
} from "../server/notifications";
import * as db from "../server/db";
import { sendMail, isMailConfigured, defaultAlertRecipients } from "../server/_core/mailer";

// Monta e envia o digest por e-mail à diretoria (se SMTP + destinatários configurados).
async function emailDigest() {
  const recipients = defaultAlertRecipients();
  if (!isMailConfigured() || recipients.length === 0) {
    console.log("[notify-expirations] e-mail não enviado (SMTP ou ALERT_RECIPIENTS ausentes).");
    return;
  }
  const [docs, contracts] = await Promise.all([
    db.getExpiringDocuments(30),
    db.getExecutiveContractSummary(),
  ]);
  const rows = (docs as any[]).slice(0, 50).map((d: any) => {
    const doc = d.document ?? d;
    const venc = doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString("pt-BR") : "—";
    return `<li>${doc.name} — vence em <b>${venc}</b></li>`;
  }).join("");
  const html = `
    <h2>Resumo de vencimentos — Gestão de Fornecedores</h2>
    <p><b>Contratos ativos:</b> ${contracts.activeCount} · <b>Vencem em 30 dias:</b> ${contracts.expiring30} · <b>60 dias:</b> ${contracts.expiring60} · <b>90 dias:</b> ${contracts.expiring90}</p>
    <h3>Documentos vencendo em até 30 dias</h3>
    <ul>${rows || "<li>Nenhum documento vencendo. 🎉</li>"}</ul>
    <hr><small>E-mail automático do Sistema de Gestão de Fornecedores — Grupo Arqueo.</small>`;
  await sendMail({
    to: recipients,
    subject: `[Arqueo] Vencimentos — ${new Date().toLocaleDateString("pt-BR")}`,
    html,
  });
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[notify-expirations] início ${startedAt}`);

  const docsBatch = await sendBatchExpirationNotifications();
  console.log(`[notify-expirations] resumo por fornecedor: ${docsBatch.suppliersNotified} fornecedor(es), ${docsBatch.documentsIncluded} documento(s)`);

  const docsIndividual = await checkAndNotifyExpiringDocuments();
  console.log(`[notify-expirations] documentos individuais: ${JSON.stringify(docsIndividual)}`);

  const contracts = await checkAndNotifyExpiringContracts7Days();
  console.log(`[notify-expirations] contratos (7 dias): ${JSON.stringify(contracts)}`);

  await emailDigest();

  console.log(`[notify-expirations] concluído`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[notify-expirations] ERRO:", err);
    process.exit(1);
  });
