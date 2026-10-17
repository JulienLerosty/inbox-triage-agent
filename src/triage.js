import { dryRunClassify, dryRunDraft } from './dryrun.js';
import { claudeTriage } from './claude.js';

const HUMAN_ONLY = (rubric) => Object.entries(rubric.labels).filter(([, d]) => d.action === 'human' && d.keywords.length);

// Safety net that runs in both modes: if the text contains any human-only keyword
// (money, complaint, legal, security, sales), the email is never auto-drafted, whatever the classifier said.
export function guard(email, rubric) {
  const text = `${email.subject}\n${email.body}`.toLowerCase();
  for (const [label, d] of HUMAN_ONLY(rubric)) {
    const k = d.keywords.find((w) => text.includes(w));
    if (k) return { label, keyword: k };
  }
  return null;
}

export async function triageOne(email, rubric, { dryRun = true, client } = {}) {
  let c = dryRun ? dryRunClassify(email, rubric) : await claudeTriage(email, rubric, { client });
  const notes = [];
  const g = guard(email, rubric);
  if (g && rubric.labels[c.label].action !== 'human') {
    notes.push(`guard: "${g.keyword}" forces ${g.label} (classifier said ${c.label})`);
    c = { ...c, label: g.label, confidence: Math.max(c.confidence, 0.9), draft: null };
  }
  const action = rubric.labels[c.label].action;
  let route = action === 'draft' ? 'draft' : action === 'ignore' ? 'ignore' : 'human-queue';
  if (route === 'draft' && c.confidence < rubric.minConfidence) {
    notes.push(`confidence ${c.confidence} below ${rubric.minConfidence}`);
    route = 'human-queue';
  }
  const draft = route === 'draft' ? (c.draft ?? dryRunDraft(email, c.label, rubric)) : null;
  return { id: email.id, from: email.from, subject: email.subject, label: c.label, confidence: c.confidence, reason: c.reason, route, notes, draft };
}

export async function triage(emails, rubric, opts = {}) {
  const out = [];
  for (const e of emails) out.push(await triageOne(e, rubric, opts));
  return out;
}

export function summarize(results) {
  const by = (r) => results.filter((x) => x.route === r).length;
  return { total: results.length, drafted: by('draft'), humanQueue: by('human-queue'), ignored: by('ignore') };
}
