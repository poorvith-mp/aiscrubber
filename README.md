# AIscrubber

AIscrubber is a browser-local text redaction workspace. It replaces likely sensitive patterns with consistent labels before you paste text into another tool or send it to someone else.

It currently detects emails, phone numbers, IPv4 addresses, URLs, card-like numbers, API keys or bearer tokens, and selected prefixed identifiers. Each detector can be turned on or off.

## Privacy and limits

Redaction runs in the browser. The text entered in the workspace is not sent to an application server for processing.

Vercel Analytics is enabled for aggregate site-usage measurement. It does not receive the text entered in the workspace.

Pattern matching is fallible: it may miss sensitive context or replace harmless text. Always read the cleaned result before sharing it.

## Local development

```bash
npm install
npm run dev
```

`npm run build` creates a production build in `dist/`.

## Stack

React, TypeScript, Vite, Tailwind CSS, and Vercel Analytics.

## Author

Built by [Poorvith M P](https://poorvithmp.com). Source is available under the MIT licence.
