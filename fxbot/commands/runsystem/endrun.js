// commands/runsystem/endrun.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("endrun")
    .setDescription("End the most recent run you started in the raid channel"),

  async execute(interaction) {
    // Fetch raid channel
    let raidChannel;
    try {
      raidChannel = await interaction.client.channels.fetch(config.RAID_CHANNEL_ID);
    } catch (err) {
      console.error("Failed to fetch raid channel for /endrun:", err);
    }

    if (!raidChannel || !raidChannel.isTextBased()) {
      await interaction.editReply(
        "I could not find the raid channel. Please check RAID_CHANNEL_ID in the env/config."
      );
      return;
    }

    const botId = interaction.client.user.id;
    const userId = interaction.user.id;
    const leaderMention = `<@${userId}>`;

    // Find the most recent /runstart embed in the raid channel started by this user
    let runStartMessage;
    try {
      const messages = await raidChannel.messages.fetch({ limit: 50 }); // newest first

      runStartMessage = messages.find((msg) => {
        if (msg.author.id !== botId) return false;
        if (!msg.embeds || msg.embeds.length === 0) return false;

        const embed = msg.embeds[0];
        const title = embed.title || "";
        const desc = embed.description || "";

        const isRunStart = title.toLowerCase().startsWith("run started:");
        const isLeader = desc.includes(leaderMention);

        return isRunStart && isLeader;
      });
    } catch (err) {
      console.error("Failed to fetch messages for /endrun:", err);
    }

    if (!runStartMessage) {
      await interaction.editReply(
        "I couldn't find a recent run start in the raid channel that you started."
      );
      return;
    }

    const oldEmbed = runStartMessage.embeds[0];

    const dungeonName =
      (oldEmbed.title || "").replace(/^Run Started:\s*/i, "") || "Unknown";

    // Try to extract party from embed, but keep fallback
    const partyMatch = (oldEmbed.description || "").match(/Party:\s*\*\*(.+?)\*\*/i);
    const partyName = partyMatch ? partyMatch[1] : "Unknown";

    // Build updated embed: mark as ended by this user
    const oldDesc = oldEmbed.description || "";
    const endedLine = `\n\nRun ended by ${interaction.user.tag}.`;
    const newEmbed = EmbedBuilder.from(oldEmbed)
      .setDescription(oldDesc + endedLine)
      .setFooter({ text: "Run ended" })
      .setTimestamp(); // updates timestamp to now

    let endMsg;
    try {
      endMsg = await raidChannel.send({
        embeds: [newEmbed],
      });
    } catch (err) {
      console.error("Failed to send endrun embed:", err);
    }

    // Log the /endrun usage
    try {
      const logChannel = await interaction.client.channels.fetch(
        config.RUN_LOG_CHANNEL_ID
      );
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          content: `[ENDRUN] Dungeon: ${dungeonName} | Party: ${partyName} | User: <@${userId}> | Channel: ${raidChannel} | StartMessage: ${runStartMessage.url} | EndMessage: ${
            endMsg ? endMsg.url : "(failed to send end message)"
          }`,
        });
      }
    } catch (err) {
      console.error("Failed to send endrun log message:", err);
    }

    await interaction.editReply(
      `Ended your most recent run for **${dungeonName}** (party: **${partyName}**) in ${raidChannel}.`
    );
  },
};
