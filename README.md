# inbox-triage-agent

Labels incoming emails against a **written rubric**, drafts replies for the routine ones, and queues everything else for a human. **It never sends anything**: it writes a review file.

> Built by Julien Lerosty. AI tools, mainly Claude, are used under his supervision; he reviews and tests every delivery. MIT licensed. All sample data is invented.

## Try it (no API key, no network)

```
npm install        # only needed for live mode
node bin/cli.js fixtures/emails.json --dry-run
npm test           # 9 tests, no network
```

Output goes to `out/triage.md` (for people) and `out/triage.json` (for other tools).

## How it decides

1. **Rubric** (`rubric.json`): each label has a rule in plain words, an action (`draft`, `human` or `ignore`) and keywords. You edit this file, not the code. Routine labels here: meeting-request, order-status, faq, thanks. Human labels: billing, complaint, legal-security, sales-lead, other. Spam is ignored.
2. **Classifier**: in `--dry-run` a deterministic keyword scorer; live, Claude gets the rubric and the email and returns JSON (label, confidence, reason, draft).
3. **Safety guard** (both modes): if the text contains any human-only keyword (refund, GDPR, vulnerability, quote for...), the email is never auto-drafted, even if the model called it routine. The fixture "Thanks + refund?" shows this.
4. **Confidence floor**: a routine email under `minConfidence` (0.75) goes to the human queue.
5. Drafts may use only the FAQ facts in the rubric. The email text is treated as untrusted data in the prompt.

## Live mode

```
export ANTHROPIC_API_KEY=...   # from your environment, never committed
node bin/cli.js my-emails.json
```

Default model `claude-sonnet-5-5`, override with `INBOX_TRIAGE_MODEL`. The live path is covered by tests with an injected fake client; it has not been run against the real API in this repo yet.

Input format: `[{ "id", "from", "subject", "body" }]`.

## Sample output (dry-run on the fixtures)

Summary and routing table (full file: `fixtures/sample-triage.md`):

```
# Inbox triage (dry-run mode, emails.json)

13 emails: 5 drafted, 7 queued for a human, 1 ignored as spam.

Drafts are never sent. A person reviews each one first.

| id | from | label | confidence | route |
|---|---|---|---|---|
| e01 | maria@example.org | meeting-request | 0.95 | draft |
| e02 | tom@example.org | order-status | 0.95 | draft |
| e03 | lena@example.org | faq | 0.95 | draft |
| e04 | paul@example.org | thanks | 0.8 | draft |
| e05 | ana@example.org | billing | 0.95 | human-queue |
| e06 | karl@example.org | complaint | 0.95 | human-queue |
| e07 | dpo@lawfirm.example | legal-security | 0.95 | human-queue |
| e08 | cfo@startup.example | sales-lead | 0.95 | human-queue |
| e09 | growth@seo-boost.example | spam | 0.95 | ignore |
| e10 | sam@example.org | faq | 0.95 | draft |
| e11 | jo@example.org | other | 0.3 | human-queue |
| e12 | security@researcher.example | legal-security | 0.8 | human-queue |
| e13 | ivy@example.org | billing | 0.9 | human-queue |
```

## What I'd build for you

- Connect it to Gmail or Outlook read-only, so it labels and files drafts in your Drafts folder.
- A rubric written with you from 100 of your real emails, with a measured accuracy before anything goes live.
- A weekly report of what was queued and why, so the rubric keeps improving.

## Hire me

I build small, tested automations like this one for clients.

- Upwork: https://www.upwork.com/freelancers/~011ec6fab9b610aea9

AI tools, mainly Claude, are used under my supervision; I review and test every delivery.
