/**
 * Clicksign API v3 Integration Service
 * 
 * Fluxo completo:
 * 1. createEnvelope → cria envelope (draft)
 * 2. addDocument → adiciona documento PDF ao envelope
 * 3. addSigner → adiciona signatário ao envelope
 * 4. addRequirement → vincula signatário ao documento com ação (sign/agree)
 * 5. activateEnvelope → ativa o envelope para assinatura
 * 6. sendNotification → envia notificação por e-mail aos signatários
 */

import PDFDocument from "pdfkit";
import crypto from "node:crypto";
import { ENV } from "./_core/env";

// ==================== TYPES ====================

export interface ClicksignConfig {
  apiKey: string;
  apiUrl: string;
}

export interface ClicksignEnvelope {
  id: string;
  status: string;
  name: string;
}

export interface ClicksignDocument {
  id: string;
  filename: string;
}

export interface ClicksignSigner {
  id: string;
  name: string;
  email: string;
}

export interface ClicksignRequirement {
  id: string;
}

export interface ClicksignApiError {
  status: number;
  message: string;
  errors?: any[];
  requestId?: string;
}

export interface ClicksignApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ClicksignApiError;
  requestId?: string;
}

// ==================== CONFIG ====================

function getConfig(): ClicksignConfig {
  return {
    apiKey: ENV.clicksignApiKey,
    apiUrl: ENV.clicksignApiUrl,
  };
}

export function isClicksignConfigured(): boolean {
  const config = getConfig();
  return !!(config.apiKey && config.apiKey.length > 0);
}

// ==================== HTTP HELPER ====================

async function clicksignRequest<T>(
  method: string,
  path: string,
  body?: any,
  retries = 2,
): Promise<ClicksignApiResponse<T>> {
  const config = getConfig();
  
  if (!config.apiKey) {
    return {
      success: false,
      error: {
        status: 0,
        message: "Clicksign API Key não configurada. Configure a variável CLICKSIGN_API_KEY nas configurações do sistema.",
      },
    };
  }

  const url = `${config.apiUrl}${path}`;
  const headers: Record<string, string> = {
    "Authorization": config.apiKey,
    "Content-Type": "application/vnd.api+json",
    "Accept": "application/vnd.api+json",
  };

  let lastError: string = "fetch failed";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // AbortSignal must be created fresh per attempt — it cannot be reused after abort
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(30_000),
      };

      if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
        fetchOptions.body = JSON.stringify(body);
      }

      if (attempt > 0) {
        console.log(`[Clicksign] Retry ${attempt}/${retries}: ${method} ${url}`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      } else {
        console.log(`[Clicksign] ${method} ${url}`);
      }
    
      const response = await fetch(url, fetchOptions);
      const requestId = response.headers.get("x-request-id") || undefined;

      // Read body once as text to avoid "Body already read" error on retry
      const bodyText = await response.text();

      if (!response.ok) {
        let errorBody: any = {};
        let isHtmlResponse = false;
        
        try {
          errorBody = bodyText ? JSON.parse(bodyText) : {};
        } catch {
          // Check if response is HTML (error page)
          if (bodyText && bodyText.trim().startsWith('<')) {
            isHtmlResponse = true;
            errorBody = { 
              message: `Clicksign retornou erro ${response.status} (página HTML). Verifique: (1) URL da API, (2) Chave de API, (3) Status do Clicksign.`,
              htmlResponse: true,
              statusCode: response.status,
            };
          } else {
            errorBody = { message: bodyText || `HTTP ${response.status}` };
          }
        }

        const errorMsg = isHtmlResponse 
          ? errorBody.message 
          : (errorBody?.errors?.[0]?.detail || errorBody?.message || `HTTP ${response.status}`);
        
        console.error(`[Clicksign] Error ${response.status}: ${errorMsg}`);
        if (isHtmlResponse) {
          console.error(`[Clicksign] HTML Response detected (first 200 chars): ${bodyText.substring(0, 200)}`);
        }

        // Non-transient errors: return immediately without retry
        return {
          success: false,
          error: {
            status: response.status,
            message: errorMsg,
            errors: errorBody?.errors,
            requestId,
          },
          requestId,
        };
      }

      // Some endpoints return 204 No Content
      if (response.status === 204) {
        return { success: true, requestId };
      }

      const responseData = bodyText ? JSON.parse(bodyText) : {}
      return {
        success: true,
        data: responseData?.data as T,
        requestId,
      };
    } catch (err: any) {
      lastError = err.message || "fetch failed";
      console.error(`[Clicksign] Network error (attempt ${attempt + 1}/${retries + 1}): ${lastError}`);
      // Continue to next retry iteration
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: {
      status: 0,
      message: `Erro de conexão com Clicksign após ${retries + 1} tentativas: ${lastError}`,
    },
  };
}

