// Australian personal-information scanner. Shared by the browser privacy gate
// and the server-side tripwire in the AI gateway — one source of truth.

export type FlagCategory =
  | "email"
  | "mobile"
  | "landline"
  | "intl_phone"
  | "tfn"
  | "medicare"
  | "abn"
  | "student_id"
  | "address"
  | "dob"
  | "name";

export const CATEGORY_LABEL: Record<FlagCategory, string> = {
  email: "Email address",
  mobile: "Mobile number (04xx)",
  landline: "Landline number",
  intl_phone: "Phone (+61 format)",
  tfn: "Tax File Number (checksum valid)",
  medicare: "Medicare number",
  abn: "ABN (checksum valid)",
  student_id: "Student ID",
  address: "Street address",
  dob: "Date of birth",
  name: "Probable personal name",
};

export interface PrivacyFlag {
  id: string;
  category: FlagCategory;
  text: string;
  start: number;
  end: number;
}

const digits = (s: string) => s.replace(/\D/g, "");

export function isValidTFN(d: string): boolean {
  const w9 = [1, 4, 3, 7, 5, 8, 6, 9, 10];
  const w8 = [10, 7, 8, 4, 6, 3, 5, 1];
  const w = d.length === 9 ? w9 : d.length === 8 ? w8 : null;
  if (!w) return false;
  const sum = [...d].reduce((a, c, i) => a + Number(c) * (w[i] ?? 0), 0);
  return sum % 11 === 0;
}

export function isValidABN(d: string): boolean {
  if (d.length !== 11) return false;
  const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const n = [...d].map(Number);
  n[0] = (n[0] ?? 0) - 1;
  return n.reduce((a, v, i) => a + v * (w[i] ?? 0), 0) % 89 === 0;
}

export function isValidMedicare(d: string): boolean {
  if (d.length !== 10 && d.length !== 11) return false;
  if (!/^[2-6]/.test(d)) return false;
  const w = [1, 3, 7, 9, 1, 3, 7, 9];
  const sum = w.reduce((a, wi, i) => a + Number(d[i] ?? 0) * wi, 0);
  return sum % 10 === Number(d[8]);
}

const MONTHS = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

const RULES: { category: FlagCategory; re: RegExp; validate?: (m: string) => boolean }[] = [
  { category: "email", re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { category: "intl_phone", re: /\+61[\s-]?\(?0?\)?[\s-]?[2-478](?:[\s-]?\d){8}/g },
  { category: "mobile", re: /\b04\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/g },
  { category: "landline", re: /\(0[2378]\)[\s-]?\d{4}[\s-]?\d{4}\b|\b0[2378][\s-]\d{4}[\s-]?\d{4}\b/g },
  {
    category: "student_id",
    re: /(?<=\b[Ss]tudent\s*(?:ID|Id|id|[Nn]o\.?|[Nn]umber)\s*[:#]?\s*)[A-Za-z]?\d{6,9}\b|\b[szSZ]\d{7}\b/g,
  },
  {
    category: "dob",
    re: new RegExp(
      `(?<=(?:DOB|D\\.O\\.B\\.|[Dd]ate of [Bb]irth|[Bb]orn(?: on)?)\\s*[:\\-]?\\s*)(?:\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4}|\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})`,
      "g",
    ),
  },
  {
    category: "address",
    re: /\b\d{1,5}[A-Za-z]?\s+(?:[A-Z][a-z]+\s){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Place|Pl|Crescent|Cres|Court|Ct|Lane|Ln|Parade|Pde|Terrace|Tce|Highway|Hwy|Boulevard|Blvd|Way)\b\.?(?:,?\s+[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?(?:\s(?:NSW|VIC|QLD|WA|SA|TAS|ACT|NT))?(?:\s\d{4})?)?/g,
  },
  { category: "abn", re: /\b\d{2}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g, validate: (m) => isValidABN(digits(m)) },
  { category: "medicare", re: /\b\d{4}[\s-]?\d{5}[\s-]?\d(?:[\s-]?\d)?\b/g, validate: (m) => isValidMedicare(digits(m)) },
  { category: "tfn", re: /\b\d{3}[\s-]?\d{3}[\s-]?\d{2,3}\b/g, validate: (m) => isValidTFN(digits(m)) },
  {
    category: "name",
    re: /\b(?:Dr|Mr|Mrs|Ms|Miss|Prof|Professor)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)?|(?<=\b(?:[Ss]tudent|[Nn]ame|[Pp]repared by|[Ss]ubmitted by|[Tt]utor|[Cc]ontact)\s*[:\-]\s*)[A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)+/g,
  },
];

export function scanText(text: string): PrivacyFlag[] {
  const found: PrivacyFlag[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    for (const m of text.matchAll(rule.re)) {
      const t = m[0] ?? "";
      if (rule.validate && !rule.validate(t)) continue;
      const start = m.index ?? 0;
      const end = start + t.length;
      // earlier rules win on overlap
      if (found.some((f) => start < f.end && end > f.start)) continue;
      found.push({ id: `${rule.category}-${start}`, category: rule.category, text: t, start, end });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

export function redactionToken(c: FlagCategory) {
      if (found.some((f) => start < f.end && end > f.start)) continue;
}

export function removeFlag(text: string, flag: PrivacyFlag): string {
  return text.slice(0, flag.start) + redactionToken(flag.category) + text.slice(flag.end);
}

/** Server tripwire: flags remaining after excluding text explicitly kept with a declaration. */
export function unresolvedFlags(text: string, kept: string[]): PrivacyFlag[] {
  const keep = new Set(kept);
  return scanText(text).filter((f) => !(f.category === "name" && keep.has(f.text)));
}
