export function renderMarkdown(results, summary, { source, mode }) {
  const L = [`# Inbox triage (${mode} mode, ${source})`, '',
    `${summary.total} emails: ${summary.drafted} drafted, ${summary.humanQueue} queued for a human, ${summary.ignored} ignored as spam.`,
    '', 'Drafts are never sent. A person reviews each one first.', '',
    '| id | from | label | confidence | route |', '|---|---|---|---|---|',
    ...results.map((r) => `| ${r.id} | ${r.from} | ${r.label} | ${r.confidence} | ${r.route} |`), '', '## Drafts for review', ''];
  for (const r of results.filter((x) => x.route === 'draft')) L.push(`### ${r.id}: Re: ${r.subject}`, '', ...r.draft.split('\n').map((l) => `> ${l}`), '');
  L.push('## Human queue', '');
  for (const r of results.filter((x) => x.route === 'human-queue'))
    L.push(`- **${r.id}** (${r.label}) ${r.subject}: ${[r.reason, ...r.notes].filter(Boolean).join('; ')}`);
  return L.join('\n') + '\n';
}