// ==================== API METHODS ====================

/**
 * Step 1: Create an envelope (draft state)
 */
export async function createEnvelope(name: string): Promise<ClicksignApiResponse<ClicksignEnvelope>> {
  return clicksignRequest<ClicksignEnvelope>("POST", "/envelopes", {
    data: {
      type: "envelopes",
      attributes: {
        name,
      },
    },
  });
}

/**
 * Step 2: Add a document to the envelope (PDF as base64)
 */
export async function addDocument(
  envelopeId: string,
  filename: string,
  contentBase64: string,
): Promise<ClicksignApiResponse<ClicksignDocument>> {
  return clicksignRequest<ClicksignDocument>("POST", `/envelopes/${envelopeId}/documents`, {
    data: {
      type: "documents",
      attributes: {
        filename,
        content_base64: contentBase64,
      },
    },
  });
}

/**
 * Format a raw CPF/CNPJ digits string into the masked format expected by Clicksign API:
 * CPF (11 digits): ###.###.###-##
 * CNPJ (14 digits): ##.###.###/####-##
 */
function formatDocumentation(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    // CPF: ###.###.###-##
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 14) {
    // CNPJ: ##.###.###/####-##
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  return undefined; // invalid length — omit field
}

/**
 * Validate signer name format for Clicksign API
 * Clicksign requires full name (first + last name), minimum 2 words, each with at least 2 characters
 */
function validateSignerName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  // Must contain at least one letter
  if (!/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/i.test(trimmed)) {
    return { valid: false, error: "Nome deve conter pelo menos uma letra" };
  }

  // Clicksign requires full name: at least 2 words, each with at least 2 characters
  const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
  if (words.length < 2) {
    return { valid: false, error: "Informe o nome completo (nome e sobrenome)" };
  }
  
  return { valid: true };
}

export async function addSignerToEnvelope(
  envelopeId: string,
  signer: {
    name: string;
    email: string;
    documentation?: string;
    communicateEvents?: boolean;
    refusable?: boolean;
  },
): Promise<ClicksignApiResponse<ClicksignSigner>> {
  // Validate signer name before sending to Clicksign
  const nameValidation = validateSignerName(signer.name);
  if (!nameValidation.valid) {
    return {
      success: false,
      error: { message: nameValidation.error || "Nome invalido", status: 400 },
      requestId: undefined,
    };
  }

  // Format documentation with mask (Clicksign API requires masked CPF/CNPJ)
  const formattedDoc = signer.documentation
    ? formatDocumentation(signer.documentation)
    : undefined;

  return clicksignRequest<ClicksignSigner>("POST", `/envelopes/${envelopeId}/signers`, {
    data: {
      type: "signers",
      attributes: {
        name: signer.name,
        email: signer.email,
        ...(formattedDoc ? { documentation: formattedDoc } : {}),
        // communicate_events must be a hash with string values (not boolean)
        // Valid values: 'none', 'email', 'whatsapp', 'sms'
        communicate_events: {
          signature_request: "email",
          signature_reminder: "email",
        },
        refusable: signer.refusable !== false, // default true
      },
    },
  });
}

/**
 * Step 4a: Add a QUALIFICATION requirement (link signer to document with role)
 * Required for envelope activation: each document must have at least one qualification per signer.
 */
export async function addQualificationRequirement(
  envelopeId: string,
  documentId: string,
  signerId: string,
  role: "sign" | "approve" | "acknowledge" | "witness" = "sign",
): Promise<ClicksignApiResponse<ClicksignRequirement>> {
  return clicksignRequest<ClicksignRequirement>("POST", `/envelopes/${envelopeId}/requirements`, {
    data: {
      type: "requirements",
      attributes: {
        action: "agree",
        role,
      },
      relationships: {
        document: {
          data: { type: "documents", id: documentId },
        },
        signer: {
          data: { type: "signers", id: signerId },
        },
      },
    },
  });
}

/**
 * Step 4b: Add an AUTHENTICATION requirement (token verification)
 * Required for envelope activation: each signer must have at least one authentication method.
 * Default: email token (code sent to signer's email).
 */
