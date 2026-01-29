// services/activeRuns.js
// Stores pending run party names for nitro booster early access

const pendingRuns = new Map();

function setPendingRun(messageId, partyName) {
  pendingRuns.set(messageId, partyName);
}

function getPendingRun(messageId) {
  return pendingRuns.get(messageId);
}

function deletePendingRun(messageId) {
  pendingRuns.delete(messageId);
}

module.exports = {
  setPendingRun,
  getPendingRun,
  deletePendingRun
};
