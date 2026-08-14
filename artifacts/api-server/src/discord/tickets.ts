import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildTextBasedChannel,
  type ModalSubmitInteraction,
  type NewsChannel,
  type StringSelectMenuInteraction,
  type TextChannel,
} from "discord.js";
import {
  getConfig,
  isTicketCategory,
  supportDepartments,
  ticketCategories,
  type TicketCategory,
} from "./config";

const TICKET_TOPIC_PREFIX = "ticket:";

const ticketTopic = (userId: string, category: TicketCategory) =>
  `${TICKET_TOPIC_PREFIX}${userId}:${category}`;

const parseTicketTopic = (topic: string | null) => {
  const parts = topic?.split(":");
  if (!parts || parts.length !== 3 || parts[0] !== "ticket") return null;
  return {
    ownerId: parts[1],
    category: isTicketCategory(parts[2]) ? parts[2] : null,
  };
};

export function buildTicketPanel() {
  const config = getConfig();
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${config.brandName} • Support Center`)
    .setDescription(
      "Need help? Choose the department that best matches your request. Please select the correct category so the team can help you faster.",
    )
    .addFields({
      name: "Before opening a ticket",
      value:
        "Please do not share passwords, tokens, or other sensitive information. Opening a ticket in the wrong category may delay support.",
    })
    .setFooter({ text: "Fast support • Secure service" })
    .setTimestamp();

  if (config.brandIconUrl) embed.setThumbnail(config.brandIconUrl);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_category")
    .setPlaceholder("Choose your ticket category")
    .addOptions(
      Object.entries(ticketCategories).map(([value, category]) => ({
        value,
        label: category.label,
        description: category.description,
        emoji: category.emoji,
      })),
    );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
  };
}

function buildSupportDepartmentMenu() {
  const config = getConfig();
  const embed = new EmbedBuilder()
    .setColor(ticketCategories.support.color)
    .setTitle("Choose a support department")
    .setDescription(
      "Select the type of support you need. You will then be asked for a few details.",
    );
  if (config.brandIconUrl) embed.setThumbnail(config.brandIconUrl);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_support_department")
    .setPlaceholder("Choose a support department")
    .addOptions(
      supportDepartments.map((department) => ({
        value: department.value,
        label: department.label,
        description: department.description,
        emoji: department.emoji,
      })),
    );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
  };
}

function buildTicketModal(
  category: TicketCategory,
  supportDepartment?: string,
) {
  const definition = ticketCategories[category];
  const modal = new ModalBuilder()
    .setCustomId(
      `ticket_modal:${category}:${supportDepartment || "none"}`,
    )
    .setTitle(`${definition.label} Request`);

  const rows = definition.fields.map((field) => {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setPlaceholder(field.placeholder)
      .setStyle(
        field.style === "paragraph"
          ? TextInputStyle.Paragraph
          : TextInputStyle.Short,
      )
      .setRequired(field.required !== false);

    return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  });

  return modal.addComponents(rows);
}

export async function handleTicketCategorySelection(
  interaction: StringSelectMenuInteraction,
) {
  const selected = interaction.values[0];
  if (!isTicketCategory(selected)) {
    await interaction.reply({
      content: "That ticket category is no longer available. Please try again.",
      ephemeral: true,
    });
    return;
  }

  if (selected === "support") {
    await interaction.reply({
      ...buildSupportDepartmentMenu(),
      ephemeral: true,
    });
    return;
  }

  await interaction.showModal(buildTicketModal(selected));
}

export async function handleSupportDepartmentSelection(
  interaction: StringSelectMenuInteraction,
) {
  const department = supportDepartments.find(
    (entry) => entry.value === interaction.values[0],
  );

  if (!department) {
    await interaction.reply({
      content: "That support department is no longer available. Please try again.",
      ephemeral: true,
    });
    return;
  }

  await interaction.showModal(buildTicketModal("support", department.label));
}

function formatFormData(
  category: TicketCategory,
  interaction: ModalSubmitInteraction,
) {
  return ticketCategories[category].fields.map((field) => ({
    label: field.label,
    value: interaction.fields.getTextInputValue(field.id).trim() || "Not provided",
  }));
}

function buildTicketEmbed(
  category: TicketCategory,
  interaction: ModalSubmitInteraction,
  formData: { label: string; value: string }[],
  supportDepartment?: string,
) {
  const config = getConfig();
  const definition = ticketCategories[category];
  const embed = new EmbedBuilder()
    .setColor(definition.color)
    .setTitle(`${definition.emoji} ${definition.label} ticket`)
    .setDescription(
      `Welcome <@${interaction.user.id}>. A member of the team will be with you shortly.`,
    )
    .addFields(
      { name: "Requester", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Category", value: definition.label, inline: true },
      ...(supportDepartment
        ? [{ name: "Department", value: supportDepartment, inline: true }]
        : []),
      ...formData.map((field) => ({
        name: field.label,
        value: field.value.slice(0, 1024),
        inline: false,
      })),
    )
    .setFooter({ text: "Keep all updates in this ticket • Use Close when resolved" })
    .setTimestamp();

  if (config.brandIconUrl) embed.setThumbnail(config.brandIconUrl);
  return embed;
}

function buildTicketControls() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Claim")
      .setEmoji("🙋")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Close ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );
}

async function findExistingTicket(
  guild: Guild,
  userId: string,
  category: TicketCategory,
) {
  return guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      parseTicketTopic(channel.topic)?.ownerId === userId &&
      parseTicketTopic(channel.topic)?.category === category,
  );
}

export async function handleTicketModal(
  interaction: ModalSubmitInteraction,
) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Tickets can only be opened inside a server.",
      ephemeral: true,
    });
    return;
  }

  const [, categoryValue, supportDepartment] = interaction.customId.split(":");
  if (!categoryValue || !isTicketCategory(categoryValue)) {
    await interaction.reply({
      content: "That ticket form is no longer available. Please try again.",
      ephemeral: true,
    });
    return;
  }

  const category = categoryValue;
  const existingTicket = await findExistingTicket(
    interaction.guild,
    interaction.user.id,
    category,
  );
  if (existingTicket) {
    await interaction.reply({
      content: `You already have an open ${ticketCategories[category].label.toLowerCase()} ticket: <#${existingTicket.id}>`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const config = getConfig();
  const safeUsername = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const channelName = `ticket-${category}-${safeUsername || interaction.user.id.slice(-6)}`;
  const permissionOverwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  if (config.staffRoleId) {
    permissionOverwrites.push({
      id: config.staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId,
    topic: ticketTopic(interaction.user.id, category),
    permissionOverwrites,
    reason: `${ticketCategories[category].label} ticket opened by ${interaction.user.tag}`,
  });

  const formData = formatFormData(category, interaction);
  await channel.send({
    content: `<@${interaction.user.id}>${config.staffRoleId ? ` <@&${config.staffRoleId}>` : ""}`,
    embeds: [
      buildTicketEmbed(category, interaction, formData, supportDepartment !== "none" ? supportDepartment : undefined),
    ],
    components: [buildTicketControls()],
  });

  await interaction.editReply({
    content: `Your ticket has been created: <#${channel.id}>`,
  });
}

function isStaff(interaction: ButtonInteraction) {
  const config = getConfig();
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
      (config.staffRoleId &&
        interaction.member &&
        "roles" in interaction.member &&
        interaction.member &&
        "roles" in interaction.member &&
        (Array.isArray(interaction.member.roles)
          ? interaction.member.roles.includes(config.staffRoleId)
          : interaction.member.roles.cache.has(config.staffRoleId))),
  );
}

