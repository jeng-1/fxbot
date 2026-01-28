// commands/log/stats.js
// /stats <type> [user]

const { SlashCommandBuilder } = require("discord.js");
const { getUserStats } = require("../../utils/storage");
const { requireStaff } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show all-time and weekly stats for a user.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("What stats to show.")
        .setRequired(true)
        .addChoices(
          { name: "Keys", value: "keys" },
          { name: "Runs", value: "runs" }
        )
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to show stats for (default yourself).")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const type = interaction.options.getString("type", true);
    const target = interaction.options.getUser("user") || interaction.user;

    const stats = getUserStats(type, target.id);
    const label = type === "keys" ? "keys" : "runs";

    const displayName =
      target.globalName || target.username || "Unknown user";

    let response = [
      `Stats for **${displayName}** (${label}):`,
      `All-time: **${stats.allTime}** ${label}`,
      `Weekly: **${stats.weekly}** ${label}`,
    ];

    if (type === "runs" && stats.breakdown) {
      const entries = Object.entries(stats.breakdown);
      if (entries.length) {
        response.push("", "Weekly breakdown by dungeon:");
        entries.forEach(([dungeon, total]) => {
          response.push(`• **${dungeon}** — ${total}`);
        });
      }
    }

    await interaction.editReply({
      content: response.join("\n"),
    });
  },
};
