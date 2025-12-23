import * as db from "./db";

/**
 * Report generation service for supplier management
 * Generates CSV/Excel-compatible data and formatted reports
 */

export interface ReportOptions {
  format: "csv" | "json";
  filters?: {
    status?: string;
    categoryId?: number;
    criticality?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

/**
 * Generate suppliers report
 */
export async function generateSuppliersReport(options: ReportOptions): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  const suppliers = await db.getAllSuppliers({
    status: options.filters?.status,
    categoryId: options.filters?.categoryId,
    criticality: options.filters?.criticality,
  });

  const rows = suppliers.map((s) => ({
    "ID": s.supplier.id,
    "Razão Social": s.supplier.companyName,
    "Nome Fantasia": s.supplier.tradeName || "",
    "CNPJ": s.supplier.cnpj,
    "Email": s.supplier.email,
    "Telefone": s.supplier.phone || "",
    "Cidade": s.supplier.city || "",
    "Estado": s.supplier.state || "",
    "Status": translateStatus(s.supplier.status),
    "Criticidade": translateCriticality(s.supplier.criticality),
    "Categoria": s.category?.name || "",
    "Data Cadastro": formatDate(s.supplier.createdAt),
  }));

  if (options.format === "csv") {
    const csv = convertToCSV(rows);
    return {
      data: csv,
      filename: `fornecedores_${formatDateForFilename(new Date())}.csv`,
      contentType: "text/csv; charset=utf-8",
    };
  }

  return {
    data: JSON.stringify(rows, null, 2),
    filename: `fornecedores_${formatDateForFilename(new Date())}.json`,
    contentType: "application/json",
  };
}

/**
 * Generate documents report
 */
export async function generateDocumentsReport(options: ReportOptions & {
  supplierId?: number;
  expirationStatus?: string;
}): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  const documents = await db.getAllDocuments({
    type: options.filters?.status,
    expirationStatus: options.expirationStatus,
  });

  const rows = documents.map((d) => ({
    "ID": d.document.id,
    "Nome": d.document.name,
    "Tipo": translateDocumentType(d.document.type),
    "Fornecedor": d.supplier?.companyName || "",
    "CNPJ Fornecedor": d.supplier?.cnpj || "",
    "Data Upload": formatDate(d.document.createdAt),
    "Data Expiração": d.document.expiresAt ? formatDate(d.document.expiresAt) : "Sem validade",
    "Status": getDocumentStatus(d.document.expiresAt),
    "Enviado Por": d.uploadedBy?.name || "",
  }));

  if (options.format === "csv") {
    const csv = convertToCSV(rows);
    return {
      data: csv,
      filename: `documentos_${formatDateForFilename(new Date())}.csv`,
      contentType: "text/csv; charset=utf-8",
    };
  }

  return {
    data: JSON.stringify(rows, null, 2),
    filename: `documentos_${formatDateForFilename(new Date())}.json`,
    contentType: "application/json",
  };
}

/**
 * Generate evaluations report
 */
export async function generateEvaluationsReport(options: ReportOptions & {
  supplierId?: number;
}): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  const evaluations = await db.getLatestEvaluations(1000);

  const rows = evaluations.map((e: { evaluation: any; supplier: any }) => ({
    "ID": e.evaluation.id,
    "Fornecedor": e.supplier?.companyName || "",
    "CNPJ": e.supplier?.cnpj || "",
    "Período": e.evaluation.period,
    "Qualidade": e.evaluation.qualityScore,
    "Entrega": e.evaluation.deliveryScore,
    "Preço": e.evaluation.priceScore,
    "Comunicação": e.evaluation.communicationScore,
    "Média Geral": e.evaluation.overallScore,
    "Avaliador": "",
    "Data Avaliação": formatDate(e.evaluation.createdAt),
    "Comentários": e.evaluation.comments || "",
  }));

  if (options.format === "csv") {
    const csv = convertToCSV(rows);
    return {
      data: csv,
      filename: `avaliacoes_${formatDateForFilename(new Date())}.csv`,
      contentType: "text/csv; charset=utf-8",
    };
  }

  return {
    data: JSON.stringify(rows, null, 2),
    filename: `avaliacoes_${formatDateForFilename(new Date())}.json`,
    contentType: "application/json",
  };
}

