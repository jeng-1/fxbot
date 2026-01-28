// commands/runsystem/headcount.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDungeonMeta } = require("../../utils/raidDungeons");
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
