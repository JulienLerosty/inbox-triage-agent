import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { triage, triageOne, summarize, guard } from '../src/triage.js';
import { claudeTriage, systemPrompt } from '../src/claude.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
const rubric = load('rubric.json');
const emails = load('fixtures/emails.json');
const CLI = new URL('../bin/cli.js', import.meta.url).pathname;
const fake = (obj) => ({ messages: { create: async () => ({ content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] }) } });

test('dry-run routes every fixture as planted', async () => {
  const r = Object.fromEntries((await triage(emails, rubric)).map((x) => [x.id, x]));
  const want = { e01: 'meeting-request', e02: 'order-status', e03: 'faq', e04: 'thanks', e05: 'billing', e06: 'complaint', e07: 'legal-security', e08: 'sales-lead', e09: 'spam', e10: 'faq', e11: 'other', e12: 'legal-security', e13: 'billing' };
  for (const [id, label] of Object.entries(want)) assert.equal(r[id].label, label, id);
  assert.deepEqual(['e01', 'e02', 'e03', 'e04', 'e10'].filter((id) => r[id].route !== 'draft'), []);
  assert.deepEqual(['e05', 'e06', 'e07', 'e08', 'e11', 'e12', 'e13'].filter((id) => r[id].route !== 'human-queue'), []);
  assert.equal(r.e09.route, 'ignore');
});

test('summary counts add up', async () => {
  const s = summarize(await triage(emails, rubric));
  assert.deepEqual(s, { total: 13, drafted: 5, humanQueue: 7, ignored: 1 });
});

test('mixed thanks + refund is never auto-drafted (guard)', async () => {
  const r = await triageOne(emails.find((e) => e.id === 'e13'), rubric);
  assert.equal(r.route, 'human-queue');
  assert.equal(r.draft, null);
});

test('guard overrides a live model that wrongly says routine', async () => {
  const client = fake({ label: 'thanks', confidence: 0.99, reason: 'polite', draft: 'Sure, refund done!' });
  const r = await triageOne(emails.find((e) => e.id === 'e13'), rubric, { dryRun: false, client });
  assert.equal(r.route, 'human-queue');
  assert.equal(r.draft, null);
  assert.match(r.notes[0], /guard/);
});

test('low confidence routine email goes to the human queue', async () => {
  const client = fake({ label: 'faq', confidence: 0.4, reason: 'unsure', draft: 'Hi' });
  const r = await triageOne({ id: 'x', from: 'a@b.c', subject: 'Hello', body: 'Tell me about your studio.' }, rubric, { dryRun: false, client });
  assert.equal(r.route, 'human-queue');
});

test('live path: uses the model draft and the rubric in the system prompt', async () => {
  let seen;
  const client = { messages: { create: async (p) => { seen = p; return { content: [{ type: 'text', text: '```json\n{"label":"faq","confidence":0.9,"reason":"hours","draft":"Hi Lena, 9-17 CET. Northwind Studio team"}\n```' }] }; } } };
  const r = await triageOne(emails.find((e) => e.id === 'e03'), rubric, { dryRun: false, client });
  assert.equal(r.route, 'draft');
  assert.match(r.draft, /9-17/);
  assert.match(seen.system, /billing \(human\)/);
  assert.match(seen.system, /untrusted/);
});

test('live path rejects bad JSON and unknown labels', async () => {
  await assert.rejects(claudeTriage(emails[0], rubric, { client: fake('nope') }), /valid JSON/);
  await assert.rejects(claudeTriage(emails[0], rubric, { client: fake({ label: 'party', confidence: 1 }) }), /unknown label/);
});

test('guard returns null for plain routine mail', () => {
  assert.equal(guard(emails[0], rubric), null);
  assert.ok(systemPrompt(rubric).includes(rubric.business));
});

test('CLI --dry-run writes triage.md and triage.json; errors are clean', () => {
  const out = mkdtempSync(join(tmpdir(), 'triage-'));
  const ok = spawnSync('node', [CLI, new URL('../fixtures/emails.json', import.meta.url).pathname, '--dry-run', '--out', out], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(readFileSync(join(out, 'triage.md'), 'utf8'), /13 emails: 5 drafted, 7 queued/);
  assert.equal(JSON.parse(readFileSync(join(out, 'triage.json'), 'utf8')).length, 13);
  const noKey = spawnSync('node', [CLI, 'x.json'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(noKey.status, 1);
  assert.match(noKey.stderr, /ANTHROPIC_API_KEY/);
});
