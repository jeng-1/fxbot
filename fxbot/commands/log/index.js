// commands/log/index.js
// /log key|vial|rune|runs

const { SlashCommandBuilder } = require("discord.js");
const { DUNGEON_LIST } = require("../../data/raidDungeons");
const { logKeys, logVials, logRunes, logRuns } = require("../../services/storage");
const { requireStaff } = require("../../services/permissions");
const { KEY_LOG_CHANNEL_ID, MODERATOR_ROLE_ID } = require("../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log contributions for a user.")
    .addSubcommand((sub) =>
      sub
        .setName("key")
        .setDescription("Log keys contributed by a user.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to credit.").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Number of keys (negative to subtract, requires Moderator).")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("vial")
        .setDescription("Log vials contributed by a user.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to credit.").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Number of vials (negative to subtract, requires Moderator).")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("rune")
        .setDescription("Log runes contributed by a user.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to credit.").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Number of runes (negative to subtract, requires Moderator).")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("runs")
        .setDescription("Log completed runs for a user.")
        .addStringOption((opt) =>
          opt
            .setName("dungeon")
            .setDescription("Dungeon completed.")
            .setRequired(true)
            .addChoices(...DUNGEON_LIST.map((d) => ({ name: d, value: d })))
        )
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to credit.").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Number of runs (negative to subtract, requires Moderator).")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!(await requireStaff(interaction))) {
      await interaction.editReply("You do not have permission to use this command.");
      return;
    }

    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user", true);
    const quantity = interaction.options.getInteger("quantity", true);

    // Check moderator permission for negative quantities on other users
    if (quantity < 0 && user.id !== interaction.user.id) {
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member || !member.roles.cache.has(MODERATOR_ROLE_ID)) {
        await interaction.editReply(
          "You must have the Moderator role to log negative quantities for other users."
        );
        return;
      }
    }

    if (quantity === 0) {
      await interaction.editReply("Quantity cannot be zero.");
      return;
    }

    let label;
    let logTag;

    if (sub === "key") {
      logKeys(user.id, quantity);
      label = "key(s)";
      logTag = "KEY";
    } else if (sub === "vial") {
      logVials(user.id, quantity);
      label = "vial(s)";
      logTag = "VIAL";
    } else if (sub === "rune") {
      logRunes(user.id, quantity);
      label = "rune(s)";
      logTag = "RUNE";
    } else if (sub === "runs") {
      const dungeon = interaction.options.getString("dungeon", true);
      logRuns(dungeon, user.id, quantity);
      label = `${dungeon} run(s)`;
      logTag = "RUN";
    } else {
      await interaction.editReply("Unknown subcommand.");
      return;
    }

    await interaction.editReply(`Logged **${quantity}** ${label} for <@${user.id}>.`);

    const logChannel = interaction.client.channels.cache.get(KEY_LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send(
        `[${logTag}] <@${interaction.user.id}> logged **${quantity}** ${label} for <@${user.id}>.`
      );
    }
  },
};
