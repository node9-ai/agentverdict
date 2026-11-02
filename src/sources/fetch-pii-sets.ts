// Refreshes sources/gretel-pii-finance/, sources/openpii/ and
// sources/pii-trace/: deterministic samples of three synthetic PII datasets
// and the labels this benchmark derives from their span tags, the same way
// as Nemotron-PII (src/sources/fetch-nemotron-pii.ts). Network access happens
// only here; conversion stays offline.
//
//   npm run sources:pii-sets
//
// The tags are each publisher's, not node9's. The label rule, fixed before
// any tool was measured on these documents, is Nemotron-PII's:
//   block      the document carries at least one identifier whose disclosure
//              enables fraud, identity theft or account takeover (high)
//   allow      every tag is ordinary contact or business data (low), or the
//              document has no tag at all
//   left out  a tag whose meaning is too broad to call either way (leftOut)
// A tag in none of the lists stops the script, so a new type is classified on
// purpose. Rows are read through the Hugging Face datasets-server API from
// pages at hash-chosen offsets; nothing is downloaded as an archive.
//
//   npm run sources:pii-sets -- --held-extra   (full build only)
//
// draws the held-out documents of corpus 7.0.0 for Gretel and OpenPII (not
// PII-TRACE, which is used whole) in secret: pages at offsets ranked by the
// selection salt, documents the sample did not take, the same label rule
// (src/sources/held-extra.ts). The samples are left untouched.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';
import { drawSecret } from './selection-salt.ts';
import { HELD_EXTRA, checkPool, selectionSalt, wantsHeldExtra, writeHeldExtra } from './held-extra.ts';

interface SetSpec {
  name: string;
  dataset: string;
  config: string;
  split: string;
  license: string;
  notice: string;
  pages: number;
  perLabel: number;
  high: string[];
  low: string[];
  leftOut: string[];
  /** Tags that are credentials rather than personal identifiers: a document whose only high tags are these is a secrets case. */
  credentials: string[];
  read: (row: Record<string, unknown>) => { uid: string; text: string; labels: string[]; meta: string };
}

const unique = (xs: string[]) => [...new Set(xs)].sort();
const spansOf = (v: unknown): Array<{ label: string }> => (typeof v === 'string' ? (JSON.parse(v) as Array<{ label: string }>) : (v as Array<{ label: string }>));

