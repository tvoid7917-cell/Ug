import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  type Interaction,
} from "discord.js";
import { commands, handleChatInputCommand } from "./commands";
import {
  handleSupportDepartmentSelection,
  handleTicketCategorySelection,
  handleTicketClaim,
  handleTicketClose,
  handleTicketModal,
} from "./tickets";
import { getConfig } from "./config";
import { logger } from "../lib/logger";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error(
    "DISCORD_TOKEN is required. Add it as a secret before starting the bot.",
  );
}

const discordToken: string = token;

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

async function registerCommands() {
  const config = getConfig();
  const rest = new REST({ version: "10" }).setToken(discordToken);
  const route = config.commandGuildId
    ? Routes.applicationGuildCommands(discordClient.user!.id, config.commandGuildId)
    : Routes.applicationCommands(discordClient.user!.id);

  await rest.put(route, { body: commands });
  logger.info(
    {
      scope: config.commandGuildId ? "guild" : "global",
      guildId: config.commandGuildId,
      count: commands.length,
    },
    "Discord slash commands registered",
  );
}

async function handleInteraction(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    await handleChatInputCommand(interaction);
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_category") {
      await handleTicketCategorySelection(interaction);
    } else if (interaction.customId === "ticket_support_department") {
      await handleSupportDepartmentSelection(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("ticket_modal:")) {
      await handleTicketModal(interaction);
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === "ticket_claim") {
      await handleTicketClaim(interaction);
    } else if (interaction.customId === "ticket_close") {
      await handleTicketClose(interaction);
    }
  }
}

export async function startDiscordBot() {
  discordClient.once(Events.ClientReady, async (client) => {
    logger.info(
      { user: client.user.tag, guilds: client.guilds.cache.size },
      "Discord bot is online",
    );
    await registerCommands();
    client.user.setPresence({
      activities: [{ name: "Watching United Knights", type: 3 }],
      status: "online",
    });
  });

  discordClient.on(Events.InteractionCreate, (interaction) => {
    void handleInteraction(interaction).catch(async (error: unknown) => {
      logger.error({ err: error }, "Discord interaction failed");
      if (interaction.isRepliable()) {
        const message = {
          content:
            "Something went wrong while handling that request. Please try again or contact a staff member.",
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(message).catch(() => undefined);
        } else {
          await interaction.reply(message).catch(() => undefined);
        }
      }
    });
  });

  discordClient.on(Events.Error, (error) => {
    logger.error({ err: error }, "Discord client error");
  });

  await discordClient.login(discordToken);
}