// fxbot/index.js
// Main entry for fxbot (multi-file command setup)

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, REST, Routes } = require("discord.js");

const config = require("./config");

// -----------------------------------------------------------------------------
// Basic checks
// -----------------------------------------------------------------------------
if (!config.token || !config.clientId || !config.guildId) {
  console.error("Missing token, clientId, or guildId in config/.env");
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Create client
// -----------------------------------------------------------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();

// -----------------------------------------------------------------------------
// Load command files (recursively from ./commands)
// -----------------------------------------------------------------------------
function loadCommandsFromDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      loadCommandsFromDir(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const command = require(fullPath);

    if ("data" in command && "execute" in command) {
      const commandName = command.data.name;
      client.commands.set(commandName, command);
      console.log(`Loaded command: ${commandName} from ${fullPath}`);
    } else {
      console.warn(`Skipping ${fullPath} - missing "data" or "execute" export.`);
    }
  }
}

loadCommandsFromDir(path.join(__dirname, "commands"));
const commandsJson = client.commands.map((cmd) => cmd.data.toJSON());

// -----------------------------------------------------------------------------
// Register slash commands (guild-scoped)
// -----------------------------------------------------------------------------
const rest = new REST({ version: "10" }).setToken(config.token);

async function registerCommands() {
  try {
    console.log("Registering application (/) commands...");
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandsJson }
    );
    console.log("Successfully registered application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

// -----------------------------------------------------------------------------
// Load event handlers (from ./events)
// -----------------------------------------------------------------------------
function loadEvents(eventsDir) {
  if (!fs.existsSync(eventsDir)) return;

  const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsDir, file);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const event = require(filePath);

    if (!event.name || !event.execute) {
      console.warn(`Skipping ${filePath} - missing "name" or "execute" export.`);
      continue;
    }

    console.log(`Loaded event: ${event.name} from ${filePath}`);

    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

loadEvents(path.join(__dirname, "events"));

// -----------------------------------------------------------------------------
// Startup
// -----------------------------------------------------------------------------
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

(async () => {
  await registerCommands();
  await client.login(config.token);
})();
