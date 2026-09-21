// ============================================================================
// Router de domínio: ATENA (assistente de IA).
// Extraído de server/routers.ts. Comportamento idêntico ao original.
// ============================================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { resolveOrgContext, buildScopeFilter } from "../orgContext";
import { canClearAtenaChat } from "@shared/atenaChat";
import * as atena from "../atena";
import { extractTextFromBuffer } from "./_shared";

export const atenaRouter = router({
  inconsistencies: protectedProcedure.query(async ({ ctx }) => {
    const orgCtx = await resolveOrgContext(ctx.user, ctx.activeOrgGroupId);
    const scope = buildScopeFilter(orgCtx);
    const orgGroupIds = orgCtx.isSuperAdmin ? undefined : scope.groupIds;
    return atena.detectInconsistencies(orgGroupIds);
  }),

  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })).min(1).max(30),
      attachment: z.object({
        name: z.string().min(1).max(255),
        fileBase64: z.string().max(22_000_000, "Arquivo excede ~16MB"),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orgCtx = await resolveOrgContext(ctx.user, ctx.activeOrgGroupId);
      const scope = buildScopeFilter(orgCtx);
      const orgGroupIds = orgCtx.isSuperAdmin ? undefined : scope.groupIds;

      // Documento anexado: extrai texto (pdf/docx/txt/md) para a Atena entender.
      let doc: { name: string; text: string } | undefined;
      if (input.attachment) {
        const base64 = input.attachment.fileBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const ext = input.attachment.name.split(".").pop()?.toLowerCase() || "";
        const text = await extractTextFromBuffer(buffer, ext);
        doc = { name: input.attachment.name, text: text || "(não foi possível extrair texto deste arquivo)" };
      }

      const result = await atena.chat(
        { id: ctx.user.id, email: ctx.user.email, role: ctx.user.role ?? "reader", name: (ctx.user as any).name },
        input.messages,
        orgGroupIds,
        doc,
      );
      // Persiste o histórico do usuário (mensagens + resposta da Atena).
      await atena.saveChat(ctx.user.id, [...input.messages, { role: "assistant", content: result.reply }]);
      return result;
    }),

  // Carrega o histórico salvo do usuário (chamado ao abrir o chat).
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const messages = await atena.getSavedChat(ctx.user.id);
    return { messages, canClear: canClearAtenaChat(ctx.user.email) };
  }),

  // Exclui o histórico — permitido APENAS para os e-mails autorizados.
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    if (!canClearAtenaChat(ctx.user.email)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Seu usuário não pode excluir o histórico da Atena." });
    }
    await atena.clearChat(ctx.user.id);
    return { success: true };
  }),
});
