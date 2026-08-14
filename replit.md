# Discord Support Bot

A Railway-ready Discord support bot with staff messaging and professional category-based tickets.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secret: `DISCORD_TOKEN`
- Optional env: `DISCORD_GUILD_ID`, `STAFF_ROLE_ID`, `TICKET_CATEGORY_ID`, `TRANSCRIPT_CHANNEL_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/discord/config.ts` — ticket categories, form fields, and deployment configuration
- `artifacts/api-server/src/discord/commands.ts` — slash command definitions and handlers
- `artifacts/api-server/src/discord/tickets.ts` — panels, modals, ticket channels, closing, and transcripts
- `artifacts/api-server/src/discord/bot.ts` — Discord client startup and interaction routing
- `.env.example` — safe configuration reference
- `railway.toml` — Railway build, start, and restart configuration

## Architecture decisions

- Discord interactions are handled with Discord.js v14 slash commands, select menus, buttons, and modals.
- Ticket ownership is encoded in the private channel topic, so no separate database is needed for the first deployment.
- Transcript delivery is attempted by DM and can also be archived in a configured staff channel.
- Server-specific IDs are environment variables so the bot can be deployed to GitHub/Railway without source changes.

## Product

Staff can send controlled announcements to any server channel and launch a branded ticket panel. Members choose Buy, Support, Replace, or Partnership, complete a matching form, receive a private channel, and get a transcript by DM after closure.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `DISCORD_GUILD_ID` makes slash commands appear immediately; global commands can take up to an hour to propagate.
- The bot needs Manage Channels and the configured staff role/category IDs must belong to the same Discord server.
- Never commit `DISCORD_TOKEN`; use Replit Secrets locally and Railway Variables marked as secret in deployment.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
