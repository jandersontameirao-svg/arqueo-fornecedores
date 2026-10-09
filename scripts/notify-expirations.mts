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

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[notify-expirations] início ${startedAt}`);

  const docsBatch = await sendBatchExpirationNotifications();
  console.log(`[notify-expirations] resumo por fornecedor: ${docsBatch.suppliersNotified} fornecedor(es), ${docsBatch.documentsIncluded} documento(s)`);

  const docsIndividual = await checkAndNotifyExpiringDocuments();
  console.log(`[notify-expirations] documentos individuais: ${JSON.stringify(docsIndividual)}`);

  const contracts = await checkAndNotifyExpiringContracts7Days();
  console.log(`[notify-expirations] contratos (7 dias): ${JSON.stringify(contracts)}`);

  console.log(`[notify-expirations] concluído`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[notify-expirations] ERRO:", err);
    process.exit(1);
  });
