// commands/runsystem/headcount.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDungeonMeta, DUNGEON_CHOICES } = require("../../data/raidDungeons");
const config = require("../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("headcount")
    .setDescription("Start a headcount for a dungeon run")
    .addStringOption((opt) =>
      opt
        .setName("dungeon")
        .setDescription("Dungeon to headcount for")
        .setRequired(true)
        .addChoices(...DUNGEON_CHOICES)
    )
    .addStringOption((opt) =>
      opt
        .setName("dungeon_name")
        .setDescription("Dungeon name to display (used for Event headcounts)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const dungeonParam = interaction.options.getString("dungeon");
    const customDungeonName = interaction.options.getString("dungeon_name");
    const dungeonMeta = getDungeonMeta(dungeonParam);
    const leader = interaction.user;

    // Display name, allows custom name for Event
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

    // Build description
    const lines = [
      `**Dungeon:** ${displayedDungeonName}`,
      `**Leader:** ${leader}`,
      "",
    ];

    const reactionsToAdd = [];

    if (dungeonParam === "o3") {
      lines.push(
        `React with ${dungeonMeta.portalEmoji} to join the run.`,
        `React with ${dungeonMeta.runes[0]} if you have Shield rune.`,
        `React with ${dungeonMeta.runes[1]} if you have Sword rune.`,
        `React with ${dungeonMeta.runes[2]} if you have Helm rune.`,
        `React with ${dungeonMeta.incantation} if you have an Incantation.`
      );

      reactionsToAdd.push(
        dungeonMeta.portalEmoji,
        ...dungeonMeta.runes,
        dungeonMeta.incantation
      );
    } else if (dungeonParam === "void") {
      // Void headcount with vial line and react
      lines.push(
        `React with ${dungeonMeta.portalEmoji} to join the run.`,
        `React with ${dungeonMeta.keyEmoji} if you have a key.`,
        `React with ${dungeonMeta.vial} if you have a vial.`
      );

      reactionsToAdd.push(
        dungeonMeta.portalEmoji,
        dungeonMeta.keyEmoji,
        dungeonMeta.vial
      );
    } else {
      lines.push(
        `React with ${dungeonMeta.portalEmoji} to join the run.`,
        `React with ${dungeonMeta.keyEmoji} if you have a key.`
      );

      reactionsToAdd.push(dungeonMeta.portalEmoji, dungeonMeta.keyEmoji);
    }

    const embed = new EmbedBuilder()
      .setTitle(`Headcount: ${displayedDungeonName}`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: "Use /endheadcount when you are ready to close this headcount." })
      .setTimestamp();

    // Send in raid channel with ping
    const headcountMessage = await raidChannel.send({
      content: "@here",
      embeds: [embed],
    });

    // Add reactions
    for (const emoji of reactionsToAdd) {
      try {
        await headcountMessage.react(emoji);
      } catch (err) {
        console.error(`Failed to react with ${emoji} on headcount:`, err);
      }
    }

    // Acknowledge user
    await interaction.editReply({
      content: `Headcount for **${displayedDungeonName}** posted in ${raidChannel}.` });

    // CLEAN LOG MESSAGE (no emojis)
    try {
      const logChannel = await interaction.client.channels.fetch(config.RUN_LOG_CHANNEL_ID);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          content: `[HEADCOUNT] Dungeon: ${displayedDungeonName} | User: ${leader} | Channel: ${raidChannel}`,
        });
      }
    } catch (err) {
      console.error("Failed to send headcount log message:", err);
    }
  },
};
