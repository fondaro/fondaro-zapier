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
  <img alt="Zapier platform" src="https://img.shields.io/badge/zapier--platform-18.6-ff4f00.svg" />
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D22-339933.svg" />
</p>

---

## What you can do

Send new buyer and seller enquiries into Fondaro from your forms, ads and spreadsheets, and push every lead Fondaro assigns to you into the tools your team already uses.

| | Type | What it does |
|---|---|---|
| **New Lead** | Trigger | Fires when a lead is assigned to your organization. Gives you the lead's name, email, phone, language, lead plan, status and timestamps. |
| **Create Lead** | Action | Adds a lead to your Fondaro CRM, with an optional status, owner and tags. |
| **List Tags** | Hidden trigger | Powers the Tags dropdown on Create Lead. |

### Create Lead fields

| Field | Required | Notes |
|---|---|---|
| First Name | Yes | |
| Last Name | Yes | |
| Email | Yes | |
| Phone Number | Yes | Include the country code, for example `+34612345678`. |
| Language | Yes | A BCP-47 tag such as `en-GB`, `es-ES` or `da-DK`. Fondaro uses it to route and match the lead. |
| CRM Status | No | `lead`, `potential`, `bad_timing`, `client` or `unqualified`. |
| Owner ID | No | The Clerk user ID of the team member to assign the lead to. Leave empty for unassigned. |
| Tags | No | Pick from your organization's tags. |

### New Lead sample

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+34600000000",
  "language": "English",
  "leadGroupName": "Costa del Sol Buyers",
  "status": "PURCHASED",
  "assignedAt": "2026-03-06T12:00:00.000Z",
  "createdAt": "2026-03-06T11:00:00.000Z",
  "additionalInfo": {}
}
```

`leadGroupName` is `null` when a lead does not belong to a lead plan.

## Getting started

1. Open Zapier and create a Zap.
2. Search for **Fondaro** and pick a trigger or action.
3. Connect your account. You sign in with Fondaro and approve access for your organization.
4. Map your fields and turn the Zap on.

Need an account? [Start at fondaro.com](https://fondaro.com).

## Example Zaps

- **Google Forms to Fondaro:** every new form response becomes a lead, tagged with the form it came from.
- **Fondaro to Slack:** post every newly assigned lead to your sales channel.
- **Fondaro to Google Sheets:** keep a running log of assigned leads for reporting.
- **Facebook Lead Ads to Fondaro:** add each ad lead to your CRM with the right owner.

## How it works

The integration talks to the public Fondaro API under `https://api.fondaro.com/zapier` and authenticates with OAuth 2.0. Access is scoped to the organization you connect. See the [Fondaro docs](https://fondaro.com/docs) for the full API.

```
authentication.js          OAuth 2.0 connection
triggers/new_lead_assigned.js
triggers/list_tags.js
creates/create_lead.js
test/                      Jest tests
```

## Development

You need Node 22 or newer and the [Zapier Platform CLI](https://github.com/zapier/zapier-platform/tree/main/packages/cli).

```bash
npm install -g zapier-platform-cli
zapier-platform login

npm install
npm test                     # run the tests
zapier-platform validate     # check the integration definition
zapier-platform push         # upload a new private version
```

For local `zapier-platform invoke` runs, put `ACCESS_TOKEN` and `REFRESH_TOKEN` in a `.env` file. It is gitignored and must never be committed. The OAuth client secret is read from the `CLIENT_SECRET` environment variable on Zapier.

Bump `version` in `package.json` before each push.

## Support

Questions or problems? Email [support@fondaro.com](mailto:support@fondaro.com) or open an issue on this repository.

## License

[MIT](LICENSE) © Fondaro
