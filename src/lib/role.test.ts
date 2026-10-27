import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { canReview, ROLES } from "./role";

describe("Synthetic role-playing", () => {
  test("All three simulated roles are available without an account", () => {
    assert.deepEqual(ROLES.map((role) => role.key), ["coordinator", "reviewer", "admin"]);
  });
  test("Governance reviewer can review", () => { assert.equal(canReview("reviewer"), true); });
  test("Administrator can review", () => { assert.equal(canReview("admin"), true); });
  test("Coordinator uses the simulated reviewer boundary", () => { assert.equal(canReview("coordinator"), false); });
});