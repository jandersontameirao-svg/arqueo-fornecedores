import { describe, it, expect } from "vitest";
import { isClicksignConfigured } from "./clicksign";

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

    // 200 = authenticated, 401 = bad key, 403 = forbidden
    expect(response.status).toBe(200);
  });
});