export async function addAuthenticationRequirement(
  envelopeId: string,
  documentId: string,
  signerId: string,
  auth: "email" | "sms" | "whatsapp" = "email",
): Promise<ClicksignApiResponse<ClicksignRequirement>> {
  return clicksignRequest<ClicksignRequirement>("POST", `/envelopes/${envelopeId}/requirements`, {
    data: {
      type: "requirements",
      attributes: {
        action: "provide_evidence",
        auth,
      },
      relationships: {
        document: {
          data: { type: "documents", id: documentId },
        },
        signer: {
          data: { type: "signers", id: signerId },
        },
      },
    },
  });
}

/**
 * Backward-compatible alias for addQualificationRequirement
 */
export const addRequirement = addQualificationRequirement;

/**
 * Step 5: Activate the envelope (makes it ready for signing)
 * Clicksign API v3: use PATCH /envelopes/{id} with status: 'running'
 * (POST /activate endpoint does not exist in v3 production)
 */
export async function activateEnvelope(envelopeId: string): Promise<ClicksignApiResponse<ClicksignEnvelope>> {
  return clicksignRequest<ClicksignEnvelope>("PATCH", `/envelopes/${envelopeId}`, {
    data: {
      type: "envelopes",
      id: envelopeId,
      attributes: {
        status: "running",
      },
    },
  });
}

/**
 * Step 6a: Send notification to all signers of an envelope
 * Correct Clicksign API v3 endpoint: POST /envelopes/{envelope_id}/notifications
 * (NOT /notifications — that endpoint does not exist in v3)
 */
export async function sendNotification(
  envelopeId: string,
  message?: string,
): Promise<ClicksignApiResponse<any>> {
  const body: any = {
    data: {
      type: "notifications",
      attributes: {
        message: message || null,
      },
    },
  };

  return clicksignRequest<any>("POST", `/envelopes/${envelopeId}/notifications`, body);
}

/**
 * Step 6b: Send notification to a specific signer
 * Correct Clicksign API v3 endpoint: POST /envelopes/{envelope_id}/signers/{signer_id}/notifications
 */
export async function sendNotificationToSigner(
  envelopeId: string,
  signerId: string,
  message?: string,
): Promise<ClicksignApiResponse<any>> {
  const body: any = {
    data: {
      type: "notifications",
      attributes: {
        message: message || null,
      },
    },
  };

  return clicksignRequest<any>("POST", `/envelopes/${envelopeId}/signers/${signerId}/notifications`, body);
}

/**
 * Get envelope details
 */
export async function getEnvelopeDetails(envelopeId: string): Promise<ClicksignApiResponse<any>> {
  return clicksignRequest<any>("GET", `/envelopes/${envelopeId}`);
}

/**
 * Cancel an envelope
 */
export async function cancelEnvelope(envelopeId: string): Promise<ClicksignApiResponse<any>> {
  return clicksignRequest<any>("DELETE", `/envelopes/${envelopeId}`);
}

// ==================== PDF GENERATION ====================

/**
 * Generate a real PDF from contract data using pdfkit
 */
async function generateContractPdf(
  title: string,
  content: string,
  meta?: ContractMeta,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const formatDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString("pt-BR") : "";
    const formatCurrency = (v: string | null | undefined, currency: string | null | undefined) => {
      if (!v) return "";
      const num = parseFloat(v);
      if (isNaN(num)) return v;
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(num);
    };

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown(0.5);

    if (meta?.number) {
      doc.fontSize(11).font("Helvetica").text(`Número: ${meta.number}`, { align: "center" });
    }

    doc.moveDown(1);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke();
    doc.moveDown(1);

    // Parties
    if (meta?.contractorName) {
      doc.fontSize(11).font("Helvetica-Bold").text("CONTRATANTE:");
      doc.font("Helvetica").text(meta.contractorName);
      if (meta.contractorCnpj) doc.text(`CNPJ: ${meta.contractorCnpj}`);
      doc.moveDown(0.8);
    }

    // Object
    if (meta?.object) {
      doc.font("Helvetica-Bold").text("OBJETO:");
      doc.font("Helvetica").text(meta.object, { align: "justify" });
      doc.moveDown(0.8);
    }

    // Value and dates
    if (meta?.totalValue) {
      doc.font("Helvetica-Bold").text("VALOR TOTAL:");
      doc.font("Helvetica").text(formatCurrency(meta.totalValue, meta.currency));
      doc.moveDown(0.5);
    }

    if (meta?.startDate || meta?.endDate) {
      doc.font("Helvetica-Bold").text("VIGÊNCIA:");
      doc.font("Helvetica").text(
        `${formatDate(meta.startDate)} a ${formatDate(meta.endDate)}`
      );
      doc.moveDown(0.5);
    }

    if (meta?.paymentTerms) {
      doc.font("Helvetica-Bold").text("CONDIÇÕES DE PAGAMENTO:");
      doc.font("Helvetica").text(meta.paymentTerms, { align: "justify" });
      doc.moveDown(0.8);
    }

    // Content (if HTML, strip tags; otherwise use as-is)
    if (content && content.trim().length > 0) {
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke();
      doc.moveDown(0.8);
      // Strip HTML tags if present
      const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      doc.font("Helvetica").fontSize(10).text(plainText, { align: "justify" });
      doc.moveDown(1);
    }

    // Signature area
    doc.moveDown(2);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).font("Helvetica").text(
      "Documento gerado eletronicamente. Assinatura digital via Clicksign.",
      { align: "center" }
    );

    doc.end();
  });
}