/**
 * Generate compliance/audit report
 */
export async function generateAuditReport(options: ReportOptions & {
  entityType?: string;
  action?: string;
}): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  const logs = await db.getAuditLogs({
    entityType: options.entityType,
    // action filter not supported in current implementation
    limit: 1000,
  });

  const rows = logs.map((item) => ({
    "ID": item.log.id,
    "Data/Hora": formatDateTime(item.log.createdAt),
    "Entidade": translateEntityType(item.log.entityType),
    "ID Entidade": item.log.entityId,
    "Ação": translateAction(item.log.action),
    "Usuário": item.log.userEmail || item.user?.name || "",
    "Alterações": JSON.stringify(item.log.changes || {}),
  }));

  if (options.format === "csv") {
    const csv = convertToCSV(rows);
    return {
      data: csv,
      filename: `auditoria_${formatDateForFilename(new Date())}.csv`,
      contentType: "text/csv; charset=utf-8",
    };
  }

  return {
    data: JSON.stringify(rows, null, 2),
    filename: `auditoria_${formatDateForFilename(new Date())}.json`,
    contentType: "application/json",
  };
}

/**
 * Generate expiring documents summary report
 */
export async function generateExpiringDocumentsReport(daysAhead: number = 30): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  const expiringDocs = await db.getExpiringDocuments(daysAhead);

  const rows = expiringDocs.map((d) => {
    const daysUntil = d.document.expiresAt
      ? Math.ceil((d.document.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      "Fornecedor": d.supplier?.companyName || "",
      "CNPJ": d.supplier?.cnpj || "",
      "Email Fornecedor": d.supplier?.email || "",
      "Documento": d.document.name,
      "Tipo": translateDocumentType(d.document.type),
      "Data Expiração": d.document.expiresAt ? formatDate(d.document.expiresAt) : "",
      "Dias Restantes": daysUntil !== null ? (daysUntil <= 0 ? "EXPIRADO" : daysUntil.toString()) : "",
      "Status": daysUntil !== null ? (daysUntil <= 0 ? "Expirado" : daysUntil <= 7 ? "Crítico" : daysUntil <= 15 ? "Urgente" : "Atenção") : "",
    };
  });

  const csv = convertToCSV(rows);
  return {
    data: csv,
    filename: `documentos_expirando_${formatDateForFilename(new Date())}.csv`,
    contentType: "text/csv; charset=utf-8",
  };
}

// Helper functions
function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(";"), // Use semicolon for Excel compatibility in PT-BR
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains special chars
        const stringValue = String(value ?? "");
        if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(";")
    ),
  ];

  // Add BOM for Excel UTF-8 compatibility
  return "\uFEFF" + csvRows.join("\n");
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatDateTime(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("pt-BR");
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

function translateStatus(status: string | null): string {
  const map: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    suspended: "Suspenso",
  };
  return map[status || ""] || status || "";
}

function translateCriticality(criticality: string | null): string {
  const map: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  };
  return map[criticality || ""] || criticality || "";
}

function translateDocumentType(type: string): string {
  const map: Record<string, string> = {
    contract: "Contrato",
    certificate: "Certidão",
    invoice: "Nota Fiscal",
    license: "Licença",
    insurance: "Seguro",
    registration: "Registro",
    other: "Outro",
  };
  return map[type] || type;
}

function translateEntityType(type: string): string {
  const map: Record<string, string> = {
    supplier: "Fornecedor",
    document: "Documento",
    user: "Usuário",
    workflow: "Workflow",
    evaluation: "Avaliação",
    contact: "Contato",
    interaction: "Interação",
  };
  return map[type] || type;
}

function translateAction(action: string): string {
  const map: Record<string, string> = {
    create: "Criação",
    update: "Atualização",
    delete: "Exclusão",
    upload: "Upload",
    approve: "Aprovação",
    reject: "Rejeição",
    login: "Login",
    logout: "Logout",
  };
  return map[action] || action;
}

function getDocumentStatus(expiresAt: Date | null): string {
  if (!expiresAt) return "Válido";
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Expirado";
  if (days <= 7) return "Crítico";
  if (days <= 15) return "Urgente";
  if (days <= 30) return "Atenção";
  return "Válido";
}
