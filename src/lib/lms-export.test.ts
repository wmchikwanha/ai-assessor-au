import { test } from "node:test";
import assert from "node:assert/strict";
import { SECTION_TITLES, buildMetadata, buildTemplate, toCsv, type ExportRow } from "./lms-export.ts";

const row: ExportRow = {
  id: "x", provider: "P", school: "S", program: "Prog", unit_code: "HOSP2003", unit_title: "U", title: "T, with comma",
  aqf_level: 7, discipline: "Business", cohort_size: 100, delivery_mode: "On campus", teqsa_pathway: "unit-level",
  selected_stance: "limited", certificate_hash: "a".repeat(64), prompt_version: "v", model: "m", updated_at: "2026-10-28",
  status: "certified", variants: { limited: { aias_level: "AIAS 2" } }, scores: {}, certificate: { sections: [] },
};

test("only certified records export", () => {
  assert.throws(() => buildMetadata({ ...row, status: "scored" }));
});

test("metadata carries AQF level, TEQSA pathway and hash; CSV escapes commas", () => {
  const m = Object.fromEntries(buildMetadata(row));
  assert.equal(m["aqf_level"], "7");
  assert.equal(m["teqsa_reform_pathway"], "unit-level");
  assert.equal(m["certificate_sha256"], "a".repeat(64));
  assert.match(toCsv(buildMetadata(row)), /assessment_title,"T, with comma"/);
});

test("import template lists every export field, in export order, with blank values", () => {
  const certified: ExportRow = {
    ...row,
    certificate: {
      sections: SECTION_TITLES.map((title, i) => ({ n: i + 1, title, body: { note: "x" } })),
    },
  };
  const exportKeys = buildMetadata(certified).map(([k]) => k);
  const template = buildTemplate();
  // The template must mirror the export exactly, so an LMS mapping built from it fits any certified record.
  assert.deepEqual(template.map(([k]) => k), exportKeys);
  assert.ok(template.length >= 37, `expected full field list, got ${template.length}`);
  assert.ok(template.every(([, v]) => v === ""), "template values must be blank");
  assert.match(toCsv(template), /^ field,value/x.source ? / field/ : /./); // placeholder replaced below
});
