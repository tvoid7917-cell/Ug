# Discord Support Bot

A production-ready Discord bot for a support server. It includes:

- `/send-message` for staff to send a message to any text or announcement channel
- Optional `@everyone` mention and image attachment support
- `/ticket-panel` for posting the ticket launcher
- Buy, Support, Replace, and Partnership ticket categories
- A support department picker for payment, purchase, account, rewards, and general help
- Category-specific forms using Discord modals
- Private ticket channels with staff permissions
- Claim and close controls
- Transcript delivery to the requester by DM when a ticket is closed
- Optional transcript archive channel
- Railway restart settings and health endpoint

## Discord Developer Portal setup

Create an application at <https://discord.com/developers/applications>, add a Bot user, and enable the following bot permissions when generating the invite:

- View Channels
- Send Messages
- Read Message History
- Embed Links
- Attach Files
- Manage Channels
- Manage Messages

Use the `bot` and `applications.commands` scopes. The bot must have permission to manage the category where tickets will be created.

## Environment variables

Copy `.env.example` to your deployment settings.

`DISCORD_TOKEN` is required and must be stored as a secret. Never commit it to GitHub.

`DISCORD_GUILD_ID` is strongly recommended for development and first setup. With it set, slash commands update immediately in that server. Without it, commands are registered globally and Discord may take up to an hour to show them.

Set `STAFF_ROLE_ID` to the role that should see tickets. Set `TICKET_CATEGORY_ID` to the Discord category where ticket channels should be created. Set `TRANSCRIPT_CHANNEL_ID` if you also want a staff archive of transcripts.
`BRAND_BANNER_URL` controls the banner shown at the bottom of the ticket panel. The included default can be replaced with a permanent image URL if the Discord CDN link expires.

## Running

```bash
pnpm install
DISCORD_TOKEN=your-token PORT=5000 pnpm --filter @workspace/api-server run dev
```

The health endpoint is available at `/api/healthz`.

## Railway

Push this repository to GitHub, create a Railway service from the repository, and add the variables above in the service's Variables tab. Railway will use `railway.toml`, keep the service alive on failure, and provide `PORT` automatically.