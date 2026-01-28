// commands/log/keys.js
// /logkeys <user> <quantity>

const { SlashCommandBuilder } = require("discord.js");
const { logKeys } = require("../../utils/storage");
const { requireStaff } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logkeys")
    .setDescription("Log keys contributed for a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to credit.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Number of keys to log.")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!(await requireStaff(interaction))) {
      await interaction.editReply("You do not have permission to use this command.");
      return;
    }
  
    const user = interaction.options.getUser("user", true);
    const quantity = interaction.options.getInteger("quantity", true);
  
    logKeys(user.id, quantity);
  
    await interaction.editReply(
      `Logged **${quantity}** keys for <@${user.id}>.`
    );
  }

};
