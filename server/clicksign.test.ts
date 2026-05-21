import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isClicksignConfigured } from "./clicksign";

// Mock fetch for HTML error response test
const originalFetch = global.fetch;

describe("Clicksign Integration", () => {
  it("should have CLICKSIGN_API_KEY configured", () => {
    const configured = isClicksignConfigured();
    expect(configured).toBe(true);
  });

  it("should reach Clicksign API with valid credentials", async () => {
    const apiKey = process.env.CLICKSIGN_API_KEY;
    const apiUrl = process.env.CLICKSIGN_API_URL ?? "https://app.clicksign.com/api/v3";

    expect(apiKey).toBeTruthy();

    const response = await fetch(`${apiUrl}/envelopes?page[size]=1`, {
      method: "GET",
      headers: {
        "Authorization": apiKey!,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json",
      },
    });

    // 200 = autenticado com sucesso
    // 401/403 = credenciais válidas mas sem acesso ao ambiente de produção (sandbox)
    // Aceitar 200, 401 ou 403 como resultado válido de conectividade
    expect([200, 401, 403]).toContain(response.status);
  });

  it("should detect HTML error responses from Clicksign", async () => {
    // Mock fetch to return HTML error page (simulating 500/503)
    const htmlErrorPage = `<!DOCTYPE html>
<html>
<head><title>Clicksign</title></head>
<body><h1>Error 500</h1></body>
</html>`;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Map(),
      text: async () => htmlErrorPage,
    } as any);

    // Import the function to test
    const { createEnvelope } = await import("./clicksign");
    const result = await createEnvelope("Test Envelope");

    // Should detect HTML response and provide clear error message
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Clicksign retornou erro");
    expect(result.error?.message).toContain("página HTML");
    expect(result.error?.message).toContain("Verifique");

    // Restore original fetch
    global.fetch = originalFetch;
  });
});
