import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /**
   * organizationalGroupId ativo na sessão do usuário. Vem do header
   * `x-active-org-group-id` injetado pelo cliente tRPC (lendo o
   * dropdown "Área de Negócio" do topo). Quando definido, restringe
   * o escopo a este único grupo em vez de mostrar todos os acessíveis.
   * Sempre validado contra `accessibleGroupIds` em resolveOrgContext.
   */
  activeOrgGroupId: number | null;
};

function parseActiveOrgGroupId(req: CreateExpressContextOptions["req"]): number | null {
  const raw = req.headers["x-active-org-group-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || typeof value !== "string") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    activeOrgGroupId: parseActiveOrgGroupId(opts.req),
  };
}
