import { notifyOwner } from "./_core/notification";
import * as db from "./db";

/**
 * Notification service for supplier management alerts
 * Uses the built-in Manus notification system to send alerts to the project owner
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
 * Send notification for document expiration alerts
 */
export async function notifyDocumentExpiring(
  supplierName: string,
  documentName: string,
  expirationDate: Date,
  daysUntilExpiration: number
): Promise<boolean> {
  const title = `⚠️ Documento Expirando - ${supplierName}`;
  const content = `
O documento **${documentName}** do fornecedor **${supplierName}** irá expirar em **${daysUntilExpiration} dias** (${expirationDate.toLocaleDateString("pt-BR")}).

**Ação necessária:** Solicite a renovação do documento ao fornecedor.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  return notifyOwner({ title, content });
}

/**
 * Send notification for expired documents
 */
export async function notifyDocumentExpired(
  supplierName: string,
  documentName: string,
  expirationDate: Date
): Promise<boolean> {
  const title = `🚨 Documento Expirado - ${supplierName}`;
  const content = `
O documento **${documentName}** do fornecedor **${supplierName}** **EXPIROU** em ${expirationDate.toLocaleDateString("pt-BR")}.

**Ação urgente:** O fornecedor pode estar em não conformidade. Solicite imediatamente a renovação do documento.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  return notifyOwner({ title, content });
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
  cnpj: string
): Promise<boolean> {
  const title = `🆕 Novo Fornecedor Cadastrado - ${supplierName}`;
  const content = `
Um novo fornecedor se cadastrou através do portal de onboarding:

**Empresa:** ${supplierName}
**CNPJ:** ${cnpj}

**Ação necessária:** Acesse o sistema para iniciar o processo de homologação.

---
*Notificação automática do Sistema de Gestão de Fornecedores - Grupo Arqueo*
  `.trim();

  return notifyOwner({ title, content });
}

/**
 * Send notification for compliance alerts
 */
export async function notifyComplianceAlert(
  alertTitle: string,
  supplierName: string,
  severity: "low" | "medium" | "high" | "critical",
  description?: string
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

  return notifyOwner({ title, content });
}

/**
 * Check and send notifications for expiring documents
 * This function should be called periodically (e.g., daily via cron job)
 */
export async function checkAndNotifyExpiringDocuments(): Promise<{
  checked: number;
  notified: number;
}> {
  const expiringDocs = await db.getExpiringDocuments(30); // Documents expiring in 30 days
  let notified = 0;

  for (const doc of expiringDocs) {
    if (!doc.document.expiresAt || !doc.supplier) continue;

    const daysUntilExpiration = Math.ceil(
      (doc.document.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Notify at 30, 15, 7, 3, and 1 day(s) before expiration
    if ([30, 15, 7, 3, 1].includes(daysUntilExpiration)) {
      const success = await notifyDocumentExpiring(
        doc.supplier.companyName,
        doc.document.name,
        doc.document.expiresAt,
        daysUntilExpiration
      );
      if (success) notified++;
    }

    // Notify if already expired
    if (daysUntilExpiration <= 0) {
      const success = await notifyDocumentExpired(
        doc.supplier.companyName,
        doc.document.name,
        doc.document.expiresAt
      );
      if (success) notified++;
    }
  }

  return { checked: expiringDocs.length, notified };
}
