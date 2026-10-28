import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ASSESSMENT, DEMO_SOURCE } from "./demo";
import { scanText } from "./privacy-scan";

test("The replacement sample is a sourced Australian university assessment", () => {
  assert.equal(DEMO_SOURCE.university, "The University of Queensland");
  assert.equal(DEMO_ASSESSMENT.unit_code, "HOSP2003");
  assert.match(DEMO_SOURCE.url, /^https:\/\/archive\.course-profiles\.uq\.edu\.au\//);
  assert.equal(scanText(DEMO_ASSESSMENT.text + DEMO_ASSESSMENT.learning_outcomes).length, 0);
});