// commands/help.js

const { SlashCommandBuilder } = require("discord.js");

const HELP_TEXT = `Public commands
/help  Show this help message.
/verify start ign:<ign>  Start RealmEye verification with your in-game name.
/verify confirm  Confirm that your RealmEye description contains your verification code.

Staff-only commands (requires Staff role)
/verify manual user:<user> ign:<ign>  Manually verifies a user without RealmEye confirmation.
  • Adds Verified role and optionally sets nickname.
/verify alt user:<user> ign:<ign>  Add an alt IGN to a user's nickname.
  • Appends " | <ign>" to their current nickname.
/headcount dungeon:<dungeon>  Post a headcount in the raids channel.
  • Posts a headcount embed and pings @here.
  • Optional dungeon_name parameter.
/endheadcount  Close the most recent headcount you started.
  • Clears reactions and marks the headcount as closed.
  • Mods may end another user's headcount using the optional messageid parameter.
/startrun dungeon:<dungeon> party:<text>  Start a raid run in the raids channel.
  • Posts a run announcement with dungeon and party name.
  • Optional dungeon_name parameter.
/endrun  End your active raid run.
  • Closes the most recent run you started.
  • Posts a "run ended" message (no ping).
/promote user:<user> role:<role>  Promote a user to a configured role.
  • Currently supported: Crackerjack.
  • Only Crackerjack Staff, Moderators, and Admins may use this.
/log key user:<user> quantity:<number>  Log keys contributed by a user.
/log vial user:<user> quantity:<number>  Log vials contributed by a user.
/log rune user:<user> quantity:<number>  Log runes contributed by a user.
/log runs dungeon:<dungeon> user:<user> quantity:<number>  Log completed runs for a user.
/leaderboard type:<keys|vials|runes|runs>  Show all-time and weekly top 10.
/profile user:[user]  Show a user's full stats.
  • If user is omitted, shows your own profile.
  • Includes keys, vials, runes, runs, and weekly breakdown.

Valid dungeon names
o3, shatters, mv, nest, adv nest, citadel, fungal,
kog, akog, cult, void, spen, event`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show this help message"),

  ephemeral: true,

  async execute(interaction) {
    await interaction.editReply({ content: HELP_TEXT });
  },
};
