import { notifyOwner } from "./_core/notification";
import * as db from "./db";

/**
 * Notification service for supplier management alerts
 * Sends alerts to project owner (gestor) and can be extended to send to suppliers
 */

export interface AlertNotification {
  type: "document_expiring" | "document_expired" | "approval_pending" | "supplier_registered" | "compliance_alert";
  title: string;
  message: string;
  supplierId?: number;
  supplierName?: string;
  documentName?: string;
  expirationDate?: Date;
}

/**
 * Send notification for document expiration alerts to gestor
 */
export async function notifyDocumentExpiring(
  supplierName: string,
  documentName: string,
  expirationDate: Date,
  daysUntilExpiration: number,
  supplierEmail?: string
): Promise<boolean> {
  const title = `⚠️ Documento Expirando - ${supplierName}`;
  const content = `
O documento **${documentName}** do fornecedor **${supplierName}** irá expirar em **${daysUntilExpiration} dias** (${expirationDate.toLocaleDateString("pt-BR")}).

**Ação necessária:** Solicite a renovação do documento ao fornecedor.

${supplierEmail ? `**Email do fornecedor:** ${supplierEmail}` : ""}

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  // Notify the gestor/owner
  const ownerNotified = await notifyOwner({ title, content });

  // TODO: In production, also send email to supplier if email is provided
  // This would integrate with an email service like SendGrid, AWS SES, etc.
  if (supplierEmail) {
    console.log(`[Notification] Would send email to supplier: ${supplierEmail}`);
    console.log(`[Notification] Subject: Documento "${documentName}" expira em ${daysUntilExpiration} dias`);
  }

  return ownerNotified;
}

/**
 * Send notification for expired documents to gestor and supplier
 */
export async function notifyDocumentExpired(
  supplierName: string,
  documentName: string,
  expirationDate: Date,
  supplierEmail?: string
): Promise<boolean> {
  const title = `🚨 Documento Expirado - ${supplierName}`;
  const content = `
O documento **${documentName}** do fornecedor **${supplierName}** **EXPIROU** em ${expirationDate.toLocaleDateString("pt-BR")}.

**Ação urgente:** O fornecedor pode estar em não conformidade. Solicite imediatamente a renovação do documento.

${supplierEmail ? `**Email do fornecedor:** ${supplierEmail}` : ""}

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  // Notify the gestor/owner
  const ownerNotified = await notifyOwner({ title, content });

  // TODO: In production, also send email to supplier
  if (supplierEmail) {
    console.log(`[Notification] Would send URGENT email to supplier: ${supplierEmail}`);
    console.log(`[Notification] Subject: URGENTE - Documento "${documentName}" EXPIRADO`);
  }

  return ownerNotified;
}

/**
 * Send notification for pending approvals
 */
export async function notifyApprovalPending(
  supplierName: string,
  stepName: string,
  workflowId: number
): Promise<boolean> {
  const title = `📋 Aprovação Pendente - ${supplierName}`;
  const content = `
O fornecedor **${supplierName}** está aguardando aprovação na etapa **${stepName}**.

**Ação necessária:** Acesse o sistema para revisar e aprovar/rejeitar o cadastro.

Workflow ID: #${workflowId}

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  return notifyOwner({ title, content });
}

/**
 * Send notification for new supplier registration via onboarding
 */
export async function notifyNewSupplierRegistration(
  supplierName: string,
  cnpj: string,
  supplierEmail?: string
): Promise<boolean> {
  const title = `🆕 Novo Fornecedor Cadastrado - ${supplierName}`;
  const content = `
Um novo fornecedor se cadastrou através do portal de onboarding:

**Empresa:** ${supplierName}
**CNPJ:** ${cnpj}
${supplierEmail ? `**Email:** ${supplierEmail}` : ""}

**Ação necessária:** Acesse o sistema para iniciar o processo de homologação.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  // Notify the gestor/owner
  const ownerNotified = await notifyOwner({ title, content });

  // Send welcome email to supplier
  if (supplierEmail) {
    console.log(`[Notification] Would send welcome email to supplier: ${supplierEmail}`);
    console.log(`[Notification] Subject: Bem-vindo ao Grupo Arqueo - Cadastro recebido`);
  }

  return ownerNotified;
}

/**
 * Send notification for compliance alerts
 */
