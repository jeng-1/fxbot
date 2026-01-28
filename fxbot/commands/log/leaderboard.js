// commands/log/leaderboard.js
// /leaderboard <type>
//
// Always outputs "message 2" style:
// - Real mentions (<@id>) so Discord shows the user
// - Silent notifications via MessageFlags.SuppressNotifications
// - allowedMentions locked to only the users included

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getLeaderboard } = require("../../utils/storage");
const { requireStaff } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show all-time and weekly top 10 for keys or runs.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Which leaderboard to show.")
        .setRequired(true)
        .addChoices(
          { name: "Keys", value: "keys" },
          { name: "Runs", value: "runs" }
        )
    ),

  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const type = interaction.options.getString("type", true);
    const label = type === "keys" ? "keys" : "runs";

    // storage.js signature in your project is getLeaderboard(kind, period)
    const allTime = getLeaderboard(type, "allTime") || [];
    const weekly = getLeaderboard(type, "weekly") || [];

    const getRowUserId = (row) =>
      String(row.userId ?? row.user_id ?? row.discord_id ?? row.id ?? "");

    const formatPingList = (rows) => {
      if (!rows.length) return "_No data yet._";

      return rows
        .slice(0, 10)
        .map((row, i) => {
          const id = getRowUserId(row);
          const total = row.total ?? row.count ?? row.value ?? 0;

          if (!id) return `${i + 1}. **Unknown** - ${total}`;
          return `${i + 1}. <@${id}> - ${total}`;
        })
        .join("\n");
    };

    const content = [
      `**Leaderboard (${label})**`,
      "",
      "**All-time Top 10**",
      formatPingList(allTime),
      "",
      "**Weekly Top 10**",
      formatPingList(weekly),
    ].join("\n");

    // Only allow mentioning the users we actually included (top 10 from each list)
    const allowedUserIds = Array.from(
      new Set(
        [...allTime.slice(0, 10), ...weekly.slice(0, 10)]
          .map(getRowUserId)
          .filter(Boolean)
      )
    );

    // We want ONE silent message. This only works if index.js does NOT defer for /leaderboard.
    // Still handle fallback if it was deferred anyway.
    const payload = {
      content,
      flags: MessageFlags.SuppressNotifications,
      allowedMentions: { users: allowedUserIds, roles: [], repliedUser: false },
    };

    if (interaction.deferred || interaction.replied) {
      // If global defer happened, we can't apply flags to editReply.
      // Best fallback is followUp (but it will be a second message).
      await interaction.followUp(payload);
      return;
    }

    await interaction.reply(payload);
  },
};
