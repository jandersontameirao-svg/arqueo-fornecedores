// ============================================================================
// Peças compartilhadas entre os routers de domínio (server/routers/*.ts).
// Extraídas de server/routers.ts para permitir dividir o roteador por domínio
// sem duplicar RBAC e helpers. Comportamento idêntico ao original.
// ============================================================================
import { TRPCError } from "@trpc/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { protectedProcedure } from "../_core/trpc";

// ==================== RBAC MIDDLEWARE ====================
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
  }
  return next({ ctx });
});

// ============================================================================
// Extrai texto de um buffer de arquivo conforme a extensão.
// Suporta: pdf (texto digital), txt, md, docx (via mammoth). Retorna "" para
// formatos não suportados (image/* e doc legado seguem pelo caminho multimodal).
// ============================================================================
export async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<string> {
  if (ext === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text?.substring(0, 12000) || "";
      console.log(`[ai-extract] extractTextFromBuffer: ext=pdf, bufferBytes=${buffer.length}, textChars=${text.length}`);
      return text;
    } catch (e) {
      console.error("[ai-extract] PDF text extraction failed:", e);
      return "";
    }
  }
  if (["txt", "md"].includes(ext)) {
    const text = buffer.toString("utf-8").substring(0, 12000);
    console.log(`[ai-extract] extractTextFromBuffer: ext=${ext}, bufferBytes=${buffer.length}, textChars=${text.length}`);
    return text;
  }
  if (ext === "docx") {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      const text = (value || "").substring(0, 12000);
      console.log(`[ai-extract] extractTextFromBuffer: ext=docx, bufferBytes=${buffer.length}, textChars=${text.length}`);
      return text;
    } catch (e) {
      console.error("[ai-extract] DOCX text extraction failed:", e);
      return "";
    }
  }
  console.warn(`[ai-extract] extractTextFromBuffer: ext=${ext} not supported by text extractor (returning empty). bufferBytes=${buffer.length}`);
  return "";
}
