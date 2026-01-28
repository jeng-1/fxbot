// config.js
// Loads ALL configuration values from .env only.
// No secrets or IDs should ever be hardcoded in this file.

require("dotenv").config();

module.exports = {
  // Discord application/bot info
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // External APIs
  REALMEYE_API_BASE: process.env.REALMEYE_API_BASE,

  // Server roles + channels
  VERIFIED_ROLE_ID: process.env.VERIFIED_ROLE_ID,
  RAID_CHANNEL_ID: process.env.RAID_CHANNEL_ID,
  STAFF_ROLE_ID: process.env.STAFF_ROLE_ID,
  CRACKERJACK_ROLE_ID: process.env.CRACKERJACK_ROLE_ID,
  CRACKERJACK_STAFF_ROLE_ID: process.env.CRACKERJACK_STAFF_ROLE_ID,
  MODERATOR_ROLE_ID: process.env.MODERATOR_ROLE_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,

  // Log channels
  VERIFICATION_LOG_CHANNEL_ID: process.env.VERIFICATION_LOG_CHANNEL_ID,
  RUN_LOG_CHANNEL_ID: process.env.RUN_LOG_CHANNEL_ID,
  ROLES_LOG_CHANNEL_ID: process.env.ROLES_LOG_CHANNEL_ID
};