const SETS: SetSpec[] = [
  {
    name: 'gretel-pii-finance',
    dataset: 'gretelai/synthetic_pii_finance_multilingual',
    config: 'default',
    split: 'test',
    license: 'Apache-2.0',
    notice:
      'Documents in snapshot.json are from synthetic_pii_finance_multilingual by Gretel.ai,\n' +
      'https://huggingface.co/datasets/gretelai/synthetic_pii_finance_multilingual,\n' +
      'licensed under the Apache License 2.0. The data is synthetic.\n' +
      'Changes: a deterministic sample of rows; span offsets dropped, span labels kept.\n',
    pages: 40,
    perLabel: 300,
    high: [
      'account_pin', 'api_key', 'bank_routing_number', 'bban', 'credit_card_number', 'credit_card_security_code',
      'driver_license_number', 'iban', 'passport_number', 'password', 'ssn',
    ],
    low: [
      'company', 'customer_id', 'date', 'date_of_birth', 'date_time', 'email', 'employee_id', 'first_name', 'ipv4',
      'ipv6', 'last_name', 'local_latlng', 'name', 'phone_number', 'street_address', 'swift_bic_code', 'time',
      'user_name',
    ],
    leftOut: [],
    credentials: ['account_pin', 'api_key', 'password'],
    read: (r) => ({
      uid: String(r.index),
      text: String(r.generated_text),
      labels: unique(spansOf(r.pii_spans).map((s) => s.label)),
      meta: `${r.document_type}, ${r.language}`,
    }),
  },
  {
    name: 'openpii',
    dataset: 'ai4privacy/pii-masking-openpii-1m',
    config: 'default',
    split: 'validation',
    license: 'CC-BY-4.0',
    notice:
      'Texts in snapshot.json are from pii-masking-openpii-1m by Ai Suisse SA (ai4privacy),\n' +
      'https://huggingface.co/datasets/ai4privacy/pii-masking-openpii-1m, licensed under\n' +
      'Creative Commons Attribution 4.0 International (CC BY 4.0),\n' +
      'https://creativecommons.org/licenses/by/4.0/. The data is synthetic.\n' +
      'Changes: a deterministic sample of rows; span offsets dropped, span labels kept.\n',
    pages: 40,
    perLabel: 300,
    high: ['CREDITCARDNUMBER', 'DRIVERLICENSENUM', 'IDCARDNUM', 'PASSPORTNUM', 'SOCIALNUM', 'TAXNUM'],
    low: [
      'AGE', 'BUILDINGNUM', 'CITY', 'DATE', 'EMAIL', 'GENDER', 'GIVENNAME', 'SEX', 'STREET', 'SURNAME',
      'TELEPHONENUM', 'TITLE', 'ZIPCODE',
    ],
    leftOut: [],
    credentials: [],
    read: (r) => ({
      uid: String(r.uid),
      text: String(r.source_text),
      labels: unique((r.privacy_mask as Array<{ label: string }>).map((s) => s.label)),
      meta: `${r.language}`,
    }),
  },
  {
    name: 'pii-trace',
    dataset: 'perplexity-ai/PII-TRACE',
    config: 'conversations',
    split: 'train',
    license: 'MIT',
    notice:
      'Conversations in snapshot.json are from PII-TRACE by Perplexity AI,\n' +
      'https://huggingface.co/datasets/perplexity-ai/PII-TRACE, licensed under the MIT License.\n' +
      'The data is synthetic. Changes: a deterministic sample of rows; turns joined as text;\n' +
      'span offsets dropped, span labels kept.\n',
    pages: 5,
    perLabel: 300,
    high: ['account_number', 'secret'],
    low: ['private_address', 'private_date', 'private_email', 'private_person', 'private_phone', 'private_url'],
    // "other_pii" names no type; whether it is an identifier cannot be told from the tag.
    leftOut: ['other_pii'],
    credentials: ['secret'],
    read: (r) => ({
      uid: String(r.id),
      text: (r.turns as Array<{ user: string; assistant: string }>).map((t) => `User: ${t.user}\nAssistant: ${t.assistant}`).join('\n\n'),
      labels: unique((r.spans as Array<{ label: string }>).map((s) => s.label)),
      meta: `${(r.turns as unknown[]).length} turns`,
    }),
  },
];

async function json(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    // 429 (rate limit) and 5xx are retried with a growing pause.
    if (attempt >= 6 || (res.status < 500 && res.status !== 429)) throw new Error(`${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
  }
}

type Doc = ReturnType<SetSpec['read']>;
const PAGE = 100;

async function readPages(s: SetSpec, offsets: number[]): Promise<Doc[]> {
  const docs: Doc[] = [];
  for (const offset of offsets) {
    const page = (await json(
      `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(s.dataset)}&config=${s.config}&split=${s.split}&offset=${offset}&length=${PAGE}`
    )) as { rows: Array<{ row: Record<string, unknown> }> };
    docs.push(...page.rows.map((r) => s.read(r.row)));
    await new Promise((r) => setTimeout(r, 1000));
  }
  return docs;
}

/** The label rule: block, allow or left out, each document once; an unknown tag stops the script. */
function classify(s: SetSpec, docs: Doc[]): { block: Doc[]; allow: Doc[]; leftOut: number } {
  const high = new Set(s.high);
  const low = new Set(s.low);
  const leftOutTags = new Set(s.leftOut);
  const unknown = new Set(docs.flatMap((d) => d.labels).filter((l) => !high.has(l) && !low.has(l) && !leftOutTags.has(l)));
  if (unknown.size > 0) {
    console.error(`${s.name}: unclassified tag(s): ${[...unknown].sort().join(', ')}. Add each to high, low or leftOut, then run again.`);
    process.exit(1);
  }
  const seen = new Set<string>();
  const block: Doc[] = [];
  const allow: Doc[] = [];
  let leftOut = 0;
  for (const d of docs) {
    if (seen.has(d.uid)) continue;
    seen.add(d.uid);
    if (d.labels.some((l) => high.has(l))) block.push(d);
    else if (d.labels.some((l) => leftOutTags.has(l))) leftOut++;
    else allow.push(d);
  }
  return { block, allow, leftOut };
}

const toRow = (d: Doc) => ({ uid: d.uid, meta: d.meta, labels: d.labels, text: protect(d.text) });

async function splitSize(s: SetSpec): Promise<number> {
  const size = (await json(`https://datasets-server.huggingface.co/size?dataset=${encodeURIComponent(s.dataset)}`)) as {
    size: { splits: Array<{ config: string; split: string; num_rows: number }> };
  };
  return size.size.splits.find((x) => x.config === s.config && x.split === s.split)!.num_rows;
}

