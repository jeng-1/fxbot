// commands/verify/startConfirm.js

const config = require("../../config");
const { getRealmeyeProfile } = require("../../services/realmeye");
const {
  createVerificationSession,
  getPendingVerification,
  completeVerification,
} = require("../../services/storage");

// ----------------------------
// /verify start <ign>
// ----------------------------
async function handleStart(interaction) {
  const ign = interaction.options.getString("ign", true).trim();
  const userId = interaction.user.id;

  // Generate a code like IGNUPPER-123456
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const code = `${ign.toUpperCase()}-${randomNum}`;

  // Store session in memory
  createVerificationSession(userId, ign, code);

  // Slash-command mention for /verify confirm
  const confirmMention = `</verify confirm:${interaction.commandId}>`;

  const instructions = [
    `Starting verification for **${ign}**.`,
    "",
    `Your verification code is: \`${code}\``,
    "",
    "1. Go to your RealmEye profile used by the API.",
    "2. Add this exact code somewhere in your **description**.",
    "3. Make sure your profile is **public**.",
    `4. When you are done, run ${confirmMention}.`,
    "",
    "_Note: RealmEye can be slow to update. After saving your description, please wait up to a minute before running the confirm command._",
  ].join("\n");

  await interaction.editReply({ content: instructions });

  // Log to verification log channel
  const logChannelId = config.VERIFICATION_LOG_CHANNEL_ID;
  if (logChannelId) {
    try {
      const logChannel = await interaction.client.channels.fetch(logChannelId);
      if (logChannel) {
        await logChannel.send(
          `[START] <@${userId}> started verification with IGN **${ign}**.`
        );
      }
    } catch (err) {
      console.error("Failed to log verify start:", err);
    }
  }
}

// ----------------------------
// /verify confirm
// ----------------------------
async function handleConfirm(interaction) {
  const userId = interaction.user.id;
  const pending = getPendingVerification(userId);

  if (!pending) {
    await interaction.editReply({
      content:
        'You do not have a pending verification. Run "/verify start ign:<your_ign>" first.',
    });
    return;
  }

  const { ign, code } = pending;

  // Fetch RealmEye profile
  let profile;
  try {
    profile = await getRealmeyeProfile(ign);
  } catch (err) {
    console.error("Error fetching RealmEye profile:", err);
    await interaction.editReply({
      content:
        "I could not reach the RealmEye API or your profile. Try again in a minute.",
    });
    return;
  }

  if (!profile) {
    await interaction.editReply({
      content:
        "I did not get any data for that IGN. Check the IGN and try again.",
    });
    return;
  }

  const ignOnPage = profile.ignOnPage || ign;
  const descriptionLines = Array.isArray(profile.descriptionLines)
    ? profile.descriptionLines
    : [];

  const found = descriptionLines.some((line) => line.includes(code));

  if (!found) {
    const preview =
      descriptionLines.length > 0
        ? descriptionLines.join("\n")
        : "(no description lines returned)";

    await interaction.editReply({
      content: [
        `I could not find the code \`${code}\` in the description for **${ignOnPage}**.`,
        "",
        "Make sure:",
        "- Your profile is public.",
        "- The code is in the description exactly as shown.",
        "",
        "Description I saw:",
        "```",
        preview.slice(0, 800),
        "```",
      ].join("\n"),
    });
    return;
  }

  // Code found, mark verified
  completeVerification(userId);

  // Give Verified role and change nickname
  const guild = interaction.guild;
  const member = await guild.members.fetch(userId).catch(() => null);

  if (!member) {
    await interaction.editReply({
      content:
        "I found the code on your profile, but could not find you in this guild.",
    });
    return;
  }

  // Add Verified role if configured
  if (config.VERIFIED_ROLE_ID) {
    await member.roles
      .add(config.VERIFIED_ROLE_ID)
      .catch((err) => console.error("Error adding Verified role:", err));
  }

  // Try to change nickname to IGN from page
  try {
    await member.setNickname(ignOnPage);
  } catch (err) {
    console.error("Error setting nickname:", err);
  }

  await interaction.editReply({
    content: `Verification successful. You are now verified as **${ignOnPage}**.`,
  });

  // Log to verification log channel
  const logChannelId = config.VERIFICATION_LOG_CHANNEL_ID;
  if (logChannelId) {
    try {
      const logChannel = await interaction.client.channels.fetch(logChannelId);
      if (logChannel) {
        await logChannel.send(
          `[VERIFY] <@${userId}> verified as **${ignOnPage}**.`
        );
      }
    } catch (err) {
      console.error("Failed to log verify confirm:", err);
    }
  }
}

module.exports = { handleStart, handleConfirm };
