// services/permissions.js
// Simple helper to restrict commands to staff.

const config = require("../config");

async function requireStaff(interaction) {
  // With your global handler, the interaction is already deferred,
  // so we must use editReply here.
  const deny = async (msg) => {
    try {
      await interaction.editReply({ content: msg });
    } catch (_) {}
    return false;
  };

  if (!interaction.inGuild()) {
    return deny("This command can only be used in a server.");
  }

  if (!config.STAFF_ROLE_ID) {
    return deny("STAFF_ROLE_ID is not configured.");
  }

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) {
    return deny("I could not fetch your member data in this server.");
  }

  if (!member.roles.cache.has(config.STAFF_ROLE_ID)) {
    return deny("You must have the Staff role to use this command.");
  }

  return true;
}

module.exports = { requireStaff };
