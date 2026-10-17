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

## Drafts for review

### e01: Re: Quick call this week?

> Hi Maria,
> 
> Thanks for reaching out. You can pick a time that suits you here: https://example.com/book (sample link). We will confirm once you have booked.
> 
> Best regards,
> Northwind Studio team

### e02: Re: Where is my order #4821?

> Hi Tom,
> 
> Thanks for your message. We are checking the status of your order and will send you the tracking details as soon as we have them.
> 
> Best regards,
> Northwind Studio team

### e03: Re: Opening hours

> Hi Lena,
> 
> Thanks for your question. Our hours are Monday to Friday, 9:00 to 17:00 CET. Turnaround: Standard projects take 5 to 7 working days after briefing. Formats: We deliver PNG, SVG and PDF; source files (Figma, AI) on request.
> 
> Best regards,
> Northwind Studio team

### e04: Re: Re: files

> Hi Paul,
> 
> Thank you for letting us know, we are glad it arrived safely. Tell us if you need anything else.
> 
> Best regards,
> Northwind Studio team

### e10: Re: Turnaround and formats

> Hi Sam,
> 
> Thanks for your question. Our hours are Monday to Friday, 9:00 to 17:00 CET. Turnaround: Standard projects take 5 to 7 working days after briefing. Formats: We deliver PNG, SVG and PDF; source files (Figma, AI) on request.
> 
> Best regards,
> Northwind Studio team

## Human queue

- **e05** (billing) Charged twice: 3 rubric keyword(s) for "billing"
- **e06** (complaint) Unacceptable: 3 rubric keyword(s) for "complaint"
- **e07** (legal-security) GDPR data deletion request: 2 rubric keyword(s) for "legal-security"
- **e08** (sales-lead) New project: rebrand: 3 rubric keyword(s) for "sales-lead"
- **e11** (other) Hm: no rubric keyword matched
- **e12** (legal-security) Found a vulnerability on your site: 1 rubric keyword(s) for "legal-security"
- **e13** (billing) Thanks + refund?: 1 rubric keyword(s) for "thanks"; guard: "refund" forces billing (classifier said thanks)
