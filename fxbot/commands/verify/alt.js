// commands/verify/alt.js
// Staff only: add an alt IGN to a user's nickname

const config = require("../../config");
const { requireStaff } = require("../../services/permissions");

async function handleAlt(interaction) {
  if (!(await requireStaff(interaction))) return;

  const targetUser = interaction.options.getUser("user", true);
  const altIgn = interaction.options.getString("ign", true).trim();

  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  if (!member) {
    await interaction.editReply("Could not find that user in this server.");
    return;
  }

  const currentNick = member.nickname || member.user.username;
  const newNick = `${currentNick} | ${altIgn}`;

  // Discord nickname limit is 32 characters
  if (newNick.length > 32) {
    await interaction.editReply(
      `Cannot add alt: resulting nickname would be ${newNick.length} characters (max 32).\nCurrent: \`${currentNick}\`\nAttempted: \`${newNick}\``
    );
    return;
  }

  try {
    await member.setNickname(newNick);
  } catch (err) {
    console.error("Error setting nickname for alt:", err);
    await interaction.editReply("Failed to update nickname. I may not have permission to change this user's nickname.");
    return;
  }

  await interaction.editReply(`Added alt for <@${targetUser.id}>: \`${currentNick}\` → \`${newNick}\``);

  // Log to verification log channel
  const logChannelId = config.VERIFICATION_LOG_CHANNEL_ID;
  if (logChannelId) {
    try {
      const logChannel = await interaction.client.channels.fetch(logChannelId);
      if (logChannel) {
        await logChannel.send(
          `[ALT] <@${interaction.user.id}> added alt **${altIgn}** to <@${targetUser.id}> (now \`${newNick}\`).`
        );
      }
    } catch (err) {
      console.error("Failed to log alt add:", err);
    }
  }
}

module.exports = { handleAlt };
