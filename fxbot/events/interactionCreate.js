// events/interactionCreate.js

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    try {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("Unknown command.");
        } else {
          await interaction.reply({ content: "Unknown command.", ephemeral: true });
        }
        return;
      }

      // Commands can opt out of defer or request ephemeral replies
      if (!command.skipDefer) {
        await interaction.deferReply({
          ephemeral: !!command.ephemeral,
        });
      }

      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);

      try {
        const msg =
          "There was an error while executing this command. Please try again later.";

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg);
        } else {
          await interaction.reply({ content: msg, ephemeral: true });
        }
      } catch (_) {}
    }
  },
};
