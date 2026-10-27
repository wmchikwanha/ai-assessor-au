import { test } from "node:test";
import assert from "node:assert/strict";
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
    assert.equal(error, null);
    assert.equal(sentHeaders.get("apikey"), "sb_publishable_synthetic_test");
    assert.equal(sentHeaders.has("Authorization"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});