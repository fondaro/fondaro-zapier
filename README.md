<p align="center">
  <a href="https://fondaro.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/fondaro-logo-dark.svg" />
      <img src="assets/fondaro-logo-light.svg" alt="Fondaro" height="40" />
    </picture>
  </a>
</p>

<h1 align="center">Fondaro for Zapier</h1>

<p align="center">
  Connect <a href="https://fondaro.com">Fondaro</a>, the CRM for real estate agencies, to the 7,000+ apps on Zapier.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Zapier platform" src="https://img.shields.io/badge/zapier--platform-19.2-ff4f00.svg" />
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D22-339933.svg" />
</p>

---

## What you can do

Start a Zap the moment something happens in your Fondaro CRM, and create, find and update leads, deals, tasks and notes from any other app. Every trigger is instant and hands the Zap the full record, so you rarely need a lookup step.

### Triggers (instant)

| Trigger | Starts when | Options |
|---|---|---|
| New Lead | A lead lands in your CRM | Only leads from your lead plans |
| Lead Status Changed | A lead's status changes | To status |
| Lead Assigned | A lead is assigned; includes the team members added | Only when assigned to |
| Lead Tagged / Lead Untagged | A tag is added to or removed from a lead | Only for tags |
| New Deal | A deal is created | Stage |
| Deal Stage Changed | A deal moves stage | To stage |
| Deal Won / Deal Lost | A deal is closed (with its value or reason) | |
| New Task / Task Completed | A task is created or completed on a lead | |
| New Note | A note is added to a lead | |
| Call Logged | A call is recorded on a lead | Outcome, Missed calls only |
| Call Analyzed | A call's analysis is ready | |

### Actions

Create Lead, Update Lead Contact, Update Lead Status, Add Lead Assignees, Add Tags to Lead, Create Deal, Change Deal Stage, Close Deal as Won, Close Deal as Lost, Create Task, Create Note.

### Searches

Find Lead, Find Lead by ID, Search Leads, Find Leads, Find Lead Activities, Find Lead Calls, Find Leads by Meaning, Find Leads for a Listing, Find Lead Tags, Find Deal, Find Deals on Lead, Find Team Member, Find Viewing, Find Viewings, and **Find or Create Lead**.

The full guide is at [fondaro.com/docs/dashboard/zapier](https://fondaro.com/docs/dashboard/zapier).

## Upgrading from 2.x

Version 3.0 connects through Fondaro's own sign-in and the same API the n8n node uses. Zapier cannot move a connection across that change, so:

1. Reconnect Fondaro in Zapier (an organization admin approves it).
2. Rebuild Zaps that used **New Lead Assigned**: use **New Lead** with **Only leads from your lead plans** on. The lead now carries `leadPlanName` (was `leadGroupName`), `crmStatus` (was the raw `status`) and `origin` (was `additionalInfo`).
3. **Create Lead** now needs a first name plus an email or a phone; pick team members from a list instead of typing an owner ID.

## How it works

The app calls `https://api.fondaro.com/integrations/v1` with an OAuth 2.0 token (PKCE, the integrations resource, rotating refresh tokens). Triggers are REST hooks: each Zap subscribes to one event, Fondaro sends a signed, id-only delivery, and the app checks the HMAC signature and reads the record with the Zap's own token. Only an organization admin can connect.

```
src/index.ts                 the app definition
src/authentication.ts        OAuth 2.0
src/lib/                     request helper and errors, signature check, hook factory,
                             dropdowns, vocabulary, records, inputs, samples, fields
src/triggers/  src/creates/  src/searches/  src/search-or-creates/
test/                        Vitest + nock, no network
```

## Development

Node 22 or newer.

```bash
npm install
npm test                          # Vitest
npm run build                     # tsc → dist/
npx zapier-platform validate      # check the definition
npx zapier-platform push          # upload a private version (bump version first)
```

`CLIENT_ID` and `CLIENT_SECRET` are environment variables on the Zapier version (`zapier-platform env:set <version> …`), never in this repository. A private dev version may also set `FONDARO_BASE_URL` to reach a development API; released versions never do.

## Support

Questions or problems? Email [support@fondaro.com](mailto:support@fondaro.com) or open an issue on this repository.

## License

[MIT](LICENSE) © Fondaro
