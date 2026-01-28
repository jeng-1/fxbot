// utils/timers.js
// Periodic reminders for active runs.

const { endRun, getActiveRun } = require("./storage");

const activeRunTimers = new Map(); // leaderId -> { intervalId }
const THIRTY_MIN_MS = 30 * 60 * 1000;
const MAX_PINGS = 4; // after 4 pings (about 2 hours) auto close

function startRunReminder(leaderId, client) {
  // Avoid duplicate timers
  if (activeRunTimers.has(leaderId)) {
    stopRunReminder(leaderId);
  }

  let pingCount = 0;

  const intervalId = setInterval(async () => {
    const run = getActiveRun(leaderId);
    if (!run) {
      stopRunReminder(leaderId);
      return;
    }

    pingCount += 1;

    try {
      const channel = await client.channels.fetch(run.channelId);
      if (!channel) return;

      if (pingCount >= MAX_PINGS) {
        await channel.send(
          `<@${run.leaderId}> run for **${run.dungeon}** (**${run.partyName}**) has been **auto closed due to inactivity**.`
        );
        endRun(leaderId);
        stopRunReminder(leaderId);
        return;
      }

      await channel.send(
        `<@${run.leaderId}> is your **${run.dungeon}** run (**${run.partyName}**) still active? ` +
          `Use \`/endrun\` when it is finished.`
      );
    } catch (err) {
      console.error("Error sending run reminder:", err);
    }
  }, THIRTY_MIN_MS);

  activeRunTimers.set(leaderId, { intervalId });
}

function stopRunReminder(leaderId) {
  const timers = activeRunTimers.get(leaderId);
  if (!timers) return;
  clearInterval(timers.intervalId);
  activeRunTimers.delete(leaderId);
}

module.exports = {
  startRunReminder,
  stopRunReminder,
};