export async function handleTicketClaim(interaction: ButtonInteraction) {
  if (!isStaff(interaction)) {
    await interaction.reply({
      content: "Only the support team can claim tickets.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: `🙋 This ticket has been claimed by <@${interaction.user.id}>.`,
  });
}

async function fetchTranscriptMessages(channel: TextChannel | NewsChannel) {
  const messages = [];
  let before: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {}),
    });
    const pageMessages = Array.from(batch.values());
    if (pageMessages.length === 0) break;
    messages.push(...pageMessages);
    before = pageMessages[pageMessages.length - 1]?.id;
    if (pageMessages.length < 100) break;
  }

  return messages.sort(
    (first, second) => first.createdTimestamp - second.createdTimestamp,
  );
}

function transcriptText(
  channel: TextChannel | NewsChannel,
  messages: Awaited<ReturnType<typeof fetchTranscriptMessages>>,
) {
  const lines = [
    `Transcript: #${channel.name}`,
    `Generated: ${new Date().toISOString()}`,
    "",
  ];

  for (const message of messages) {
    const content = message.content || "[no text]";
    const attachments = Array.from(message.attachments.values())
      .map((attachment) => attachment.url)
      .join(" ");
    lines.push(
      `[${message.createdAt.toISOString()}] ${message.author.tag}: ${content}${attachments ? `\nAttachments: ${attachments}` : ""}`,
    );
  }

  return lines.join("\n").slice(0, 7_500_000);
}

export async function handleTicketClose(interaction: ButtonInteraction) {
  if (!isStaff(interaction)) {
    await interaction.reply({
      content: "Only the support team can close tickets.",
      ephemeral: true,
    });
    return;
  }

  if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "This button can only be used inside a ticket channel.",
      ephemeral: true,
    });
    return;
  }

  const ticket = parseTicketTopic(interaction.channel.topic);
  if (!ticket?.ownerId) {
    await interaction.reply({
      content: "This channel is not registered as a ticket.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  const config = getConfig();
  const transcript = transcriptText(
    interaction.channel,
    await fetchTranscriptMessages(interaction.channel),
  );
  const attachment = {
    attachment: Buffer.from(transcript, "utf8"),
    name: `${interaction.channel.name}-transcript.txt`,
  };

  let dmDelivered = false;
  try {
    const user = await interaction.client.users.fetch(ticket.ownerId);
    await user.send({
      content: `Your ${ticket.category ? ticket.category : ""} ticket in **${interaction.guild?.name || "the server"}** has been closed. Here is your transcript.`,
      files: [attachment],
    });
    dmDelivered = true;
  } catch {
    dmDelivered = false;
  }

  if (config.transcriptChannelId) {
    const transcriptChannel = await interaction.client.channels
      .fetch(config.transcriptChannelId)
      .catch(() => null);
    if (
      transcriptChannel &&
      (transcriptChannel.type === ChannelType.GuildText ||
        transcriptChannel.type === ChannelType.GuildAnnouncement)
    ) {
      await transcriptChannel.send({
        content: `Transcript for **#${interaction.channel.name}** closed by <@${interaction.user.id}>${dmDelivered ? "" : " (DM could not be delivered)"}.`,
        files: [attachment],
      });
    }
  }

  await interaction.editReply({
    content: dmDelivered
      ? "Ticket closed. The transcript was sent to the requester by DM."
      : "Ticket closed. I could not DM the requester, so the transcript was saved to the configured transcript channel if available.",
  });

  await interaction.channel
    .send("This ticket will be deleted shortly.")
    .catch(() => undefined);
  setTimeout(() => {
    void interaction.channel?.delete("Ticket closed");
  }, config.ticketDeleteDelayMs);
}

export function isTicketChannel(channel: GuildTextBasedChannel) {
  return Boolean(
    "topic" in channel && parseTicketTopic(channel.topic),
  );
}