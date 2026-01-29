// commands/verify/index.js

const { SlashCommandBuilder } = require("discord.js");
const { handleStart, handleConfirm } = require("./startConfirm");
const { handleManual } = require("./manual");
const { handleAlt } = require("./alt");

module.exports = {
  ephemeral: true,

  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your RealmEye account for this Discord server.")
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start the verification process with your RealmEye IGN.")
        .addStringOption((option) =>
          option
            .setName("ign")
            .setDescription("Your in game name (IGN) as shown on RealmEye.")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("confirm")
        .setDescription("Confirm your RealmEye description contains the code.")
    )
    .addSubcommand((sub) =>
      sub
        .setName("manual")
        .setDescription("Staff only: manually verify a user with a given IGN.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to verify.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ign")
            .setDescription("IGN to assign and optionally set as nickname.")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("alt")
        .setDescription("Staff only: add an alt IGN to a user's nickname.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to add alt for.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ign")
            .setDescription("Alt IGN to append to nickname.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "start") return handleStart(interaction);
    if (sub === "confirm") return handleConfirm(interaction);
    if (sub === "manual") return handleManual(interaction);
    if (sub === "alt") return handleAlt(interaction);

    await interaction.editReply("Unknown subcommand.");
  },
};
