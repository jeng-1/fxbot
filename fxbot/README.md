# FXBot

A Discord bot for managing raid events, player verification, and statistics tracking for Realm of the Mad God communities. Integrates with RealmEye for player profile verification.

## Features

- **Player Verification** - Verify Discord users against their RealmEye profiles
- **Raid Management** - Create headcounts, announce runs, and track completions
- **Statistics Tracking** - Log keys and runs with leaderboards and quotas
- **Role Management** - Promote users to community roles

## Project Structure

```
fxbot/                     # Main Discord Bot
├── index.js               # Entry point
├── config.js              # Configuration loader
├── commands/              # Slash commands
│   ├── verify/            # Verification system
│   ├── runsystem/         # Raid management
│   └── log/               # Statistics commands
├── services/              # Core services
│   ├── storage.js         # SQLite database operations
│   ├── permissions.js     # Role permission checks
│   ├── realmeye.js        # RealmEye API client
│   └── timers.js          # Headcount/run timers
├── data/                  # Static data
│   └── raidDungeons.js    # Dungeon definitions
├── events/                # Discord event handlers
│   └── interactionCreate.js
└── scripts/               # Utility scripts
    └── clearGlobalCommands.js

realmeye-scraper/          # RealmEye API Server
├── server.js              # Express API
└── scraper.js             # Web scraping logic
```

## Dependencies

### FXBot (Discord Bot)

| Package | Version | Purpose |
|---------|---------|---------|
| discord.js | ^14.25.1 | Discord API client |
| better-sqlite3 | ^12.4.6 | SQLite database |
| dotenv | ^17.2.3 | Environment variable loader |
| node-fetch | ^2.7.0 | HTTP client for API calls |

### RealmEye Scraper (API Server)

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.1.0 | Web framework |
| axios | ^1.13.2 | HTTP client |
| cheerio | ^1.1.2 | HTML parsing |

## Setup

### Prerequisites

- Node.js v18 or higher
- npm

### 1. Clone and Install Dependencies

```bash
# Install bot dependencies
cd fxbot
npm install

# Install scraper dependencies
cd ../realmeye-scraper
npm install
```