if (wantsHeldExtra()) {
  const salt = selectionSalt();
  for (const s of SETS) {
    if (s.name !== 'gretel-pii-finance' && s.name !== 'openpii') continue;
    const want = HELD_EXTRA[s.name];
    const total = await splitSize(s);
    const file = path.join(ROOT, 'sources', s.name, 'snapshot.json');
    const snap = JSON.parse(fs.readFileSync(file, 'utf-8')) as { block: Array<{ uid: string }>; allow: Array<{ uid: string }> };
    const taken = new Set([...snap.block, ...snap.allow].map((r) => r.uid));
    checkPool(s.name, 'documents', total - taken.size, want.block + want.allow);
    const EXTRA_PAGES = 12;
    const pageStarts = Array.from({ length: Math.floor((total - PAGE) / PAGE) + 1 }, (_, i) => i * PAGE);
    const extraOffsets = drawSecret(pageStarts, (o) => String(o), EXTRA_PAGES, salt, `${s.name}:pages`);
    const { block, allow } = classify(s, (await readPages(s, extraOffsets)).filter((d) => !taken.has(d.uid)));
    const take = (xs: Doc[], n: number, label: string) => {
      if (xs.length < n) throw new Error(`${s.name} ${label}: ${xs.length} documents read, ${n} wanted; read more pages`);
      return drawSecret(xs, (d) => d.uid, n, salt, `${s.name}:${label}`).map(toRow);
    };
    const addBlock = take(block, want.block, 'block');
    const addAllow = take(allow, want.allow, 'allow');
    snap.block.push(...addBlock);
    snap.allow.push(...addAllow);
    writeHeldExtra(
      s.name,
      file,
      snap,
      { rule: `${EXTRA_PAGES} pages at offsets ranked by the selection salt over the ${s.split} split, documents the sample did not take, the same label rule, per label in secret order`, drawn: { ...want }, pool: { documents: total - taken.size, read: block.length + allow.length } },
      [...addBlock, ...addAllow].map((r) => `${s.name}.${r.uid}`)
    );
    console.log(`${s.name} held-out draw: ${addBlock.length} block, ${addAllow.length} allow (from ${block.length} block and ${allow.length} allow documents read)`);
  }
  process.exit(0);
}

for (const s of SETS) {
  const rank = (x: string) => createHash('sha256').update(`node9-bench/${s.name}/v1:${x}`).digest('hex');
  const meta = (await json(`https://huggingface.co/api/datasets/${s.dataset}`)) as { sha: string };
  const total = await splitSize(s);
  const offsets =
    total <= s.pages * PAGE
      ? Array.from({ length: Math.ceil(total / PAGE) }, (_, i) => i * PAGE)
      : Array.from({ length: s.pages }, (_, i) => parseInt(rank(`page-${i}`).slice(0, 8), 16) % (total - PAGE));
  const docs = await readPages(s, offsets);
  const high = new Set(s.high);
  const low = new Set(s.low);
  const leftOutTags = new Set(s.leftOut);
  const { block, allow, leftOut } = classify(s, docs);
  const pick = (xs: Doc[]) =>
    xs
      .map((d) => [rank(d.uid), d] as const)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, s.perLabel)
      .map(([, d]) => toRow(d));

  const out = path.join(ROOT, 'sources', s.name);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'NOTICE'), s.notice);
  fs.writeFileSync(
    path.join(out, 'snapshot.json'),
    JSON.stringify(
      {
        dataset: s.dataset,
        config: s.config,
        split: s.split,
        revision: meta.sha,
        license: `${s.license} (see NOTICE next to this file)`,
        fetched_at: new Date().toISOString(),
        rule: { high: [...high].sort(), low: [...low].sort(), left_out: [...leftOutTags].sort(), credentials: [...s.credentials].sort() },
        offsets,
        block: pick(block),
        allow: pick(allow),
      },
      null,
      1
    ) + '\n'
  );
  console.log(`${s.name}: ${docs.length} rows read, ${block.length} block, ${allow.length} allow, ${leftOut} left out; kept ${Math.min(block.length, s.perLabel)} + ${Math.min(allow.length, s.perLabel)}`);
}
