import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerInternalAuthRoutes } from "../internalAuth";
import { registerClicksignWebhookRoute } from "../clicksignWebhook";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Trust the first hop (Nginx/Hostinger reverse proxy). Sem isto, req.ip retorna
  // o IP do proxy local em todas as requests — rate-limit por IP fica global.
  // Tambem habilita leitura segura de x-forwarded-proto para cookies "secure".
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback (only if Manus OAuth is configured)
  if (process.env.OAUTH_SERVER_URL) {
    registerOAuthRoutes(app);
  }
  // Internal auth login (email/password)
  registerInternalAuthRoutes(app);
  // Clicksign webhook endpoint
  registerClicksignWebhookRoute(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Quando PORT está definido explicitamente (produção, atrás de proxy reverso),
  // vinculamos ESTRITAMENTE a essa porta. NUNCA "vagamos" para outra porta livre —
  // fazer isso faria este app servir no slot de outro app que está atrás do mesmo
  // Nginx, mostrando o site errado no domínio. Se a porta estiver ocupada,
  // tentamos novamente algumas vezes (cobre o intervalo de restart do próprio app)
  // e então falhamos, deixando o PM2 reiniciar — sem nunca roubar outra porta.
  // Sem PORT definido (dev), mantemos a busca automática por conveniência.
  const strict = !!process.env.PORT;
  const port = strict ? parseInt(process.env.PORT as string) : await findAvailablePort(3000);

  if (!strict && port !== 3000) {
    console.log(`Port 3000 is busy, using port ${port} instead`);
  }

  const MAX_RETRIES = 15;
  const listenWithRetry = (attemptsLeft: number) => {
    const onError = (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && strict && attemptsLeft > 0) {
        console.warn(`Porta ${port} ocupada — nova tentativa em 2s (${attemptsLeft} restantes). NÃO vou usar outra porta.`);
        setTimeout(() => listenWithRetry(attemptsLeft - 1), 2000);
      } else {
        console.error(`Falha ao escutar na porta ${port}: ${err.message}`);
        process.exit(1);
      }
    };
    server.once("error", onError);
    server.listen(port, () => {
      server.removeListener("error", onError);
      console.log(`Server running on http://localhost:${port}/`);
    });
  };
  listenWithRetry(strict ? MAX_RETRIES : 0);
}

startServer().catch(console.error);