### 2. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Navigate to the **Bot** section
4. Click **Reset Token** and copy the token (you'll need this for `DISCORD_TOKEN`)
5. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent (if needed)
6. Navigate to **OAuth2 > General**
7. Copy the **Client ID** (you'll need this for `CLIENT_ID`)

### 3. Invite the Bot to Your Server

1. Go to **OAuth2 > URL Generator**
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions:
   - Manage Roles
   - Manage Nicknames
   - Send Messages
   - Embed Links
   - Add Reactions
   - Use Slash Commands
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

### 4. Get Discord IDs

Enable Developer Mode in Discord: **User Settings > App Settings > Advanced > Developer Mode**

Then right-click to copy IDs for the following:

#### Server ID (Guild ID)
- Right-click your server name > **Copy Server ID**

#### Role IDs
Create these roles in your server (or use existing ones), then right-click each role > **Copy Role ID**:

| Role | Purpose |
|------|---------|
| Verified | Assigned to verified users |
| Staff | Can manage raids and log stats |
| Moderator | Can end others' headcounts |
| Admin | Full permissions |
| Crackerjack | Community team member |
| Crackerjack Staff | Can promote to Crackerjack |

#### Channel IDs
Create these channels, then right-click each > **Copy Channel ID**:

| Channel | Purpose |
|---------|---------|
| Raid Channel | Where headcounts and run announcements are posted |
| Raid Commands Channel | Where raid commands are used |
| Competent Channel | Competent raider headcount/run channel |
| Competent Commands Channel | Where competent commands are used |
| Verification Log | Logs verification events |
| Run Log | Logs completed runs |
| Key Log | Logs key/vial/rune contributions |
| Roles Log | Logs role changes |

### 5. Configure Environment Variables

Create a `.env` file in the `fxbot` directory:

```env
# Discord Bot Credentials
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_server_id_here

# RealmEye API (update if hosting scraper elsewhere)
REALMEYE_API_BASE=http://localhost:3000/api/realmeye

# Role IDs
VERIFIED_ROLE_ID=your_verified_role_id
STAFF_ROLE_ID=your_staff_role_id
MODERATOR_ROLE_ID=your_moderator_role_id
ADMIN_ROLE_ID=your_admin_role_id
CRACKERJACK_ROLE_ID=your_crackerjack_role_id
CRACKERJACK_STAFF_ROLE_ID=your_crackerjack_staff_role_id

# Channel IDs
RAID_CHANNEL_ID=your_raid_channel_id
RAID_COMMANDS_CHANNEL_ID=your_raid_commands_channel_id
COMPETENT_CHANNEL_ID=your_competent_channel_id
COMPETENT_COMMANDS_CHANNEL_ID=your_competent_commands_channel_id
VERIFICATION_LOG_CHANNEL_ID=your_verification_log_channel_id
RUN_LOG_CHANNEL_ID=your_run_log_channel_id
KEY_LOG_CHANNEL_ID=your_key_log_channel_id
ROLES_LOG_CHANNEL_ID=your_roles_log_channel_id
```

### 6. Set Up Custom Emojis (Optional)

The bot uses custom Discord emojis for dungeon portals, keys, and runes. Upload these to your server and update the emoji IDs in `data/raidDungeons.js`.

## Running the Bot

### Start the RealmEye Scraper

```bash
cd realmeye-scraper
node server.js
```

The scraper runs on port 3000 by default. Set `PORT` environment variable to change.

### Start the Discord Bot

```bash
cd fxbot
node index.js
```

### Running with PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start both services
pm2 start realmeye-scraper/server.js --name realmeye-scraper
pm2 start fxbot/index.js --name fxbot

# Save process list and enable startup
pm2 save
pm2 startup
```

## Commands

### Verification

| Command | Description | Permission |
|---------|-------------|------------|
| `/verify start <ign>` | Start verification process | Everyone |
| `/verify confirm` | Confirm verification code added | Everyone |
| `/verify manual <user> <ign>` | Manually verify a user | Staff |

### Raid Management

| Command | Description | Permission |
|---------|-------------|------------|
| `/headcount <dungeon>` | Start a headcount | Staff |
| `/endheadcount [messageid]` | End a headcount | Staff/Mod |
| `/runstart <dungeon> <party>` | Announce run start | Staff |
| `/endrun` | End your active run | Staff |

### Statistics

| Command | Description | Permission |
|---------|-------------|------------|
| `/log key <user> <quantity>` | Log key contributions | Staff |
| `/log vial <user> <quantity>` | Log vial contributions | Staff |
| `/log rune <user> <quantity>` | Log rune contributions | Staff |
| `/log runs <dungeon> <user> <quantity>` | Log completed runs | Staff |
| `/leaderboard <keys\|runs>` | Show top 10 leaderboard | Staff |
| `/profile [user]` | Show user's keys, vials, runes, and runs stats | Staff |
| `/quota` | Check staff run quotas | Staff |

### Other

| Command | Description | Permission |
|---------|-------------|------------|
| `/help` | Display help information | Everyone |
| `/promote <user> <role>` | Promote to Crackerjack | CJ Staff/Mod/Admin |

## Supported Dungeons

- Oryx's Sanctuary (o3)
- The Shatters
- Moonlight Village
- The Nest / Plagued Nest
- Ice Citadel
- Fungal Cavern
- Kogbold Steamworks / Advanced
- Cultist Hideout
- The Void
- Spectral Penitentiary
- Custom Events

## API Reference

### RealmEye Scraper

```
GET /api/realmeye/:ign
```

**Response:**
```json
{
  "ignOnPage": "PlayerName",
  "fame": 87236,
  "descriptionLines": ["Line 1", "Line 2", "Line 3"]
}
```

Rate limited to 1 request per second per IP.

## License

ISC
