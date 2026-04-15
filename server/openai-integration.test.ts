import { describe, it, expect } from "vitest";
import { invokeLLM } from "./server/_core/llm";

describe("OpenAI Integration", () => {
  it("should successfully call OpenAI LLM with valid API key", async () => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond briefly.",
        },
        {
          role: "user",
          content: "Say 'OpenAI integration working' if you can read this.",
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toBeTruthy();
  }, { timeout: 30000 });
});
