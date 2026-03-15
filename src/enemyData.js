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

// Weapon loadout pools per enemy type.
// Each entry: { style: 'melee'|'ranged', weapons: [...], weight: number }
// style drives AI: 'ranged' = stay at distance and shoot; 'melee' = charge and brawl
// All weapon objects include rateOfFire and class so the AI can parse fire modes.
const ENEMY_WEAPON_POOLS = {
  [ENEMY_TYPES.GANGER]: [
    { style: 'melee', weight: 45, weapons: [
      { name: "Rusty Knife",  damage: "1d5+1",  pen: 0, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Primitive" },
      { name: "Stub Pistol",  damage: "1d10-1", pen: 0, range: "30m",   type: "Pistol", rateOfFire: "S/-/-", class: "Solid Projectile", accuracy: 1 },
    ]},
    { style: 'ranged', weight: 35, weapons: [
      { name: "Autogun",      damage: "1d10",   pen: 0, range: "50m",   type: "Basic",  rateOfFire: "S/3/-", class: "Solid Projectile", accuracy: 4 },
    ]},
    { style: 'melee', weight: 20, weapons: [
      { name: "Chain Knife",  damage: "1d5+3",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Chain" },
      { name: "Autopistol",   damage: "1d10-1", pen: 0, range: "15m",   type: "Pistol", rateOfFire: "S/3/6", class: "Solid Projectile", accuracy: 3 },
    ]},
  ],
  [ENEMY_TYPES.CULTIST]: [
    { style: 'melee', weight: 40, weapons: [
      { name: "Chain Knife",   damage: "1d5+3", pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Chain" },
      { name: "Laspistol",     damage: "1d10",  pen: 0, range: "30m",   type: "Pistol", rateOfFire: "S/2/-", class: "Las",             accuracy: 2 },
    ]},
    { style: 'ranged', weight: 35, weapons: [
      { name: "Autogun",       damage: "1d10",  pen: 0, range: "50m",   type: "Basic",  rateOfFire: "S/3/-", class: "Solid Projectile", accuracy: 4 },
      { name: "Ritual Blade",  damage: "1d5+2", pen: 0, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Primitive" },
    ]},
    { style: 'melee', weight: 25, weapons: [
      { name: "Ritual Blade",  damage: "1d10+1", pen: 0, range: "Melee", type: "Melee", rateOfFire: "-",     class: "Primitive" },
    ]},
  ],
  [ENEMY_TYPES.SERVITOR]: [
    { style: 'ranged', weight: 45, weapons: [
      { name: "Heavy Flamer",  damage: "1d10+4", pen: 4, range: "20m",   type: "Basic",  rateOfFire: "S/2/-",  class: "Flamer",  accuracy: 0 },
      { name: "Power Claw",    damage: "1d10+5", pen: 5, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Power" },
    ]},
    { style: 'ranged', weight: 35, weapons: [
      { name: "Twin Bolter",   damage: "1d10+5", pen: 4, range: "60m",   type: "Heavy",  rateOfFire: "-/-/8",  class: "Bolter", accuracy: 5 },
      { name: "Power Claw",    damage: "1d10+5", pen: 5, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Power" },
    ]},
    { style: 'melee', weight: 20, weapons: [
      { name: "Power Claw",    damage: "1d10+5", pen: 5, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Power" },
      { name: "Buzz Saw Arm",  damage: "1d10+4", pen: 3, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Chain" },
    ]},
  ],
  [ENEMY_TYPES.HERETEK]: [
    { style: 'ranged', weight: 50, weapons: [
      { name: "Arc Pistol",    damage: "1d10+3", pen: 2, range: "30m",   type: "Pistol", rateOfFire: "S/2/-",  class: "Las",    accuracy: 2 },
      { name: "Mechadendrites",damage: "1d5+2",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Mechadendrite" },
    ]},
    { style: 'ranged', weight: 30, weapons: [
      { name: "Plasma Pistol", damage: "1d10+5", pen: 4, range: "20m",   type: "Pistol", rateOfFire: "S/1/-",  class: "Plasma", accuracy: 0 },
      { name: "Mechadendrites",damage: "1d5+2",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Mechadendrite" },
    ]},
    { style: 'melee', weight: 20, weapons: [
      { name: "Mechadendrites",damage: "1d5+2",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",      class: "Mechadendrite" },
      { name: "Arc Pistol",    damage: "1d10+3", pen: 2, range: "30m",   type: "Pistol", rateOfFire: "S/2/-",  class: "Las",    accuracy: 2 },
    ]},
  ],
};

function pickWeaponLoadout(type) {
  const pool = ENEMY_WEAPON_POOLS[type];
  if (!pool) return { style: 'melee', weapons: [{ name: "Fists", damage: "1d5", pen: 0, range: "Melee", type: "Melee", rateOfFire: "-", class: "Primitive" }] };
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return pool[0];
}

const BASE_ENEMIES = [
  {
    id: "drugged_ganger",
    name: "Drugged Ganger",
    type: ENEMY_TYPES.GANGER,
    description: "A crazed junkie swinging a rusting blade, eyes wild with chemical fury.",
    stats: { meleeSkill: 25, rangeSkill: 15, strength: 25, toughness: 20, agility: 30, intelligence: 10, perception: 20, willpower: 15, fellowship: 10, psyRating: 0 },
    wounds: 8,
    armor: 0,
    weapons: [{ name: "Rusty Knife", damage: "1d5+1", pen: 0, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Dodge"],
    abilities: ["Fight Harder (+10 WS when below half wounds)"],
    xpValue: 25,
  },
  {
    id: "hyper_drugged_ganger",
    name: "Hyper Drugged Ganger",
    type: ENEMY_TYPES.GANGER,
    description: "A ganger pumped full of combat stimms, twitching with unnatural speed and reflexes.",
    stats: { meleeSkill: 30, rangeSkill: 20, strength: 30, toughness: 20, agility: 35, intelligence: 5, perception: 25, willpower: 10, fellowship: 5, psyRating: 0 },
    wounds: 10,
    armor: 0,
    weapons: [{ name: "Rusty Knife", damage: "1d5+1", pen: 0, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Dodge"],
    abilities: ["Hyper Drugged Awareness (+20 Dodge)", "Stimm Rush (+5 WS first round)"],
    xpValue: 40,
  },
  {
    id: "cultist_fanatic",
    name: "Cultist Fanatic",
    type: ENEMY_TYPES.CULTIST,
    description: "A robed figure clutching a chain knife, muttering prayers to dark gods.",
    stats: { meleeSkill: 30, rangeSkill: 20, strength: 25, toughness: 20, agility: 25, intelligence: 20, perception: 25, willpower: 30, fellowship: 15, psyRating: 0 },
    wounds: 9,
    armor: 1,
    weapons: [{ name: "Chain Knife", damage: "1d5+3", pen: 1, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Intimidate", "Trained Dodge"],
    abilities: ["Dark Fury (+15 WS when near allies)"],
    xpValue: 35,
  },
  {
    id: "combat_servitor",
    name: "Combat Servitor",
    type: ENEMY_TYPES.SERVITOR,
    description: "A hulking cyborg of riveted metal and exposed pistons, its weapons arm humming.",
    stats: { meleeSkill: 35, rangeSkill: 35, strength: 35, toughness: 35, agility: 10, intelligence: 5, perception: 15, willpower: 20, fellowship: 5, psyRating: 0 },
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
    stats: { meleeSkill: 20, rangeSkill: 30, strength: 15, toughness: 20, agility: 20, intelligence: 40, perception: 30, willpower: 35, fellowship: 15, psyRating: 0 },
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

  const loadout = pickWeaponLoadout(selectedType);

  return {
    ...baseEnemy,
    id: `${baseEnemy.id}_${Date.now()}`,
    name,
    stats: statMods,
    wounds,
    armor,
    xpValue,
    difficultyMultiplier,
    weapons: loadout.weapons,
    combatStyle: loadout.style,
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
  // Fixed at 6 enemies — testbed configuration
  const enemyCount = 6;

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
