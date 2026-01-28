// commands/runsystem/endheadcount.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config");

function getModeratorRoleId() {
  return config.MODERATOR_ROLE_ID || config.MOD_ROLE_ID || null;
}

async function isModerator(interaction) {
  const modRoleId = getModeratorRoleId();
  if (!modRoleId) return false;

  if (!interaction.inGuild()) return false;

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) return false;

  return member.roles.cache.has(modRoleId);
}

function looksLikeHeadcountMessage(msg) {
  if (!msg) return false;
  if (!msg.embeds || msg.embeds.length === 0) return false;

  const embed = msg.embeds[0];
  const title = (embed.title || "").toLowerCase();
  return title.startsWith("headcount:");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("endheadcount")
    .setDescription("Close a headcount in the raid channel.")
    .addStringOption((opt) =>
      opt
        .setName("messageid")
        .setDescription("Moderators only: end a specific headcount by message ID.")
        .setRequired(false)
    ),

  async execute(interaction) {
    // Fetch raid channel
    let raidChannel;
    try {
      raidChannel = await interaction.client.channels.fetch(config.RAID_CHANNEL_ID);
    } catch (err) {
      console.error("Failed to fetch raid channel for /endheadcount:", err);
    }

    if (!raidChannel || !raidChannel.isTextBased()) {
      await interaction.editReply(
        "I could not find the raid channel. Please check RAID_CHANNEL_ID in the config."
      );
      return;
    }

    const botId = interaction.client.user.id;
    const userId = interaction.user.id;
    const leaderMention = `<@${userId}>`;

    const messageIdOpt = interaction.options.getString("messageid");
    let headcountMessage = null;

    // If messageid is provided, moderators only
    if (messageIdOpt) {
      const modRoleId = getModeratorRoleId();
      if (!modRoleId) {
        await interaction.editReply(
          "Moderator role is not configured (MODERATOR_ROLE_ID / MOD_ROLE_ID)."
        );
        return;
      }

      const ok = await isModerator(interaction);
      if (!ok) {
        await interaction.editReply("You are not allowed to use the `messageid` option.");
        return;
      }

      // Fetch the specific message by ID
      try {
        headcountMessage = await raidChannel.messages.fetch(messageIdOpt);
      } catch (err) {
        await interaction.editReply(
          "I could not fetch that message ID in the raid channel. Make sure the ID is correct and from the raid channel."
        );
        return;
      }

      // Validate it looks like a headcount message created by the bot
      if (headcountMessage.author?.id !== botId || !looksLikeHeadcountMessage(headcountMessage)) {
        await interaction.editReply(
          "That message does not look like a bot headcount message (Headcount embed)."
        );
        return;
      }
    } else {
      // Default behavior: find most recent headcount started by this user
      try {
        const messages = await raidChannel.messages.fetch({ limit: 50 }); // newest first
        headcountMessage = messages.find((msg) => {
          if (msg.author.id !== botId) return false;
          if (!looksLikeHeadcountMessage(msg)) return false;

          const embed = msg.embeds[0];
          const desc = embed.description || "";

          // Your existing logic: match leader mention in the embed description
          return desc.includes(leaderMention);
        });
      } catch (err) {
        console.error("Failed to fetch messages for /endheadcount:", err);
      }

      if (!headcountMessage) {
        await interaction.editReply(
          "I couldn't find a recent headcount in the raid channel that you started."
        );
        return;
      }
    }

    const oldEmbed = headcountMessage.embeds[0];
    const dungeonName =
      (oldEmbed.title || "").replace(/^Headcount:\s*/i, "") || "Unknown";

    // Clear reactions
    try {
      await headcountMessage.reactions.removeAll();
    } catch (err) {
      console.error("Failed to clear reactions on headcount:", err);
    }

    // Mark as closed
    const oldDesc = oldEmbed.description || "";
    // Remove "React with" lines and collapse extra whitespace
    const cleanedDesc = oldDesc
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("React with"))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const closedLine = `\n\nHeadcount closed by ${interaction.user.tag}.`;
    const newEmbed = EmbedBuilder.from(oldEmbed)
      .setDescription(cleanedDesc + closedLine)
      .setFooter({ text: "Headcount closed" })
      .setTimestamp();

    try {
      await headcountMessage.edit({ embeds: [newEmbed] });
    } catch (err) {
      console.error("Failed to edit headcount message on /endheadcount:", err);
    }

    // Log the action (if configured)
    try {
      const logChannel = await interaction.client.channels.fetch(
        config.RUN_LOG_CHANNEL_ID
      );
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          content: `[ENDHEADCOUNT] Dungeon: ${dungeonName} | ClosedBy: <@${userId}> | Channel: ${raidChannel} | Message: ${headcountMessage.url}`,
        });
      }
    } catch (err) {
      console.error("Failed to send endheadcount log message:", err);
    }

    await interaction.editReply(
      `Closed headcount for **${dungeonName}** in ${raidChannel} and cleared all reactions.`
    );
  },
};