// ==================== ORCHESTRATION ====================

export interface ContractMeta {
  number?: string | null;
  object?: string | null;
  contractorName?: string | null;
  contractorCnpj?: string | null;
  totalValue?: string | null;
  currency?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  paymentTerms?: string | null;
}

export interface SendContractToClicksignInput {
  contractTitle: string;
  contractContent: string;
  contractMeta?: ContractMeta;
  signers: Array<{
    id: number; // local DB signer id
    name: string;
    email: string;
    cpfCnpj?: string | null;
    role: string;
    signOrder: number;
  }>;
}

export interface SendContractToClicksignResult {
  success: boolean;
  envelopeId?: string;
  documentId?: string;
  signerMappings?: Array<{
    localSignerId: number;
    clicksignSignerId: string;
    clicksignRequirementId?: string;
  }>;
  error?: string;
  step?: string;
  httpStatus?: number;
  requestId?: string;
}

/**
 * Wait for a document to reach 'ready' status (async processing by Clicksign)
 * Returns true if ready, false if timeout or error
 */
async function waitForDocumentReady(
  envelopeId: string,
  documentId: string,
  maxWaitMs = 90_000,
  pollIntervalMs = 5_000,
): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const result = await clicksignRequest<any>("GET", `/envelopes/${envelopeId}/documents/${documentId}`);
    const status = result.data?.attributes?.status;
    console.log(`[Clicksign] Document status: ${status}`);
    if (status === "ready") return true;
    if (status === "error") return false;
  }
  return false;
}

/**
 * Full orchestration: create envelope → upload doc → add signers → add requirements → activate → notify
 * Returns detailed result with IDs for each step, or error with step identification.
 */
