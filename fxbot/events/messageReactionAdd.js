// events/messageReactionAdd.js
// Handles nitro booster early access to party names

const config = require("../config");
const { getPendingRun } = require("../services/activeRuns");

module.exports = {
  name: "messageReactionAdd",

  async execute(reaction, user, client) {
    // Ignore bot reactions
    if (user.bot) return;

    // Handle partial reactions (fetch if needed)
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (err) {
        console.error("Failed to fetch reaction:", err);
        return;
      }
    }

    // Check if this is the nitro emoji
    const isNitroEmoji = reaction.emoji.id === config.NITRO_EMOJI_ID;
    if (!isNitroEmoji) return;

    // Check if this message has a pending party name
    const partyName = getPendingRun(reaction.message.id);
    if (!partyName) return;

    // Get the guild member to check roles
    const guild = reaction.message.guild;
    if (!guild) return;

    let member;
    try {
      member = await guild.members.fetch(user.id);
    } catch (err) {
      console.error("Failed to fetch member:", err);
      return;
    }

    // Check if user has nitro booster role
    const hasNitroRole = member.roles.cache.has(config.NITRO_BOOSTER_ROLE_ID);

    try {
      if (hasNitroRole) {
        // DM them the party name
        await user.send({
          content: `Early access for Nitro Boosters!\n\n**Party Name:** ${partyName}\n\nThank you for boosting the server!`
        });
      } else {
        // Tell them to boost the server
        await user.send({
          content: `You need to boost the server to get early access to party names!\n\nBoost the server to unlock this perk and support the community.`
        });
      }
    } catch (err) {
      // User might have DMs disabled
      console.error(`Failed to DM user ${user.tag}:`, err.message);
    }
  }
};
