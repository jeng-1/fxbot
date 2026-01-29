// fxbot/commands/log/quota.js
// /quota
// Always outputs "message 2" style:
// - Mentions users (<@id>) so Discord shows them
// - Suppresses notifications so it does not push-notify
// - One message (reply immediately, then edit with results)

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const config = require("../../config");
const { getUserStats } = require("../../services/storage");
const { requireStaff } = require("../../services/permissions");

module.exports = {
  skipDefer: true,

  data: new SlashCommandBuilder()
    .setName("quota")
    .setDescription("List Staff members with 0 runs logged in the past 7 days."),

  async execute(interaction) {
    // IMPORTANT: index.js skips defer for /quota
    if (!(await requireStaff(interaction))) return;

    // Acknowledge immediately (silent). We will edit this message with the real content.
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({
        content: "Checking quota...",
        flags: MessageFlags.SuppressNotifications,
        allowedMentions: { parse: [] },
      });
    }

    if (!interaction.inGuild()) {
      await interaction.editReply("This command can only be used in a server.");
      return;
    }

    if (!config.STAFF_ROLE_ID) {
      await interaction.editReply("STAFF_ROLE_ID is not configured.");
      return;
    }

    const guild = interaction.guild;

    // Populate cache so role.members is accurate
    await guild.members.fetch().catch(() => null);

    const staffRole = guild.roles.cache.get(config.STAFF_ROLE_ID);
    if (!staffRole) {
      await interaction.editReply("I could not find the Staff role in this server.");
      return;
    }

    const staffMembers = Array.from(staffRole.members.values());
    if (!staffMembers.length) {
      await interaction.editReply("No members currently have the Staff role.");
      return;
    }

    const inactive = [];
    for (const member of staffMembers) {
      const stats = getUserStats("runs", member.id) || { weekly: 0 };
      const weeklyRuns = Number(stats.weekly || 0);
      if (weeklyRuns <= 0) {
        inactive.push({ id: member.id });
      }
    }

    // Sort by ID just to keep output stable (you can change to name sort if you want)
    inactive.sort((a, b) => a.id.localeCompare(b.id));

    const header = `Staff with **0** logged runs in the past 7 days: **${inactive.length}** / ${staffMembers.length}`;

    // Build message under Discord limits and only mention users we include
    const lines = inactive.length
      ? inactive.map((u) => `• <@${u.id}>`)
      : ["Everyone with the Staff role has logged at least 1 run in the past 7 days."];

    const out = [header, "", ...lines];
    const limit = 1900;

    const finalLines = [];
    let used = 0;

    // Always include header block
    for (const line of out) {
      const candidate = (finalLines.length ? "\n" : "") + line;
      if (used + candidate.length > limit) break;
      finalLines.push(line);
      used += candidate.length;
    }

    // If truncated and there were inactive users, append a note
    const rendered = finalLines.join("\n");
    let includedMentions = 0;
    if (inactive.length) {
      // Count how many mention lines made it in
      includedMentions = finalLines.filter((l) => l.startsWith("• <@")).length;
    }

    let finalText = rendered;
    if (inactive.length && includedMentions < inactive.length) {
      const remaining = inactive.length - includedMentions;
      const tail = `\n…(and ${remaining} more)`;
      if (finalText.length + tail.length <= limit) finalText += tail;
    }

    const allowedUserIds = inactive.slice(0, includedMentions).map((u) => u.id);

    await interaction.editReply({
      content: finalText,
      // Only allow the mentions that are actually in the message
      allowedMentions: { users: allowedUserIds, roles: [], repliedUser: false },
    });
  },
};
