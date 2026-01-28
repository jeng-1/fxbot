// commands/verify/manual.js

const config = require("../../config");
const { requireStaff } = require("../../utils/permissions");

// ----------------------------
// /verify manual user:<user> ign:<ign> (staff only)
// ----------------------------
async function handleManual(interaction) {
  const isStaff = await requireStaff(interaction);
  if (!isStaff) {
    // If requireStaff() already replies/edits on denial, remove this line.
    await interaction.editReply("You do not have permission to use this command.");
    return;
  }

  const targetUser = interaction.options.getUser("user", true);
  const ign = interaction.options.getString("ign", true).trim();

  const guild = interaction.guild;
  const member = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.editReply({
      content: "I could not find that user in this guild.",
    });
    return;
  }

  // Add Verified role if configured
  if (config.VERIFIED_ROLE_ID) {
    try {
      await member.roles.add(config.VERIFIED_ROLE_ID);
    } catch (err) {
      console.error("Error adding Verified role (manual):", err);
      await interaction.editReply({
        content:
          "I could not add the Verified role to that user. Check my role permissions and position.",
      });
      return;
    }
  }

  // Try to set nickname to IGN (ignore errors)
  try {
    await member.setNickname(ign);
  } catch (err) {
    console.error("Error setting nickname (manual):", err);
  }

  await interaction.editReply({
    content: `Manually verified <@${targetUser.id}> as **${ign}**.`,
  });

  // Log to verification log channel
  const logChannelId = config.VERIFICATION_LOG_CHANNEL_ID;
  if (logChannelId) {
    try {
      const logChannel = await interaction.client.channels.fetch(logChannelId);
      if (logChannel) {
        await logChannel.send(
          `Staff user <@${interaction.user.id}> manually verified <@${targetUser.id}> as **${ign}**.`
        );
      }
    } catch (err) {
      console.error("Failed to log verify manual:", err);
    }
  }
}

module.exports = { handleManual };
