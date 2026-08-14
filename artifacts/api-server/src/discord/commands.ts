import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("dm-all")
    .setDescription("Send a professional direct message to every non-bot member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The professional message to send to members.")
        .setMaxLength(2000)
        .setRequired(true),
    )
].map((command) => command.toJSON());

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
) {
  if (interaction.commandName !== "dm-all") return;

  if (!interaction.guild) {
    await interaction.reply({
      content: "This command can only be used inside your server.",
      ephemeral: true,
    });
    return;
  }

  const message = interaction.options.getString("message", true).trim();
  await interaction.deferReply({ ephemeral: true });

  const members = await interaction.guild.members.fetch();
  const recipients = members.filter(
    (member) => !member.user.bot && !member.user.system,
  );

  let sent = 0;
  let failed = 0;

  for (const member of recipients.values()) {
    try {
      await member.send({
        content: message,
        allowedMentions: { parse: [] },
      });
      sent += 1;
    } catch {
      failed += 1;
    }

    await wait(250);
  }

  await interaction.editReply(
    `Professional DM complete. Sent: **${sent}**. Could not deliver: **${failed}**.`,
  );
}