import { describe, expect, test } from "bun:test";
import { canReview, ROLES } from "./role";

describe("Synthetic role-playing", () => {
  test("All three simulated roles are available without an account", () => {
    expect(ROLES.map((role) => role.key)).toEqual(["coordinator", "reviewer", "admin"]);
  });
  test("Governance reviewer can review", () => { expect(canReview("reviewer")).toBe(true); });
  test("Administrator can review", () => { expect(canReview("admin")).toBe(true); });
  test("Coordinator uses the simulated reviewer boundary", () => { expect(canReview("coordinator")).toBe(false); });
});