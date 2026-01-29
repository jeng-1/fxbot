// commands/verify/promote.js
const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config");

const ROLE_MAP = {
  crackerjack: {
    label: "Crackerjack",
    id: config.CRACKERJACK_ROLE_ID,
  },
  // Add more roles later if needed:
  // officer: { label: "Officer", id: config.OFFICER_ROLE_ID },
};

const ALLOWED_PROMOTER_ROLES = [
  config.CRACKERJACK_STAFF_ROLE_ID,
  config.MODERATOR_ROLE_ID,
  config.ADMIN_ROLE_ID,
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promote a user to a specific role")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("User to promote")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("role")
        .setDescription("Role to assign")
        .setRequired(true)
        .addChoices(
          { name: "Crackerjack", value: "crackerjack" }
          // Add more choices here if you add to ROLE_MAP
        )
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const roleKey = interaction.options.getString("role");

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    const roleConfig = ROLE_MAP[roleKey];
    if (!roleConfig || !roleConfig.id) {
      await interaction.editReply({
        content:
          "That role is not configured correctly. Please contact an admin." });
      return;
    }

    // Check if caller has one of the allowed promoter roles
    const hasPermission = ALLOWED_PROMOTER_ROLES.some((roleId) =>
      member.roles.cache.has(roleId)
    );

    if (!hasPermission) {
      await interaction.editReply({
        content: "You do not have permission to use this command." });
      return;
    }

    const guildRole = interaction.guild.roles.cache.get(roleConfig.id);
    if (!guildRole) {
      await interaction.editReply({
        content: `I could not find the ${roleConfig.label} role on this server. Please check the role ID in the configuration.` });
      return;
    }

    // Check if target already has the role
    if (targetMember.roles.cache.has(roleConfig.id)) {
      await interaction.editReply({
        content: `${targetUser} already has the ${roleConfig.label} role.` });
      return;
    }

    // Try to assign the role
    try {
      await targetMember.roles.add(
        guildRole,
        `Promoted by ${interaction.user.tag} via /promote`
      );
    } catch (err) {
      console.error("Failed to assign role in /promote:", err);
      await interaction.editReply({
        content:
          "I was unable to assign that role. Check my role position and permissions."  });
      return;
    }

    // Acknowledge success
    await interaction.editReply({
      content: `Successfully promoted ${targetUser} to ${roleConfig.label}.` });

    // Log to roles log channel
    try {
      const logChannel = await interaction.client.channels.fetch(
        config.ROLES_LOG_CHANNEL_ID
      );
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          content: `[PROMOTE] User ${interaction.user} promoted ${targetUser} to ${roleConfig.label}.`,
        });
      }
    } catch (err) {
      console.error("Failed to send promote log message:", err);
    }
  },
};
