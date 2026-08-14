import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type NewsChannel,
  type TextChannel,
} from "discord.js";
import { buildTicketPanel } from "./tickets";

export const commands = [
  new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Post the professional ticket panel in this channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),
  new SlashCommandBuilder()
    .setName("send-message")
    .setDescription("Send a message, optional image, and optional @everyone mention.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString())
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel where the message should be sent.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send.")
        .setMaxLength(2000)
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName("everyone")
        .setDescription("Mention @everyone in the message.")
        .setRequired(false),
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("Optional image attachment.")
        .setRequired(false),
    ),
].map((command) => command.toJSON());

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
) {
  if (interaction.commandName === "ticket-panel") {
    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.reply({
        content: "This command must be used in a text channel.",
        ephemeral: true,
      });
      return;
    }

    await (interaction.channel as TextChannel | NewsChannel).send(
      buildTicketPanel(),
    );
    await interaction.reply({
      content: "Ticket panel posted.",
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === "send-message") {
    const channel = interaction.options.getChannel("channel", true);
    const message = interaction.options.getString("message", true);
    const everyone = interaction.options.getBoolean("everyone") || false;
    const image = interaction.options.getAttachment("image");

    const target = interaction.guild?.channels.cache.get(channel.id);
    if (
      !target ||
      (target.type !== ChannelType.GuildText &&
        target.type !== ChannelType.GuildAnnouncement)
    ) {
      await interaction.reply({
        content: "Please choose a server text or announcement channel.",
        ephemeral: true,
      });
      return;
    }

    await target.send({
      content: everyone ? `@everyone ${message}` : message,
      allowedMentions: everyone ? { parse: ["everyone"] } : { parse: [] },
      files: image ? [{ attachment: image.url, name: image.name }] : [],
    });
    await interaction.reply({
      content: `Message sent to <#${target.id}>${everyone ? " with @everyone." : "."}`,
      ephemeral: true,
    });
  }
}