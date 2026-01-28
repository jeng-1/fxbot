// utils/raidDungeons.js

// Central mapping for dungeon params to display name and emojis.
// All emojis are the custom ones you provided, as strings.

const DUNGEONS = {
  "o3": {
    param: "o3",
    name: "Oryx's Sanctuary",
    // Special case: 3 runes + inc + portal
    portalEmoji: "<:o3portal:1444457064280756408>",
    runes: [
      "<:shield:1444412866408222812>",
      "<:sword:1444412884602851429>",
      "<:helm:1444412852503973978>",
    ],
    incantation: "<:inc:1444413971342819398>",
    keyEmoji: null, // O3 does not use a simple key
  },

  "shatters": {
    param: "shatters",
    name: "Shatters",
    portalEmoji: "<:shatsportal:1444413980784328784>",
    keyEmoji: "<:shatskey:1444413979559461007>",
  },

  "mv": {
    param: "mv",
    name: "Moonlight Village",
    portalEmoji: "<:mvportal:1444413976044769280>",
    keyEmoji: "<:mvkey:1444413975029874718>",
  },

  "nest": {
    param: "nest",
    name: "Nest",
    portalEmoji: "<:nestportal:1444413978271813745>",
    keyEmoji: "<:nestkey:1444413977109991534>",
  },

  "adv nest": {
    param: "adv nest",
    name: "Plagued Nest",
    portalEmoji: "<:advnestportal:1444413961079623983>",
    keyEmoji: "<:advnestkey:1444413959489851392>",
  },

  "citadel": {
    param: "citadel",
    name: "Ice Citadel",
    portalEmoji: "<:citadelportal:1444457062804357140>",
    keyEmoji: "<:citadelkey:1444457061575295186>",
  },

  "fungal": {
    param: "fungal",
    name: "Fungal Cavern",
    portalEmoji: "<:fungalportal:1444413965915390033>",
    keyEmoji: "<:fungalkey:1444413964871012594>",
  },

  "kog": {
    param: "kog",
    name: "Kogbold Steamworks",
    portalEmoji: "<:kogportal:1444413973624651856>",
    keyEmoji: "<:kogkey:1444413972412502116>",
  },

  "akog": {
    param: "akog",
    name: "Advanced Kogbold Steamworks",
    portalEmoji: "<:akogportal:1444413963726094509>",
    keyEmoji: "<:akogkey:1444413962606215248>",
  },

  "cult": {
    param: "cult",
    name: "Cultists Hideout",
    portalEmoji: "<:cultportal:1444457718290190471>",
    keyEmoji: "<:hallskey:1444413967567949967>",
  },

  "void": {
    param: "void",
    name: "Void",
    portalEmoji: "<:voidportal:1444457924310339756>",
    keyEmoji: "<:hallskey:1444413967567949967>",
    vial: "<:vial:1448148631587651704>",
  },

  "spen": {
    param: "spen",
    name: "Spectral Penitentiary",
    portalEmoji: "<:spenportal:1444413983216898179>",
    keyEmoji: "<:spenkey:1444413982176710737>",
  },

  "event": {
    param: "event",
    name: "Event",
    portalEmoji: "<:eventportal:1444458364577779793>",
    keyEmoji: "<:eventkey:1444458363378335784>",
  },
};

function getDungeonMeta(paramRaw) {
  const key = paramRaw.toLowerCase();
  const meta = DUNGEONS[key];
  if (meta) return meta;

  // fallback for anything not in the table
  return {
    param: paramRaw,
    name: paramRaw,
    portalEmoji: "Ì†ΩÌ∫™",
    keyEmoji: "Ì†ΩÌ∑ùÔ∏è",
  };
}

module.exports = {
  DUNGEONS,
  getDungeonMeta,
};
