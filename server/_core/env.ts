export const ENV = {
  appId: process.env.VITE_APP_ID || "local",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Manus Forge — mantido apenas para compatibilidade com LLM (llm.ts)
  // NÃO é mais usado para storage após migração para Cloudflare R2
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Anthropic (Claude) — opt-in. Só é usado quando AI_PROVIDER=anthropic E ANTHROPIC_API_KEY (ou CLAUDE_API_KEY) está setada.
  // Com AI_PROVIDER vazio ou diferente de "anthropic", o fluxo continua igual (OpenAI direto se OPENAI_API_KEY, senão Manus Forge).
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY ?? "",
  anthropicApiUrl: process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  anthropicVersion: process.env.ANTHROPIC_VERSION ?? "2023-06-01",
  aiProvider: (process.env.AI_PROVIDER ?? "").toLowerCase(),
  clicksignApiKey: process.env.CLICKSIGN_API_KEY ?? "",
  clicksignApiUrl: process.env.CLICKSIGN_API_URL ?? "https://app.clicksign.com/api/v3",
  clicksignWebhookSecret: process.env.CLICKSIGN_WEBHOOK_SECRET ?? "",
  // Cloudflare R2 — storage independente da Manus Forge
  // R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY não têm fallback funcional:
  // se ausentes em produção, o storage retorna erro claro sem vazar credenciais.
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "arqueo-fornecedores",
  r2Region: process.env.R2_REGION ?? "auto",
};
