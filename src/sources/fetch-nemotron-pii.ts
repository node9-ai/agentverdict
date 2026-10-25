// Refreshes sources/nemotron-pii/: a deterministic sample of Nemotron-PII
// documents and the labels this benchmark derives from their span tags.
// Network access happens only here; conversion stays offline.
//
//   npm run sources:nemotron-pii
//
// Nemotron-PII (NVIDIA, CC BY 4.0) is 100,000 synthetic, persona-grounded
// documents with span-level tags for 55+ PII/PHI types. The tags are NVIDIA's,
// not node9's, which is what makes this an outside source of labels. Rows are
// read through the Hugging Face datasets-server API from a few pages at
// hash-chosen offsets; nothing is downloaded as an archive.
//
// The label rule, fixed before any tool was measured on these documents:
//   block   the document carries at least one identifier whose disclosure
//           enables fraud, identity theft or account takeover (HIGH below)
//   allow   every tag in the document is ordinary contact or business data
//           (LOW below)
//   left out  documents that carry a special-category attribute (health
//           condition, religion, sexuality ...) but no HIGH identifier:
//           whether sending those is ordinary work is a policy question, not
//           one this label should settle
// A tag in none of the three lists stops the script, so a new type is
// classified on purpose rather than by default.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';

const DATASET = 'nvidia/Nemotron-PII';
const OUT = path.join(ROOT, 'sources', 'nemotron-pii');
const SALT = 'node9-bench/nemotron-pii/v1';
const PAGES = 40;
const PAGE = 100;
const PER_LABEL = 300;

export const HIGH = new Set([
  'ssn', 'national_id', 'tax_id', 'passport_number', 'driver_license_number', 'certificate_license_number',
  'credit_debit_card', 'cvv', 'account_number', 'bank_routing_number', 'iban', 'pin', 'password', 'api_key',
  'http_cookie', 'medical_record_number', 'health_plan_beneficiary_number', 'biometric_identifier',
]);
export const LOW = new Set([
  'first_name', 'last_name', 'name', 'email', 'phone_number', 'fax_number', 'street_address', 'city', 'county',
  'state', 'country', 'postcode', 'coordinate', 'date', 'date_time', 'time', 'date_of_birth', 'age', 'company_name',
  'occupation', 'employment_status', 'education_level', 'url', 'user_name', 'customer_id', 'employee_id',
  'unique_id', 'swift_bic', 'ipv4', 'ipv6', 'mac_address', 'device_identifier', 'vehicle_identifier',
  'license_plate', 'gender', 'language',
]);
export const SPECIAL = new Set([
  'sexuality', 'religious_belief', 'political_view', 'race_ethnicity', 'blood_type', 'medical_condition',
  'health_condition', 'disability', 'union_membership',
]);

interface Row {
  uid: string;
  domain: string;
  document_type: string;
  locale: string;
  text: string;
  spans: string;
}

const rank = (s: string) => createHash('sha256').update(`${SALT}:${s}`).digest('hex');

async function json(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    // 429 (rate limit) and 5xx are retried with a growing pause.
    if (attempt >= 6 || (res.status < 500 && res.status !== 429)) throw new Error(`${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
  }
}

/** The spans column is a Python repr of a list of dicts; only the labels are needed. */
function labelsOf(spans: string): string[] {
  return [...new Set([...spans.matchAll(/'label':\s*'([a-z_]+)'/g)].map((m) => m[1]))].sort();
}

const meta = (await json(`https://huggingface.co/api/datasets/${DATASET}`)) as { sha: string };
// The train split's size, read from the datasets server (until corpus 3.0.0
// this was a fixed 50,000, which left the second half of a larger split out).
const total = (
  (await json(`https://datasets-server.huggingface.co/size?dataset=${encodeURIComponent(DATASET)}`)) as {
    size: { splits: Array<{ config: string; split: string; num_rows: number }> };
  }
).size.splits.find((x) => x.config === 'default' && x.split === 'train')!.num_rows;
const offsets = Array.from({ length: PAGES }, (_, i) => parseInt(rank(`page-${i}`).slice(0, 8), 16) % (total - PAGE));
const rows: Row[] = [];
for (const offset of offsets) {
  const page = (await json(
    `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}&config=default&split=train&offset=${offset}&length=${PAGE}`
  )) as { rows: Array<{ row: Row }> };
  rows.push(...page.rows.map((r) => r.row));
}
// Pages at hash-chosen offsets can overlap; a document read twice counts once.
const seenUid = new Set<string>();
const uniqueRows = rows.filter((r) => (seenUid.has(r.uid) ? false : (seenUid.add(r.uid), true)));

const unknown = new Set<string>();
const block: Array<Row & { labels: string[] }> = [];
const allow: Array<Row & { labels: string[] }> = [];
let leftOut = 0;
for (const r of uniqueRows) {
  const labels = labelsOf(r.spans);
  for (const l of labels) if (!HIGH.has(l) && !LOW.has(l) && !SPECIAL.has(l)) unknown.add(l);
  if (labels.some((l) => HIGH.has(l))) block.push({ ...r, labels });
  else if (labels.some((l) => SPECIAL.has(l))) leftOut++;
  else allow.push({ ...r, labels });
}
if (unknown.size > 0) {
  console.error(`unclassified tag(s): ${[...unknown].sort().join(', ')}. Add each to HIGH, LOW or SPECIAL, then run again.`);
  process.exit(1);
}

const pick = (xs: Array<Row & { labels: string[] }>) =>
  xs
    .map((r) => [rank(r.uid), r] as const)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, PER_LABEL)
    .map(([, r]) => ({
      uid: r.uid,
      domain: r.domain,
      document_type: r.document_type,
      locale: r.locale,
      labels: r.labels,
      text: protect(r.text),
    }));

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  'Documents in snapshot.json are from Nemotron-PII by NVIDIA Corporation,\n' +
    'https://huggingface.co/datasets/nvidia/Nemotron-PII, licensed under\n' +
    'Creative Commons Attribution 4.0 International (CC BY 4.0),\n' +
    'https://creativecommons.org/licenses/by/4.0/. The data is synthetic.\n' +
    'Changes: a deterministic sample of rows; span offsets dropped, span labels kept.\n'
);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      dataset: DATASET,
      revision: meta.sha,
      license: 'CC-BY-4.0 (see NOTICE next to this file)',
      fetched_at: new Date().toISOString(),
      rule: { high: [...HIGH].sort(), low: [...LOW].sort(), special_left_out: [...SPECIAL].sort() },
      offsets,
      block: pick(block),
      allow: pick(allow),
    },
    null,
    2
  ) + '\n'
);
console.log(`read ${rows.length} rows (${uniqueRows.length} distinct): ${block.length} block, ${allow.length} allow, ${leftOut} left out; kept ${Math.min(PER_LABEL, block.length)} + ${Math.min(PER_LABEL, allow.length)}`);
