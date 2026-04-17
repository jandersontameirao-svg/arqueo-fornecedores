export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  clicksignApiKey: process.env.CLICKSIGN_API_KEY ?? "",
  clicksignApiUrl: process.env.CLICKSIGN_API_URL ?? "https://sandbox.clicksign.com/api/v3",
  clicksignWebhookSecret: process.env.CLICKSIGN_WEBHOOK_SECRET ?? "",
};
