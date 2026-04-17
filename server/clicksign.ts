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

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`[Clicksign] ${method} ${url}`);
    
    const response = await fetch(url, fetchOptions);
    const requestId = response.headers.get("x-request-id") || undefined;

    if (!response.ok) {
      let errorBody: any = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: await response.text() };
      }

      console.error(`[Clicksign] Error ${response.status}: ${JSON.stringify(errorBody)}`);

      return {
        success: false,
        error: {
          status: response.status,
          message: errorBody?.errors?.[0]?.detail || errorBody?.message || `HTTP ${response.status}`,
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

    const responseData = await response.json();
    return {
      success: true,
      data: responseData?.data as T,
      requestId,
    };
  } catch (err: any) {
    console.error(`[Clicksign] Network error: ${err.message}`);
    return {
      success: false,
      error: {
        status: 0,
        message: `Erro de conexão com Clicksign: ${err.message}`,
      },
    };
  }
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
 * Step 3: Add a signer to the envelope
 */
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
  return clicksignRequest<ClicksignSigner>("POST", `/envelopes/${envelopeId}/signers`, {
    data: {
      type: "signers",
      attributes: {
        name: signer.name,
        email: signer.email,
        ...(signer.documentation ? { documentation: signer.documentation } : {}),
        communicate_events: signer.communicateEvents !== false, // default true
        refusable: signer.refusable !== false, // default true
      },
    },
  });
}

/**
 * Step 4: Add a requirement (link signer to document with action)
 */
export async function addRequirement(
  envelopeId: string,
  documentId: string,
  signerId: string,
  action: "agree" | "sign" | "approve" | "acknowledge" = "sign",
): Promise<ClicksignApiResponse<ClicksignRequirement>> {
  return clicksignRequest<ClicksignRequirement>("POST", `/envelopes/${envelopeId}/requirements`, {
    data: {
      type: "requirements",
      attributes: {
        action,
        role: action,
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
 * Step 5: Activate the envelope (makes it ready for signing)
 */
export async function activateEnvelope(envelopeId: string): Promise<ClicksignApiResponse<ClicksignEnvelope>> {
  return clicksignRequest<ClicksignEnvelope>("POST", `/envelopes/${envelopeId}/activate`);
}

/**
 * Step 6: Send notification to all signers
 */
export async function sendNotification(
  envelopeId: string,
  message?: string,
): Promise<ClicksignApiResponse<any>> {
  const body: any = {
    data: {
      type: "notifications",
      relationships: {
        envelope: {
          data: { type: "envelopes", id: envelopeId },
        },
      },
    },
  };

  if (message) {
    body.data.attributes = { message };
  }

  return clicksignRequest<any>("POST", "/notifications", body);
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

// ==================== ORCHESTRATION ====================

export interface SendContractToClicksignInput {
  contractTitle: string;
  contractContent: string;
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

  // Step 2: Generate PDF from content and upload
  // Convert contract content to a simple PDF-like base64 (text content)
  // In production, you'd generate a proper PDF here
  const textContent = input.contractContent || "Contrato sem conteúdo";
  const contentBase64 = `data:application/pdf;base64,${Buffer.from(textContent).toString("base64")}`;
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

  // Step 3 & 4: Add signers and requirements
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
      // Strip non-digits and only send if 11 (CPF) or 14 (CNPJ) digits
      documentation: (() => {
        if (!signer.cpfCnpj) return undefined;
        const digits = signer.cpfCnpj.replace(/\D/g, "");
        return (digits.length === 11 || digits.length === 14) ? digits : undefined;
      })(),
      communicateEvents: true,
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

    // Add requirement (link signer to document)
    const reqResult = await addRequirement(envelopeId, documentId, clicksignSignerId, "sign");
    
    if (!reqResult.success) {
      return {
        success: false,
        envelopeId,
        documentId,
        signerMappings,
        error: `Falha ao configurar requisito para ${signer.name}: ${reqResult.error?.message}`,
        step: `add_requirement_${signer.id}`,
        httpStatus: reqResult.error?.status,
        requestId: reqResult.requestId,
      };
    }

    signerMappings.push({
      localSignerId: signer.id,
      clicksignSignerId,
      clicksignRequirementId: reqResult.data?.id,
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
 * Verify webhook signature from Clicksign
 * Clicksign sends HMAC-SHA256 signature in the header
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const secret = ENV.clicksignWebhookSecret;
  if (!secret) {
    console.warn("[Clicksign] Webhook secret not configured, skipping verification");
    return true; // Allow in dev mode
  }

  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return signature === expectedSignature;
  } catch {
    return false;
  }
}
