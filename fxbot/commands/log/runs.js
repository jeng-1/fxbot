// commands/log/runs.js
// /logruns <dungeon> <user> <quantity>

const { SlashCommandBuilder } = require("discord.js");
const dungeons = require("../../utils/dungeonList");
const { logRuns } = require("../../utils/storage");
const { requireStaff } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logruns")
    .setDescription("Log completed runs for a user.")
    .addStringOption((option) =>
      option
        .setName("dungeon")
        .setDescription("Dungeon completed.")
        .setRequired(true)
        .addChoices(
          ...dungeons.map((d) => ({
            name: d,
            value: d,
          }))
        )
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to credit.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Number of runs to log.")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!(await requireStaff(interaction))) {
      // If requireStaff() already edits the reply on denial, you can delete this line.
      await interaction.editReply("You do not have permission to use this command.");
      return;
    }

    const dungeon = interaction.options.getString("dungeon", true);
    const user = interaction.options.getUser("user", true);
    const quantity = interaction.options.getInteger("quantity", true);

    await Promise.resolve(logRuns(dungeon, user.id, quantity));

    await interaction.editReply(
      `Logged **${quantity}** ${dungeon} run(s) for <@${user.id}>.`
    );
  },
};
