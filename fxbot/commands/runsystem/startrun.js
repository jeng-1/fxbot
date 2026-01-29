// commands/runsystem/startrun.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDungeonMeta, DUNGEON_CHOICES } = require("../../data/raidDungeons");
const config = require("../../config");
const { setPendingRun, deletePendingRun } = require("../../services/activeRuns");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("runstart")
    .setDescription("Announce the start of a run")
    .addStringOption((opt) =>
      opt
        .setName("dungeon")
        .setDescription("Dungeon to run")
        .setRequired(true)
        .addChoices(...DUNGEON_CHOICES)
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

    // Determine output channel based on command channel
    let targetChannelId;
    if (interaction.channelId === config.RAID_COMMANDS_CHANNEL_ID) {
      targetChannelId = config.RAID_CHANNEL_ID;
    } else if (interaction.channelId === config.COMPETENT_COMMANDS_CHANNEL_ID) {
      targetChannelId = config.COMPETENT_CHANNEL_ID;
    } else {
      await interaction.editReply({
        content: "This command can only be used in raid or competent command channels.",
      });
      return;
    }

    // Fetch target channel
    let raidChannel;
    try {
      raidChannel = await interaction.client.channels.fetch(targetChannelId);
    } catch (err) {
      console.error("Failed to fetch target channel:", err);
    }

    if (!raidChannel || !raidChannel.isTextBased()) {
      await interaction.editReply({
        content: "I could not find the target channel. Please check channel IDs in the env/config." });
      return;
    }

    // Initial embed hides the party name
    const hiddenLines = [
      `**Dungeon:** ${displayedDungeonName}`,
      `**Leader:** ${leader}`,
      `**Party:** Revealing in 15 seconds...`,
    ];

    const hiddenEmbed = new EmbedBuilder()
      .setTitle(`Run started: ${displayedDungeonName}`)
      .setDescription(hiddenLines.join("\n"))
      .setFooter({ text: "Nitro Boosters can react below for early access!" })
      .setTimestamp();

    // Post to raid channel with @here
    const runMsg = await raidChannel.send({
      content: "@here",
      embeds: [hiddenEmbed],
    });

    // Add nitro reaction and store party name for early access
    try {
      await runMsg.react(config.NITRO_EMOJI_ID);
      setPendingRun(runMsg.id, partyName);
    } catch (err) {
      console.error("Failed to add nitro reaction:", err);
    }

    // Acknowledge user
    await interaction.editReply({
      content: `Run for **${displayedDungeonName}** announced in ${raidChannel}. Party name reveals in 15 seconds.` });

    // Reveal party name after 15 seconds
    setTimeout(async () => {
      try {
        const revealedLines = [
          `**Dungeon:** ${displayedDungeonName}`,
          `**Leader:** ${leader}`,
          `**Party:** ${partyName}`,
        ];

        const revealedEmbed = new EmbedBuilder()
          .setTitle(`Run started: ${displayedDungeonName}`)
          .setDescription(revealedLines.join("\n"))
          .setTimestamp();

        await runMsg.edit({ embeds: [revealedEmbed] });
        deletePendingRun(runMsg.id);
      } catch (err) {
        console.error("Failed to reveal party name:", err);
      }
    }, 15000);

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