export async function sendContractToClicksign(
  input: SendContractToClicksignInput,
): Promise<SendContractToClicksignResult> {
  // Step 1: Create envelope
  console.log(`[Clicksign] Starting send flow for: ${input.contractTitle}`);
  
  const envelopeResult = await createEnvelope(input.contractTitle);
  if (!envelopeResult.success || !envelopeResult.data) {
    return {
      success: false,
      error: envelopeResult.error?.message || "Falha ao criar envelope",
      step: "create_envelope",
      httpStatus: envelopeResult.error?.status,
      requestId: envelopeResult.requestId,
    };
  }
  const envelopeId = envelopeResult.data.id;
  console.log(`[Clicksign] Envelope created: ${envelopeId}`);

  // Step 2: Generate PDF from contract data and upload
  const pdfBuffer = await generateContractPdf(input.contractTitle, input.contractContent, input.contractMeta);
  const contentBase64 = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
  const filename = `${input.contractTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  const docResult = await addDocument(envelopeId, filename, contentBase64);
  if (!docResult.success || !docResult.data) {
    return {
      success: false,
      envelopeId,
      error: docResult.error?.message || "Falha ao adicionar documento",
      step: "add_document",
      httpStatus: docResult.error?.status,
      requestId: docResult.requestId,
    };
  }
  const documentId = docResult.data.id;
  console.log(`[Clicksign] Document uploaded: ${documentId}`);

  // Step 3 & 4: Add signers and requirements (qualification + authentication)
  const signerMappings: Array<{
    localSignerId: number;
    clicksignSignerId: string;
    clicksignRequirementId?: string;
  }> = [];

  // Sort by signOrder
  const sortedSigners = [...input.signers].sort((a, b) => a.signOrder - b.signOrder);

  for (const signer of sortedSigners) {
    const signerResult = await addSignerToEnvelope(envelopeId, {
      name: signer.name,
      email: signer.email,
      // Pass raw value — formatDocumentation() inside addSignerToEnvelope handles masking
      documentation: signer.cpfCnpj || undefined,
      refusable: true,
    });

    if (!signerResult.success || !signerResult.data) {
      return {
        success: false,
        envelopeId,
        documentId,
        signerMappings,
        error: `Falha ao adicionar signatário ${signer.name}: ${signerResult.error?.message}`,
        step: `add_signer_${signer.id}`,
        httpStatus: signerResult.error?.status,
        requestId: signerResult.requestId,
      };
    }

    const clicksignSignerId = signerResult.data.id;
    console.log(`[Clicksign] Signer added: ${signer.name} → ${clicksignSignerId}`);

    // Add QUALIFICATION requirement (link signer to document with role)
    const qualResult = await addQualificationRequirement(envelopeId, documentId, clicksignSignerId);
    
    if (!qualResult.success) {
      return {
        success: false,
        envelopeId,
        documentId,
        signerMappings,
        error: `Falha ao configurar requisito de qualificação para ${signer.name}: ${qualResult.error?.message}`,
        step: `add_requirement_${signer.id}`,
        httpStatus: qualResult.error?.status,
        requestId: qualResult.requestId,
      };
    }
    console.log(`[Clicksign] Qualification requirement added for ${signer.name}`);

    // Add AUTHENTICATION requirement (token by email)
    // Required by Clicksign: each signer must have at least one authentication method for envelope activation
    const authResult = await addAuthenticationRequirement(envelopeId, documentId, clicksignSignerId, "email");
    
    if (!authResult.success) {
      return {
        success: false,
        envelopeId,
        documentId,
        signerMappings,
        error: `Falha ao configurar requisito de autenticação para ${signer.name}: ${authResult.error?.message}`,
        step: `add_auth_requirement_${signer.id}`,
        httpStatus: authResult.error?.status,
        requestId: authResult.requestId,
      };
    }
    console.log(`[Clicksign] Authentication requirement added for ${signer.name}`);

    signerMappings.push({
      localSignerId: signer.id,
      clicksignSignerId,
      clicksignRequirementId: qualResult.data?.id,
    });
  }

  // Step 5: Activate envelope
  const activateResult = await activateEnvelope(envelopeId);
  if (!activateResult.success) {
    return {
      success: false,
      envelopeId,
      documentId,
      signerMappings,
      error: activateResult.error?.message || "Falha ao ativar envelope",
      step: "activate_envelope",
      httpStatus: activateResult.error?.status,
      requestId: activateResult.requestId,
    };
  }
  console.log(`[Clicksign] Envelope activated: ${envelopeId}`);

  // Step 6: Send notification
  const notifyResult = await sendNotification(
    envelopeId,
    `Por favor, assine o documento "${input.contractTitle}".`,
  );
  if (!notifyResult.success) {
    // Notification failure is non-fatal — envelope is already active
    console.warn(`[Clicksign] Notification warning: ${notifyResult.error?.message}`);
  } else {
    console.log(`[Clicksign] Notification sent for envelope: ${envelopeId}`);
  }

  return {
    success: true,
    envelopeId,
    documentId,
    signerMappings,
  };
}

/**
 * Resend notification to a specific signer
 */
export async function resendSignerNotification(
  envelopeId: string,
  message?: string,
): Promise<ClicksignApiResponse<any>> {
  return sendNotification(envelopeId, message);
}

// ==================== WEBHOOK VERIFICATION ====================

/**
 * Verify webhook signature from Clicksign.
 * Clicksign sends HMAC-SHA256 signature in the header.
 *
 * Em producao: falha fechado se CLICKSIGN_WEBHOOK_SECRET nao estiver configurado.
 * Em dev: continua liberando para facilitar testes locais.
 * Compara com crypto.timingSafeEqual para evitar timing side-channels.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const secret = ENV.clicksignWebhookSecret;
  if (!secret) {
    if (ENV.isProduction) {
      console.error("[Clicksign] Webhook secret not configured in production — rejecting webhook");
      return false;
    }
    console.warn("[Clicksign] Webhook secret not configured (dev mode), skipping verification");
    return true;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
