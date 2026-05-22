/**
 * Storage helpers — Cloudflare R2 (AWS S3-compatible)
 *
 * Substitui o proxy S3 da Manus Forge por Cloudflare R2.
 * Usa AWS SDK v3 com endpoint R2.
 *
 * Variáveis de ambiente obrigatórias em produção:
 *   R2_ACCOUNT_ID       — Account ID do Cloudflare
 *   R2_ACCESS_KEY_ID    — Access Key gerada no painel R2
 *   R2_SECRET_ACCESS_KEY — Secret Key gerada no painel R2
 *
 * Variáveis opcionais (com padrão):
 *   R2_BUCKET_NAME      — padrão: "arqueo-fornecedores"
 *   R2_REGION           — padrão: "auto"
 *
 * SEGURANÇA:
 *   - Credenciais nunca são expostas no frontend (sem prefixo VITE_)
 *   - Credenciais nunca são registradas em logs
 *   - Downloads usam URLs assinadas com validade limitada (1 hora padrão)
 *   - Documentos sensíveis ficam privados por padrão
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// ─── Validação de configuração ────────────────────────────────────────────────

function assertR2Configured(): void {
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error(
      "Cloudflare R2 não está configurado. " +
        "Defina as variáveis de ambiente R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY."
    );
  }
}

// ─── Cliente S3 (lazy — só inicializa quando necessário) ──────────────────────

let _client: S3Client | null = null;

function getClient(): S3Client {
  assertR2Configured();
  if (!_client) {
    // R2_ACCOUNT_ID pode ser configurado como:
    //   - URL completa: "https://abc123.r2.cloudflarestorage.com"
    //   - Apenas o Account ID: "abc123"
    const rawAccountId = ENV.r2AccountId.trim();
    const endpoint = rawAccountId.startsWith("http")
      ? rawAccountId
      : `https://${rawAccountId}.r2.cloudflarestorage.com`;

    _client = new S3Client({
      region: ENV.r2Region || "auto",
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
      endpoint,
    });
  }
  return _client;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function getBucketName(): string {
  return ENV.r2BucketName || "arqueo-fornecedores";
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Faz upload de um arquivo para o Cloudflare R2.
 *
 * @param relKey   Caminho relativo do arquivo no bucket (ex: "documentos/abc123.pdf")
 * @param data     Conteúdo do arquivo (Buffer, Uint8Array ou string)
 * @param contentType  MIME type do arquivo (ex: "application/pdf")
 * @returns { key, url } — key é o caminho no bucket; url é a URL assinada de acesso (1h)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = normalizeKey(relKey);
  const bucket = getBucketName();

  const body =
    typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data as Uint8Array);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  try {
    await client.send(command);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[R2] Upload falhou para "${key}": ${msg}`);
  }

  // Gerar URL assinada de download (1 hora de validade)
  const url = await _generateSignedUrl(client, bucket, key, 3600);
  return { key, url };
}

/**
 * Gera uma URL assinada de download para um arquivo existente no R2.
 *
 * @param relKey    Caminho relativo do arquivo no bucket
 * @param expiresIn Validade da URL em segundos (padrão: 3600 = 1 hora)
 * @returns { key, url }
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = normalizeKey(relKey);
  const bucket = getBucketName();

  const url = await _generateSignedUrl(client, bucket, key, expiresIn);
  return { key, url };
}

/**
 * Remove um arquivo do R2.
 *
 * @param relKey Caminho relativo do arquivo no bucket
 */
export async function storageDelete(relKey: string): Promise<void> {
  const client = getClient();
  const key = normalizeKey(relKey);
  const bucket = getBucketName();

  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  try {
    await client.send(command);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[R2] Delete falhou para "${key}": ${msg}`);
  }
}

// ─── Interno ──────────────────────────────────────────────────────────────────

async function _generateSignedUrl(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn: number
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  try {
    return await getSignedUrl(client, command, { expiresIn });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[R2] Geração de URL assinada falhou para "${key}": ${msg}`);
  }
}
