#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { triage, summarize } from '../src/triage.js';
import { renderMarkdown } from '../src/render.js';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  'dry-run': { type: 'boolean' }, rubric: { type: 'string', default: new URL('../rubric.json', import.meta.url).pathname },
  out: { type: 'string', default: 'out' }, help: { type: 'boolean' } } });
if (values.help || !positionals[0]) {
  console.log('Usage: inbox-triage <emails.json> [--dry-run] [--rubric rubric.json] [--out dir]\n\nemails.json: [{id, from, subject, body}]. Nothing is ever sent.\nWithout --dry-run, set ANTHROPIC_API_KEY.');
  process.exit(values.help ? 0 : 1);
}
try {
  const dry = values['dry-run'];
  if (!dry && !process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set (use --dry-run to try it without a key)');
  const emails = JSON.parse(readFileSync(positionals[0], 'utf8'));
  if (!Array.isArray(emails) || emails.some((e) => !e.id || !e.subject || !e.body || !e.from)) throw new Error('emails.json must be an array of {id, from, subject, body}');
  const rubric = JSON.parse(readFileSync(values.rubric, 'utf8'));
  const results = await triage(emails, rubric, { dryRun: !!dry });
  const md = renderMarkdown(results, summarize(results), { source: basename(positionals[0]), mode: dry ? 'dry-run' : 'live' });
  mkdirSync(values.out, { recursive: true });
  writeFileSync(join(values.out, 'triage.md'), md);
  writeFileSync(join(values.out, 'triage.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(md);
} catch (e) { console.error('Error: ' + e.message); process.exit(1); }
