# Fondaro for Zapier

The Zapier integration for [Fondaro](https://fondaro.com), the CRM for real estate agencies.

## What it does

- **New Lead** (trigger): fires when a lead is assigned to your organization.
- **Create Lead** (action): adds a lead to your Fondaro CRM. `language` (a BCP-47 tag such as `en-GB`) is required.
- **List Tags** (hidden trigger): feeds the Tags dropdown on Create Lead.

It talks to the public Fondaro API at `https://api.fondaro.com/zapier`. See the [API docs](https://fondaro.com/docs).

## Development

```bash
npm install
zapier-platform validate
zapier-platform push
```

Needs [`zapier-platform-cli`](https://github.com/zapier/zapier-platform) and `zapier-platform login`. A `.env` with `ACCESS_TOKEN` and `REFRESH_TOKEN` is used for local `invoke` runs and is never committed.

## License

MIT
