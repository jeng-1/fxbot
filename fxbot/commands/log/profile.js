// commands/log/profile.js
// /profile [user]

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserStats } = require("../../services/storage");
const { requireStaff } = require("../../services/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Show a user's keys and runs stats.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to show profile for (default yourself).")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const target = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    const keyStats = getUserStats("keys", target.id);
    const vialStats = getUserStats("vials", target.id);
    const runeStats = getUserStats("runes", target.id);
    const runStats = getUserStats("runs", target.id);

    const displayName = member?.nickname || target.globalName || target.username;

    const embed = new EmbedBuilder()
      .setTitle(`Profile: ${displayName}`)
      .setThumbnail(target.displayAvatarURL({ size: 128 }))
      .addFields(
        {
          name: "Keys",
          value: `All-time: **${keyStats.allTime}**\nWeekly: **${keyStats.weekly}**`,
          inline: true,
        },
        {
          name: "Vials",
          value: `All-time: **${vialStats.allTime}**\nWeekly: **${vialStats.weekly}**`,
          inline: true,
        },
        {
          name: "Runes",
          value: `All-time: **${runeStats.allTime}**\nWeekly: **${runeStats.weekly}**`,
          inline: true,
        },
        {
          name: "Runs Led",
          value: `All-time: **${runStats.allTime}**\nWeekly: **${runStats.weekly}**`,
          inline: true,
        }
      )
      .setTimestamp();

    // Add weekly breakdown if there are runs
    if (runStats.breakdown) {
      const entries = Object.entries(runStats.breakdown);
      if (entries.length) {
        const breakdownLines = entries.map(([dungeon, total]) => `${dungeon}: **${total}**`);
        embed.addFields({
          name: "Weekly Runs by Dungeon",
          value: breakdownLines.join("\n") || "None",
          inline: false,
        });
      }
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