export async function notifyComplianceAlert(
  alertTitle: string,
  supplierName: string,
  severity: "low" | "medium" | "high" | "critical",
  description?: string,
  supplierEmail?: string
): Promise<boolean> {
  const severityEmoji = {
    low: "ℹ️",
    medium: "⚠️",
    high: "🔶",
    critical: "🚨",
  };

  const severityLabel = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  };

  const title = `${severityEmoji[severity]} Alerta de Conformidade - ${supplierName}`;
  const content = `
**Alerta:** ${alertTitle}
**Fornecedor:** ${supplierName}
**Severidade:** ${severityLabel[severity]}
${description ? `\n**Detalhes:** ${description}` : ""}

**Ação necessária:** Verifique a situação e tome as medidas apropriadas.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  // Notify the gestor/owner
  const ownerNotified = await notifyOwner({ title, content });

  // For high/critical alerts, also notify supplier
  if (supplierEmail && (severity === "high" || severity === "critical")) {
    console.log(`[Notification] Would send alert email to supplier: ${supplierEmail}`);
    console.log(`[Notification] Subject: Alerta de Conformidade - ${alertTitle}`);
  }

  return ownerNotified;
}

/**
 * Send notification to supplier about document renewal request
 */
export async function notifySupplierDocumentRenewal(
  supplierName: string,
  supplierEmail: string,
  documentName: string,
  expirationDate: Date,
  daysUntilExpiration: number
): Promise<boolean> {
  // Log the notification (in production, this would send an actual email)
  console.log(`[Notification] Sending document renewal request to supplier`);
  console.log(`[Notification] To: ${supplierEmail}`);
  console.log(`[Notification] Subject: Solicitação de Renovação de Documento - ${documentName}`);
  console.log(`[Notification] Document expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString("pt-BR")})`);

  // In production, integrate with email service:
  // await sendEmail({
  //   to: supplierEmail,
  //   subject: `Solicitação de Renovação de Documento - ${documentName}`,
  //   template: "document_renewal",
  //   data: { supplierName, documentName, expirationDate, daysUntilExpiration }
  // });

  return true;
}

/**
 * Verifica e envia notificações para documentos que vencem em 7 dias
 * Usa tabela de rastreamento para evitar duplicidade
 * Deve ser chamada diariamente via job agendado
 */
export async function checkAndNotifyExpiring7Days(): Promise<{
  checked: number;
  notified: number;
}> {
  const docsExpiring7Days = await db.getDocumentsExpiringInDaysWithoutNotification(7);
  let notified = 0;

  for (const doc of docsExpiring7Days) {
    if (!doc.document.expiresAt || !doc.supplier) continue;

    const supplierEmail = doc.supplier.email || undefined;

    const success = await notifyDocumentExpiring(
      doc.supplier.companyName,
      doc.document.name,
      doc.document.expiresAt,
      7,
      supplierEmail
    );

    if (success) {
      // Registra que a notificação foi enviada para evitar duplicidade
      await db.recordDocumentExpirationNotification({
        documentId: doc.document.id,
        supplierId: doc.supplier.id,
        daysBeforeExpiration: 7,
        notificationTitle: `⚠️ Documento Expirando em 7 dias - ${doc.supplier.companyName}`,
      });
      notified++;
    }
  }

  return { checked: docsExpiring7Days.length, notified };
}

/**
 * Check and send notifications for expiring documents
 * This function should be called periodically (e.g., daily via cron job)
 */
export async function checkAndNotifyExpiringDocuments(): Promise<{
  checked: number;
  notified: number;
  supplierNotifications: number;
}> {
  // Janela crítica: somente documentos com ≤15 dias para vencer
  const expiringDocs = await db.getExpiringDocuments(15);
  let notified = 0;
  let supplierNotifications = 0;

  for (const doc of expiringDocs) {
    if (!doc.document.expiresAt || !doc.supplier) continue;

    const daysUntilExpiration = Math.ceil(
      (doc.document.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const supplierEmail = doc.supplier.email || undefined;

    // Notificar somente em 15, 7, 3 e 1 dia(s) antes da expiração (janela crítica)
    if ([15, 7, 3, 1].includes(daysUntilExpiration)) {
      // Notify gestor
      const success = await notifyDocumentExpiring(
        doc.supplier.companyName,
        doc.document.name,
        doc.document.expiresAt,
        daysUntilExpiration,
        supplierEmail
      );
      if (success) notified++;

      // Also notify supplier directly
      if (supplierEmail) {
        await notifySupplierDocumentRenewal(
          doc.supplier.companyName,
          supplierEmail,
          doc.document.name,
          doc.document.expiresAt,
          daysUntilExpiration
        );
        supplierNotifications++;
      }
    }

    // Notify if already expired
    if (daysUntilExpiration <= 0) {
      const success = await notifyDocumentExpired(
        doc.supplier.companyName,
        doc.document.name,
        doc.document.expiresAt,
        supplierEmail
      );
      if (success) notified++;
    }
  }

  return { checked: expiringDocs.length, notified, supplierNotifications };
}

/**
 * Send batch notifications for all expiring documents
 * Groups notifications by supplier to avoid spam
 */
export async function sendBatchExpirationNotifications(): Promise<{
  suppliersNotified: number;
  documentsIncluded: number;
}> {
  // Janela crítica: somente documentos com ≤15 dias para vencer
  const expiringDocs = await db.getExpiringDocuments(15);
  
  // Group by supplier
  const supplierDocs = new Map<number, {
    supplier: typeof expiringDocs[0]["supplier"];
    documents: typeof expiringDocs;
  }>();

  for (const doc of expiringDocs) {
    if (!doc.supplier) continue;
    
    if (!supplierDocs.has(doc.supplier.id)) {
      supplierDocs.set(doc.supplier.id, {
        supplier: doc.supplier,
        documents: [],
      });
    }
    supplierDocs.get(doc.supplier.id)!.documents.push(doc);
  }

  let suppliersNotified = 0;
  let documentsIncluded = 0;

  for (const [supplierId, data] of Array.from(supplierDocs.entries())) {
    const { supplier, documents } = data;
    if (!supplier) continue;

    // Build summary for gestor
    const docList = documents.map((d: typeof expiringDocs[0]) => {
      const days = Math.ceil(
        (d.document.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return `- ${d.document.name}: ${days <= 0 ? "EXPIRADO" : `expira em ${days} dias`}`;
    }).join("\n");

    const title = `📋 Resumo de Documentos - ${supplier.companyName}`;
    const content = `
