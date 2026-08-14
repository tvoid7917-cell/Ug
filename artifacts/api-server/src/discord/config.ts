export type TicketCategory = "buy" | "support" | "replace" | "partnership";

export type TicketFormField = {
  id: string;
  label: string;
  placeholder: string;
  style: "short" | "paragraph";
  required?: boolean;
};

export type TicketCategoryDefinition = {
  label: string;
  emoji: string;
  description: string;
  color: number;
  fields: TicketFormField[];
};

export const ticketCategories: Record<
  TicketCategory,
  TicketCategoryDefinition
> = {
  buy: {
    label: "Buy",
    emoji: "🛒",
    description: "Purchase a listed product or request something custom.",
    color: 0x8b5cf6,
    fields: [
      {
        id: "product",
        label: "What do you want to purchase?",
        placeholder: "Product name or custom request",
        style: "short",
      },
      {
        id: "quantity",
        label: "Quantity",
        placeholder: "Example: 1x",
        style: "short",
      },
      {
        id: "variant",
        label: "Variant / Duration",
        placeholder: "Optional",
        style: "short",
        required: false,
      },
      {
        id: "payment",
        label: "Payment method",
        placeholder: "Example: PayPal, crypto, card",
        style: "short",
      },
      {
        id: "notes",
        label: "Anything else?",
        placeholder: "Optional details for the team",
        style: "paragraph",
        required: false,
      },
    ],
  },
  support: {
    label: "Support",
    emoji: "🛠️",
    description: "Payment, access, existing purchase, rewards, or general support.",
    color: 0x3b82f6,
    fields: [
      {
        id: "issue",
        label: "How can we help?",
        placeholder: "Explain the issue with as much detail as possible",
        style: "paragraph",
      },
      {
        id: "order",
        label: "Order / account reference",
        placeholder: "Optional",
        style: "short",
        required: false,
      },
      {
        id: "evidence",
        label: "Additional information",
        placeholder: "Optional links or context",
        style: "paragraph",
        required: false,
      },
    ],
  },
  replace: {
    label: "Replace",
    emoji: "⚠️",
    description: "Verify an invoice and request a replacement.",
    color: 0xf59e0b,
    fields: [
      {
        id: "invoice",
        label: "Invoice / purchase reference",
        placeholder: "Your invoice or order ID",
        style: "short",
      },
      {
        id: "reason",
        label: "Why do you need a replacement?",
        placeholder: "Describe the issue",
        style: "paragraph",
      },
      {
        id: "proof",
        label: "Additional proof or information",
        placeholder: "Optional links or details",
        style: "paragraph",
        required: false,
      },
    ],
  },
  partnership: {
    label: "Partnership",
    emoji: "🤝",
    description: "Send your server link, advertisement, and partnership request.",
    color: 0x14b8a6,
    fields: [
      {
        id: "server",
        label: "Server / Community name",
        placeholder: "Your server name",
        style: "short",
      },
      {
        id: "invite",
        label: "Server link / invite",
        placeholder: "https://discord.gg/...",
        style: "short",
      },
      {
        id: "members",
        label: "Member count",
        placeholder: "Example: 1,000",
        style: "short",
      },
      {
        id: "advertisement",
        label: "Your advertisement",
        placeholder: "Paste the ad you want the team to review.",
        style: "paragraph",
      },
      {
        id: "proposal",
        label: "What partnership are you looking for?",
        placeholder: "Tell us what you have in mind.",
        style: "paragraph",
      },
    ],
  },
};

export const supportDepartments = [
  {
    value: "payment",
    label: "Payment Help",
    emoji: "💳",
    description: "Payment pending, wrong amount, transaction, or payment-method help.",
  },
  {
    value: "purchase",
    label: "Existing Purchase",
    emoji: "🛍️",
    description: "Questions about an order you already purchased.",
  },
  {
    value: "access",
    label: "Access / Account Help",
    emoji: "🔐",
    description: "Login, access, customer role, or account-related assistance.",
  },
  {
    value: "reward",
    label: "Reward Claim",
    emoji: "🎁",
    description: "Claim an eligible giveaway, invite, supporter, or community reward.",
  },
  {
    value: "general",
    label: "General Support",
    emoji: "💬",
    description: "Something else? Tell the team what you need.",
  },
] as const;

export const getConfig = () => ({
  brandName: process.env.BRAND_NAME?.trim() || "United Knights",
  brandIconUrl: process.env.BRAND_ICON_URL?.trim() || undefined,
  brandUrl: process.env.BRAND_URL?.trim() || undefined,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID?.trim() || undefined,
  staffRoleId: process.env.STAFF_ROLE_ID?.trim() || undefined,
  transcriptChannelId: process.env.TRANSCRIPT_CHANNEL_ID?.trim() || undefined,
  ticketDeleteDelayMs: Math.max(
    1000,
    Number(process.env.TICKET_DELETE_DELAY_MS) || 5000,
  ),
  commandGuildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
});

export const isTicketCategory = (
  value: string,
): value is TicketCategory => value in ticketCategories;