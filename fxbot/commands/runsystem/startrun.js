// commands/runsystem/startrun.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDungeonMeta } = require("../../utils/raidDungeons");
const config = require("../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("runstart")
    .setDescription("Announce the start of a run")
    .addStringOption((opt) =>
      opt
        .setName("dungeon")
        .setDescription("Dungeon to run")
        .setRequired(true)
        .addChoices(
          { name: "Oryx's Sanctuary (O3)", value: "o3" },
          { name: "Shatters", value: "shatters" },
          { name: "Moonlight Village", value: "mv" },
          { name: "Nest", value: "nest" },
          { name: "Plagued Nest (adv nest)", value: "adv nest" },
          { name: "Ice Citadel", value: "citadel" },
          { name: "Fungal Cavern", value: "fungal" },
          { name: "Kogbold Steamworks", value: "kog" },
          { name: "Advanced Kogbold Steamworks", value: "akog" },
          { name: "Cultists Hideout", value: "cult" },
          { name: "Void", value: "void" },
          { name: "Spectral Penitentiary", value: "spen" },
          { name: "Event", value: "event" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("party")
        .setDescription("Party name")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("dungeon_name")
        .setDescription("Dungeon name to display (used for Event runs)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const dungeonParam = interaction.options.getString("dungeon");
    const partyName = interaction.options.getString("party");
    const customDungeonName = interaction.options.getString("dungeon_name");
    const dungeonMeta = getDungeonMeta(dungeonParam);
    const leader = interaction.user;

    // Use custom name only for Event, otherwise use normal name
    const displayedDungeonName =
      dungeonParam === "event" && customDungeonName
        ? customDungeonName
        : dungeonMeta.name;

    // Fetch raid channel
    let raidChannel;
    try {
      raidChannel = await interaction.client.channels.fetch(config.RAID_CHANNEL_ID);
    } catch (err) {
      console.error("Failed to fetch raid channel:", err);
    }

    if (!raidChannel || !raidChannel.isTextBased()) {
      await interaction.editReply({
        content: "I could not find the raid channel. Please check RAID_CHANNEL_ID in the env/config." });
      return;
    }

    const lines = [
      `**Dungeon:** ${displayedDungeonName}`,
      `**Leader:** ${leader}`,
      `**Party:** ${partyName}`,
    ];

    const embed = new EmbedBuilder()
      .setTitle(`Run started: ${displayedDungeonName}`)
      .setDescription(lines.join("\n"))
      .setTimestamp();

    // Post to raid channel with @here
    const runMsg = await raidChannel.send({
      content: "@here",
      embeds: [embed],
    });

    // Acknowledge user
    await interaction.editReply({
      content: `Run for **${displayedDungeonName}** announced in ${raidChannel}.` });

    // CLEAN LOG MESSAGE (no emojis)
    try {
      const logChannel = await interaction.client.channels.fetch(config.RUN_LOG_CHANNEL_ID);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          content:
            `[RUNSTART] Dungeon: ${displayedDungeonName} | Party: ${partyName} | User: ${leader} | Channel: ${raidChannel} | Message: ${runMsg.url ?? "no link"}`,
        });
      }
    } catch (err) {
      console.error("Failed to send runstart log message:", err);
    }
  },
};