**Fornecedor:** ${supplier.companyName}
**CNPJ:** ${supplier.cnpj}
**Email:** ${supplier.email || "Não informado"}

**Documentos que requerem atenção:**
${docList}

**Ação necessária:** Verifique os documentos e solicite renovação quando necessário.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
    `.trim();

    await notifyOwner({ title, content });
    suppliersNotified++;
    documentsIncluded += documents.length;
  }

  return { suppliersNotified, documentsIncluded };
}

/**
 * Notifica o gestor sobre contratos cuja vigência efetiva vence em 7 dias.
 * A vigência efetiva considera aditivos ativos com nova data de término.
 * Usa tabela de rastreamento para evitar duplicidade de notificações.
 * Deve ser chamada diariamente via job agendado.
 */
export async function checkAndNotifyExpiringContracts7Days(): Promise<{
  checked: number;
  notified: number;
}> {
  const expiringContracts = await db.getContractsExpiringInDaysWithoutNotification(7);
  let notified = 0;

  for (const row of expiringContracts) {
    const { contract, effectiveEndDate, source, amendmentTitle } = row;
    if (!effectiveEndDate) continue;

    const sourceLabel = source === "amendment" && amendmentTitle
      ? ` (prorrogado pelo aditivo: ${amendmentTitle})`
      : source === "amendment"
      ? " (prorrogado por aditivo)"
      : " (vigência original)";

    const title = `⚠️ Contrato Vencendo em 7 dias — ${contract.title}`;
    const content = `
O contrato **${contract.title}**${contract.number ? ` (#${contract.number})` : ""} vencerá em **7 dias** (${new Date(effectiveEndDate).toLocaleDateString("pt-BR")})${sourceLabel}.

**Fornecedor:** ID ${contract.supplierId}
**Status atual:** ${contract.status}
${contract.totalValue ? `**Valor:** R$ ${parseFloat(contract.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}

**Ação necessária:** Verifique a necessidade de renovação, aditivo ou encerramento do contrato.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
    `.trim();

    const success = await notifyOwner({ title, content });

    if (success) {
      await db.recordContractExpirationNotification({
        contractId: contract.id,
        supplierId: contract.supplierId,
        daysBeforeExpiration: 7,
        effectiveDateSource: source,
        amendmentId: row.amendmentId,
        notificationTitle: title,
      });
      notified++;
    }
  }

  return { checked: expiringContracts.length, notified };
}
