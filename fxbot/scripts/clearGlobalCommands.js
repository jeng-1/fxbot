// clearGlobalCommands.js
require("dotenv").config();
const { REST, Routes } = require("discord.js");
const config = require("../config");

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Clearing GLOBAL application (/) commands...");
    await rest.put(
      Routes.applicationCommands(config.clientId), // GLOBAL scope
      { body: [] }                                // empty = delete all
    );
    console.log("Done, global commands cleared.");
  } catch (error) {
    console.error("Error clearing global commands:", error);
  }
})();
