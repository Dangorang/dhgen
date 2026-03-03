export const ENEMY_TYPES = {
  GANGER: "Ganger",
  CULTIST: "Cultist",
  SERVITOR: "Servitor",
  HERETEK: "Heretek",
  DAEMON: "Daemon",
  XENOS: "Xenos",
};

export const ENVIRONMENTS = {
  UNDERHIVE: "Underhive",
  MANUFACTORUM: "Manufactorum",
  NOBLE_SECTOR: "Noble Sector",
  DOCKS: "Docks",
  SCHOLAM: "Scholam",
  BLACKSHIP: "Black Ship",
  DEAD_HIVE: "Dead Hive",
};

const BASE_ENEMIES = [
  {
    id: "drugged_ganger",
    name: "Drugged Ganger",
    type: ENEMY_TYPES.GANGER,
    description: "A crazed junkie swinging a rusting blade, eyes wild with chemical fury.",
    stats: { WS: 25, BS: 15, S: 25, T: 20, Ag: 30, Int: 10, Per: 20, WP: 15, Fel: 10 },
    wounds: 8,
    armor: 0,
    weapons: [{ name: "Rusty Knife", damage: "1d5+1", pen: 0, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Dodge"],
    abilities: ["Fight Harder (+10 WS when below half wounds)"],
    xpValue: 25,
  },
  {
    id: "cultist_fanatic",
    name: "Cultist Fanatic",
    type: ENEMY_TYPES.CULTIST,
    description: "A robed figure clutching a chain knife, muttering prayers to dark gods.",
    stats: { WS: 30, BS: 20, S: 25, T: 20, Ag: 25, Int: 20, Per: 25, WP: 30, Fel: 15 },
    wounds: 9,
    armor: 1,
    weapons: [{ name: "Chain Knife", damage: "1d5+3", pen: 1, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Intimidate", "Dodge"],
    abilities: ["Dark Fury (+15 WS when near allies)"],
    xpValue: 35,
  },
  {
    id: "combat_servitor",
    name: "Combat Servitor",
    type: ENEMY_TYPES.SERVITOR,
    description: "A hulking cyborg of riveted metal and exposed pistons, its weapons arm humming.",
    stats: { WS: 35, BS: 35, S: 35, T: 35, Ag: 10, Int: 5, Per: 15, WP: 20, Fel: 5 },
    wounds: 18,
    armor: 4,
    weapons: [
      { name: "Heavy Flamer", damage: "1d10+4", pen: 4, range: "Cone", type: "Flamer" },
      { name: "Power Claw", damage: "1d10+5", pen: 5, range: "Melee", type: "Melee" },
    ],
    skills: ["Awareness"],
    abilities: ["Machine (no fatigue effects)", "Repairable"],
    xpValue: 75,
  },
  {
    id: "heretek_technomancer",
    name: "Heretek Technomancer",
    type: ENEMY_TYPES.HERETEK,
    description: "A robed figure wreathed in crackling arcane machinery, eyes glowing with forbidden light.",
    stats: { WS: 20, BS: 30, S: 15, T: 20, Ag: 20, Int: 40, Per: 30, WP: 35, Fel: 15 },
    wounds: 12,
    armor: 2,
    weapons: [
      { name: "Arc Pistol", damage: "1d10+3", pen: 2, range: "30m", type: "Energy" },
      { name: "Mechadendrites", damage: "1d5+2", pen: 1, range: "Melee", type: "Melee" },
    ],
    skills: ["Awareness", "Logic", "Tech-Use"],
    abilities: ["Electro-arc Whip", "Arcana Mechanicus"],
    xpValue: 100,
  },
];

export const ENEMY_BY_ENVIRONMENT = {
  [ENVIRONMENTS.UNDERHIVE]: [ENEMY_TYPES.GANGER],
  [ENVIRONMENTS.MANUFACTORUM]: [ENEMY_TYPES.SERVITOR, ENEMY_TYPES.HERETEK],
  [ENVIRONMENTS.NOBLE_SECTOR]: [ENEMY_TYPES.CULTIST],
  [ENVIRONMENTS.DOCKS]: [ENEMY_TYPES.GANGER],
  [ENVIRONMENTS.SCHOLAM]: [ENEMY_TYPES.CULTIST, ENEMY_TYPES.DAEMON],
  [ENVIRONMENTS.BLACKSHIP]: [ENEMY_TYPES.SERVITOR, ENEMY_TYPES.HERETEK],
  [ENVIRONMENTS.DEAD_HIVE]: [ENEMY_TYPES.SERVITOR, ENEMY_TYPES.XENOS],
};

export const ENEMY_BY_MISSION_TYPE = {
  Assassination: [ENEMY_TYPES.GANGER, ENEMY_TYPES.CULTIST, ENEMY_TYPES.HERETEK],
  Infiltration: [ENEMY_TYPES.GANGER, ENEMY_TYPES.CULTIST],
  Investigation: [ENEMY_TYPES.GANGER, ENEMY_TYPES.CULTIST, ENEMY_TYPES.DAEMON],
  Retrieval: [ENEMY_TYPES.GANGER, ENEMY_TYPES.SERVITOR, ENEMY_TYPES.HERETEK, ENEMY_TYPES.XENOS],
};

function d100() { return Math.floor(Math.random() * 100) + 1; }
function d6() { return Math.floor(Math.random() * 6) + 1; }

export function generateEnemy(mission, environment) {
  const envTypes = ENEMY_BY_ENVIRONMENT[environment] || [ENEMY_TYPES.GANGER];
  const missionTypes = ENEMY_BY_MISSION_TYPE[mission.type] || [ENEMY_TYPES.GANGER];
  
  const allowedTypes = [...new Set([...envTypes, ...missionTypes])];
  const typeRoll = d100();
  let selectedType;
  
  if (typeRoll <= 40) {
    selectedType = allowedTypes[Math.floor(Math.random() * Math.min(allowedTypes.length, 2))];
  } else if (typeRoll <= 70) {
    selectedType = allowedTypes[Math.floor(Math.random() * Math.min(allowedTypes.length, 3))] || allowedTypes[0];
  } else {
    selectedType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)] || allowedTypes[0];
  }

  const baseEnemy = BASE_ENEMIES.find(e => e.type === selectedType) || BASE_ENEMIES[0];
  
  const tierMultiplier = { Routine: 0.8, Dangerous: 1.0, Deadly: 1.3 }[mission.tier] || 1;
  const rankMultiplier = { Acolyte: 1.0, Disciple: 1.1, Crusader: 1.2, Veteran: 1.4, Inquisitor: 1.6 }[mission.rank || "Acolyte"] || 1;
  const difficultyMultiplier = tierMultiplier * rankMultiplier;

  const statMods = {};
  for (const [stat, base] of Object.entries(baseEnemy.stats)) {
    const mod = Math.floor((difficultyMultiplier - 1) * base * 0.5);
    statMods[stat] = Math.max(1, base + mod);
  }

  const wounds = Math.floor(baseEnemy.wounds * difficultyMultiplier);
  const armor = Math.floor(baseEnemy.armor * tierMultiplier);
  const xpValue = Math.floor(baseEnemy.xpValue * difficultyMultiplier);

  const name = generateEnemyName(baseEnemy, mission, difficultyMultiplier);

  return {
    ...baseEnemy,
    id: `${baseEnemy.id}_${Date.now()}`,
    name,
    stats: statMods,
    wounds,
    armor,
    xpValue,
    difficultyMultiplier,
  };
}

function generateEnemyName(base, mission, multiplier) {
  const prefixes = {
    [ENEMY_TYPES.GANGER]: ["Drugged", "Scarred", "Rusted", "Twisted", "Screaming"],
    [ENEMY_TYPES.CULTIST]: ["Dark", "Twisted", "Fanatical", "Crazed", "Ritual"],
    [ENEMY_TYPES.SERVITOR]: ["Rusty", "Dented", "Glitching", "Archaic", "Battle"],
    [ENEMY_TYPES.HERETEK]: ["Arcane", "Forbidden", "Cogitator", "Volatile", "Corrupted"],
  };
  
  const prefixList = prefixes[base.type] || ["Unknown"];
  const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
  
  return `${prefix} ${base.name}`;
}

export function generateEncounter(mission, environment, characterRank) {
  const tier = mission.tier;
  let enemyCount;
  
  if (tier === "Routine") {
    enemyCount = d6() <= 3 ? 1 : 2;
  } else if (tier === "Dangerous") {
    enemyCount = d6() <= 2 ? 2 : 3;
  } else {
    enemyCount = d6() <= 2 ? 3 : 4;
  }

  const enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const enemy = generateEnemy(mission, environment);
    enemy.rank = characterRank;
    enemies.push(enemy);
  }

  return {
    enemies,
    totalWounds: enemies.reduce((sum, e) => sum + e.wounds, 0),
    totalXP: enemies.reduce((sum, e) => sum + e.xpValue, 0),
  };
}

export function getEnvironmentFromMission(mission) {
  const name = mission.name.toLowerCase();
  const flavor = mission.flavor.toLowerCase();
  const combined = `${name} ${flavor}`;
  
  if (combined.includes("underhive") || combined.includes("dock") || combined.includes("smuggler")) {
    return ENVIRONMENTS.UNDERHIVE;
  }
  if (combined.includes("manufactorum") || combined.includes("forge") || combined.includes("magos") || combined.includes("heretek")) {
    return ENVIRONMENTS.MANUFACTORUM;
  }
  if (combined.includes("nobility") || combined.includes("noble") || combined.includes("cult")) {
    return ENVIRONMENTS.NOBLE_SECTOR;
  }
  if (combined.includes("scholam") || combined.includes("archive") || combined.includes("manuscript")) {
    return ENVIRONMENTS.SCHOLAM;
  }
  if (combined.includes("black ship") || combined.includes("psyker")) {
    return ENVIRONMENTS.BLACKSHIP;
  }
  if (combined.includes("dead hive") || combined.includes("vault") || combined.includes("ancient")) {
    return ENVIRONMENTS.DEAD_HIVE;
  }
  
  return ENVIRONMENTS.UNDERHIVE;
}
