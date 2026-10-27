import { expect, test } from "bun:test";
import { sandboxDatabase } from "./sandbox-db.server";

test("Sandbox data requests use the publishable key without a visitor bearer session", async () => {
  const originalFetch = globalThis.fetch;
  let sentHeaders = new Headers();
  globalThis.fetch = (async (_input, init) => {
    sentHeaders = new Headers(init?.headers);
    return new Response("[]", { headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const client = sandboxDatabase("https://example.test", "sb_publishable_synthetic_test");
    const { error } = await client.from("assessments").select("id");
    expect(error).toBeNull();
    expect(sentHeaders.get("apikey")).toBe("sb_publishable_synthetic_test");
    expect(sentHeaders.has("Authorization")).toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});