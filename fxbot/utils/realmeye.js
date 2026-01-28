// utils/realmeye.js
// Fetch RealmEye-style data from your API.

const fetch = require("node-fetch");
const config = require("../config");

// Expected API response example:
// { ignOnPage: "FX", fame: 87236, descriptionLines: ["WOLAND-695847"] }

async function getRealmeyeProfile(ign) {
  const base = config.REALMEYE_API_BASE;
  if (!base) {
    throw new Error("REALMEYE_API_BASE is not configured in .env");
  }

  const url = `${base}/${encodeURIComponent(ign)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Realmeye API returned ${res.status} for ign ${ign}`);
  }

  const data = await res.json();
  return data;
}

module.exports = { getRealmeyeProfile };
