// Offline classifier + drafter for --dry-run and tests: deterministic keyword scoring, no network, no model.
export function dryRunClassify(email, rubric) {
  const text = `${email.subject}\n${email.body}`.toLowerCase();
  let best = { label: 'other', hits: 0 };
  for (const [label, def] of Object.entries(rubric.labels)) {
    const hits = def.keywords.filter((k) => text.includes(k)).length;
    if (hits > best.hits) best = { label, hits };
  }
  if (!best.hits) return { label: 'other', confidence: 0.3, reason: 'no rubric keyword matched' };
  return { label: best.label, confidence: Math.min(0.95, 0.65 + 0.15 * best.hits), reason: `${best.hits} rubric keyword(s) for "${best.label}"` };
}

const first = (email) => (email.from.split('@')[0].replace(/^./, (c) => c.toUpperCase()));

export function dryRunDraft(email, label, rubric) {
  const f = rubric.faq;
  const body = {
    'meeting-request': `Thanks for reaching out. You can pick a time that suits you here: ${f.bookingLink}. We will confirm once you have booked.`,
    'order-status': `Thanks for your message. We are checking the status of your order and will send you the tracking details as soon as we have them.`,
    faq: `Thanks for your question. Our hours are ${f.hours} Turnaround: ${f.turnaround} Formats: ${f.formats}`,
    thanks: `Thank you for letting us know, we are glad it arrived safely. Tell us if you need anything else.`,
  }[label] ?? 'Thanks for your message. A member of the team will get back to you.';
  return `Hi ${first(email)},\n\n${body}\n\nBest regards,\n${rubric.signature}`;
}
