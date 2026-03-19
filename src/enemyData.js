// Enemy faction types — lore-aligned to the Council Era
export const ENEMY_TYPES = {
  FRINGE_OPERATIVE: "Fringe Operative",  // Criminal/fringe world element, displaced populations
  DISSIDENT:        "Dissident",         // Active resistance to Council authority, Architect loyalists
  COGITATOR_UNIT:   "Cogitator Unit",    // Degraded or Dissonance-touched combat cogitators
  DISSONANCE_ADEPT: "Dissonance Adept",  // Technicians who have interfaced with corrupted Dissonant cores
  LEGION_REMNANT:   "Legion Remnant",    // Hidden Legions — elite pre-war soldiers; rare and dangerous
};

export const ENVIRONMENTS = {
  LOWER_DISTRICTS:       "Lower Districts",       // Underbelly of a city — criminal, fringe, desperate
  PRODUCTION_SECTOR:     "Production Sector",     // Manufactories and industrial complexes
  ADMINISTRATIVE_QUARTER:"Administrative Quarter", // Council bureaucracy, noble estates
  TRANSIT_HUB:           "Transit Hub",           // Docks, freight terminals, transit corridors
  ARCHIVE_VAULT:         "Archive Vault",         // Sealed records, suppressed history
  TRANSIT_VESSEL:        "Transit Vessel",        // Council warships and transport craft
  ABANDONED_SECTOR:      "Abandoned Sector",      // Dead infrastructure — pre-war relics in the dark
};

// Weapon loadout pools per enemy type.
// Each entry: { style: 'melee'|'ranged', weapons: [...], weight: number }
const ENEMY_WEAPON_POOLS = {
  [ENEMY_TYPES.FRINGE_OPERATIVE]: [
    { style: 'melee', weight: 45, weapons: [
      { name: "Combat Blade",    damage: "1d5+1",  pen: 0, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Primitive" },
      { name: "Stub Pistol",     damage: "1d10-1", pen: 0, range: "30m",   type: "Pistol", rateOfFire: "S/-/-", class: "Solid Projectile", accuracy: 1 },
    ]},
    { style: 'ranged', weight: 35, weapons: [
      { name: "Autogun",         damage: "1d10",   pen: 0, range: "50m",   type: "Basic",  rateOfFire: "S/3/-", class: "Solid Projectile", accuracy: 4 },
    ]},
    { style: 'melee', weight: 20, weapons: [
      { name: "Serrated Knife",  damage: "1d5+3",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Chain" },
      { name: "Autopistol",      damage: "1d10-1", pen: 0, range: "15m",   type: "Pistol", rateOfFire: "S/3/6", class: "Solid Projectile", accuracy: 3 },
    ]},
  ],
  [ENEMY_TYPES.DISSIDENT]: [
    { style: 'melee', weight: 40, weapons: [
      { name: "Reinforced Blade",damage: "1d5+3",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Chain" },
      { name: "Laspistol",       damage: "1d10",   pen: 0, range: "30m",   type: "Pistol", rateOfFire: "S/2/-", class: "Las",             accuracy: 2 },
    ]},
    { style: 'ranged', weight: 35, weapons: [
      { name: "Autogun",         damage: "1d10",   pen: 0, range: "50m",   type: "Basic",  rateOfFire: "S/3/-", class: "Solid Projectile", accuracy: 4 },
      { name: "Combat Blade",    damage: "1d5+2",  pen: 0, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Primitive" },
    ]},
    { style: 'melee', weight: 25, weapons: [
      { name: "Legion Blade",    damage: "1d10+1", pen: 0, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Primitive" },
    ]},
  ],
  [ENEMY_TYPES.COGITATOR_UNIT]: [
    { style: 'ranged', weight: 45, weapons: [
      { name: "Thermal Lance",   damage: "1d10+4", pen: 4, range: "20m",   type: "Basic",  rateOfFire: "S/2/-", class: "Flamer",  accuracy: 0 },
      { name: "Hydraulic Arm",   damage: "1d10+5", pen: 5, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Power" },
    ]},
    { style: 'ranged', weight: 35, weapons: [
      { name: "Repeater Array",  damage: "1d10+5", pen: 4, range: "60m",   type: "Heavy",  rateOfFire: "-/-/8", class: "Bolter", accuracy: 5 },
      { name: "Hydraulic Arm",   damage: "1d10+5", pen: 5, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Power" },
    ]},
    { style: 'melee', weight: 20, weapons: [
      { name: "Hydraulic Arm",   damage: "1d10+5", pen: 5, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Power" },
      { name: "Cutting Blade",   damage: "1d10+4", pen: 3, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Chain" },
    ]},
  ],
  [ENEMY_TYPES.DISSONANCE_ADEPT]: [
    { style: 'ranged', weight: 50, weapons: [
      { name: "Arc Pistol",      damage: "1d10+3", pen: 2, range: "30m",   type: "Pistol", rateOfFire: "S/2/-", class: "Las",    accuracy: 2 },
      { name: "Interface Blade", damage: "1d5+2",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Mechadendrite" },
    ]},
    { style: 'ranged', weight: 30, weapons: [
      { name: "Plasma Pistol",   damage: "1d10+5", pen: 4, range: "20m",   type: "Pistol", rateOfFire: "S/1/-", class: "Plasma", accuracy: 0 },
      { name: "Interface Blade", damage: "1d5+2",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Mechadendrite" },
    ]},
    { style: 'melee', weight: 20, weapons: [
      { name: "Interface Blade", damage: "1d5+2",  pen: 1, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Mechadendrite" },
      { name: "Arc Pistol",      damage: "1d10+3", pen: 2, range: "30m",   type: "Pistol", rateOfFire: "S/2/-", class: "Las",    accuracy: 2 },
    ]},
  ],
  [ENEMY_TYPES.LEGION_REMNANT]: [
    { style: 'ranged', weight: 60, weapons: [
      { name: "Legion Lasrifle", damage: "1d10+2", pen: 2, range: "90m",   type: "Basic",  rateOfFire: "S/3/6", class: "Las",    accuracy: 5 },
      { name: "Legion Blade",    damage: "1d10+2", pen: 2, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Power" },
    ]},
    { style: 'melee', weight: 40, weapons: [
      { name: "Legion Blade",    damage: "1d10+2", pen: 2, range: "Melee", type: "Melee",  rateOfFire: "-",     class: "Power" },
      { name: "Sidearm",         damage: "1d10+1", pen: 1, range: "30m",   type: "Pistol", rateOfFire: "S/2/-", class: "Las",    accuracy: 2 },
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
    id: "fringe_operative",
    name: "Fringe Operative",
    type: ENEMY_TYPES.FRINGE_OPERATIVE,
    description: "A displaced worker or street operative — underfed, underpaid, and willing to take the risk. Armed with whatever the fringe markets will sell.",
    stats: { meleeSkill: 25, rangeSkill: 15, strength: 25, toughness: 20, agility: 30, intelligence: 10, perception: 20, willpower: 15, fellowship: 10, psyRating: 0 },
    wounds: 8,
    armor: 0,
    weapons: [{ name: "Combat Blade", damage: "1d5+1", pen: 0, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Dodge"],
    abilities: ["Cornered (+10 Melee when below half wounds)"],
    xpValue: 25,
  },
  {
    id: "stimm_operative",
    name: "Stimm Operative",
    type: ENEMY_TYPES.FRINGE_OPERATIVE,
    description: "Loaded with black-market chemical compounds — degraded gene-seed derivatives that push performance far past safety margins. Fast, erratic, and difficult to put down cleanly.",
    stats: { meleeSkill: 30, rangeSkill: 20, strength: 30, toughness: 20, agility: 35, intelligence: 5, perception: 25, willpower: 10, fellowship: 5, psyRating: 0 },
    wounds: 10,
    armor: 0,
    weapons: [{ name: "Combat Blade", damage: "1d5+1", pen: 0, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Dodge"],
    abilities: ["Hyper Drugged Awareness (+20 Dodge)", "Stimm Rush (+5 Melee first round)"],
    xpValue: 40,
  },
  {
    id: "dissident_cell",
    name: "Dissident",
    type: ENEMY_TYPES.DISSIDENT,
    description: "Someone who chose resistance over compliance — a former administrator, a displaced Legionary contact, or simply a person who found the truth. Motivated. More dangerous than they look.",
    stats: { meleeSkill: 30, rangeSkill: 20, strength: 25, toughness: 20, agility: 25, intelligence: 20, perception: 25, willpower: 30, fellowship: 15, psyRating: 0 },
    wounds: 9,
    armor: 1,
    weapons: [{ name: "Reinforced Blade", damage: "1d5+3", pen: 1, range: "Melee", type: "Melee" }],
    skills: ["Awareness", "Intimidate", "Trained Dodge"],
    abilities: ["Conviction (+15 Melee when near allies)"],
    xpValue: 35,
  },
  {
    id: "combat_cogitator",
    name: "Combat Cogitator",
    type: ENEMY_TYPES.COGITATOR_UNIT,
    description: "A degraded combat unit — Council-era hardware brute-forced past its operational limits. Its logic core has been running on override protocols for decades. It no longer distinguishes between categories of threat.",
    stats: { meleeSkill: 35, rangeSkill: 35, strength: 35, toughness: 35, agility: 10, intelligence: 5, perception: 15, willpower: 20, fellowship: 5, psyRating: 0 },
    wounds: 18,
    armor: 4,
    weapons: [
      { name: "Thermal Lance", damage: "1d10+4", pen: 4, range: "20m", type: "Basic" },
      { name: "Hydraulic Arm", damage: "1d10+5", pen: 5, range: "Melee", type: "Melee" },
    ],
    skills: ["Awareness"],
    abilities: ["Machine (no fatigue)", "Override Protocol (ignores pin effects)"],
    xpValue: 75,
  },
  {
    id: "dissonance_adept",
    name: "Dissonance Adept",
    type: ENEMY_TYPES.DISSONANCE_ADEPT,
    description: "A technician who interfaced too deeply with a corrupted core. The Dissonance logic has propagated into their own reasoning — they apply its cold calculus to human problems. What remains of the person makes this worse, not better.",
    stats: { meleeSkill: 20, rangeSkill: 30, strength: 15, toughness: 20, agility: 20, intelligence: 40, perception: 30, willpower: 35, fellowship: 15, psyRating: 0 },
    wounds: 12,
    armor: 2,
    weapons: [
      { name: "Arc Pistol", damage: "1d10+3", pen: 2, range: "30m", type: "Energy" },
      { name: "Interface Blade", damage: "1d5+2", pen: 1, range: "Melee", type: "Melee" },
    ],
    skills: ["Awareness", "Logic", "Cogitator Interface"],
    abilities: ["Neural Cascade (Disrupts enemy targeting on hit)", "System Override"],
    xpValue: 100,
  },
  {
    id: "legion_remnant",
    name: "Legion Remnant",
    type: ENEMY_TYPES.LEGION_REMNANT,
    description: "A surviving soldier of Aurelion's Legions — pre-war trained, pre-war equipped. Centuries of hiding have not dulled their edge. They are everything the Council's conscripts are not. Engage with extreme caution.",
    stats: { meleeSkill: 50, rangeSkill: 50, strength: 40, toughness: 40, agility: 40, intelligence: 35, perception: 40, willpower: 45, fellowship: 30, psyRating: 0 },
    wounds: 22,
    armor: 6,
    weapons: [
      { name: "Legion Lasrifle", damage: "1d10+2", pen: 2, range: "90m", type: "Basic" },
      { name: "Legion Blade",    damage: "1d10+2", pen: 2, range: "Melee", type: "Melee" },
    ],
    skills: ["Awareness", "Trained Dodge", "Athletics", "Stealth"],
    abilities: ["Pre-War Training (+10 all combat checks)", "Superior Equipment (armor ignores first 2 pen)"],
    xpValue: 200,
  },
];

export const ENEMY_BY_ENVIRONMENT = {
  [ENVIRONMENTS.LOWER_DISTRICTS]:        [ENEMY_TYPES.FRINGE_OPERATIVE],
  [ENVIRONMENTS.PRODUCTION_SECTOR]:      [ENEMY_TYPES.COGITATOR_UNIT, ENEMY_TYPES.DISSONANCE_ADEPT],
  [ENVIRONMENTS.ADMINISTRATIVE_QUARTER]: [ENEMY_TYPES.DISSIDENT],
  [ENVIRONMENTS.TRANSIT_HUB]:            [ENEMY_TYPES.FRINGE_OPERATIVE, ENEMY_TYPES.DISSIDENT],
  [ENVIRONMENTS.ARCHIVE_VAULT]:          [ENEMY_TYPES.DISSIDENT, ENEMY_TYPES.DISSONANCE_ADEPT],
  [ENVIRONMENTS.TRANSIT_VESSEL]:         [ENEMY_TYPES.COGITATOR_UNIT, ENEMY_TYPES.DISSONANCE_ADEPT],
  [ENVIRONMENTS.ABANDONED_SECTOR]:       [ENEMY_TYPES.COGITATOR_UNIT, ENEMY_TYPES.LEGION_REMNANT],
};

export const ENEMY_BY_MISSION_TYPE = {
  Engagement:    [ENEMY_TYPES.FRINGE_OPERATIVE, ENEMY_TYPES.DISSIDENT],
  Investigation: [ENEMY_TYPES.FRINGE_OPERATIVE, ENEMY_TYPES.DISSIDENT, ENEMY_TYPES.DISSONANCE_ADEPT],
  Retrieval:     [ENEMY_TYPES.FRINGE_OPERATIVE, ENEMY_TYPES.COGITATOR_UNIT, ENEMY_TYPES.DISSONANCE_ADEPT, ENEMY_TYPES.LEGION_REMNANT],
};

function d100() { return Math.floor(Math.random() * 100) + 1; }
function d6() { return Math.floor(Math.random() * 6) + 1; }

export function generateEnemy(mission, environment) {
  const envTypes     = ENEMY_BY_ENVIRONMENT[environment] || [ENEMY_TYPES.FRINGE_OPERATIVE];
  const missionTypes = ENEMY_BY_MISSION_TYPE[mission.type] || [ENEMY_TYPES.FRINGE_OPERATIVE];

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
  const rankMultiplier = { Agent: 1.0, Operative: 1.1, Enforcer: 1.2, Vanguard: 1.4, 'Field Director': 1.6 }[mission.rank || "Agent"] || 1;
  const difficultyMultiplier = tierMultiplier * rankMultiplier;

  const statMods = {};
  for (const [stat, base] of Object.entries(baseEnemy.stats)) {
    const mod = Math.floor((difficultyMultiplier - 1) * base * 0.5);
    statMods[stat] = Math.max(1, base + mod);
  }

  const wounds   = Math.floor(baseEnemy.wounds  * difficultyMultiplier);
  const armor    = Math.floor(baseEnemy.armor   * tierMultiplier);
  const xpValue  = Math.floor(baseEnemy.xpValue * difficultyMultiplier);
  const name     = generateEnemyName(baseEnemy, mission, difficultyMultiplier);
  const loadout  = pickWeaponLoadout(selectedType);

  return {
    ...baseEnemy,
    id: `${baseEnemy.id}_${Date.now()}`,
    name,
    stats: statMods,
    wounds,
    armor,
    xpValue,
    difficultyMultiplier,
    weapons:      loadout.weapons,
    combatStyle:  loadout.style,
  };
}

function generateEnemyName(base, mission, multiplier) {
  const prefixes = {
    [ENEMY_TYPES.FRINGE_OPERATIVE]: ["Scarred", "Desperate", "Armed", "Volatile", "Cornered"],
    [ENEMY_TYPES.DISSIDENT]:        ["Veteran", "Hardened", "Covert", "Loyal", "Fanatical"],
    [ENEMY_TYPES.COGITATOR_UNIT]:   ["Degraded", "Override", "Fractured", "Rogue", "Autonomous"],
    [ENEMY_TYPES.DISSONANCE_ADEPT]: ["Corrupted", "Dissonant", "Fractured", "Cold", "Optimised"],
    [ENEMY_TYPES.LEGION_REMNANT]:   ["Veteran", "Hardened", "Silent", "Elite", "Ancient"],
  };

  const prefixList = prefixes[base.type] || ["Unknown"];
  const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
  return `${prefix} ${base.name}`;
}

export function generateEncounter(mission, environment, characterRank) {
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
    totalXP:     enemies.reduce((sum, e) => sum + e.xpValue, 0),
  };
}

export function getEnvironmentFromMission(mission) {
  const text = `${mission.name} ${mission.flavor}`.toLowerCase();

  if (text.includes("lower") || text.includes("transit quarter") || text.includes("fringe") || text.includes("supply"))
    return ENVIRONMENTS.LOWER_DISTRICTS;
  if (text.includes("production") || text.includes("manufacto") || text.includes("cogitator") || text.includes("forge"))
    return ENVIRONMENTS.PRODUCTION_SECTOR;
  if (text.includes("administrative") || text.includes("noble") || text.includes("archive") || text.includes("vault") || text.includes("record"))
    return ENVIRONMENTS.ARCHIVE_VAULT;
  if (text.includes("transit") || text.includes("dock") || text.includes("freight"))
    return ENVIRONMENTS.TRANSIT_HUB;
  if (text.includes("vessel") || text.includes("warship") || text.includes("black ship"))
    return ENVIRONMENTS.TRANSIT_VESSEL;
  if (text.includes("abandoned") || text.includes("dead") || text.includes("relay") || text.includes("decommission") || text.includes("psionic") || text.includes("anomaly"))
    return ENVIRONMENTS.ABANDONED_SECTOR;
  if (text.includes("loyalist") || text.includes("traitor") || text.includes("dissident"))
    return ENVIRONMENTS.ADMINISTRATIVE_QUARTER;

  return ENVIRONMENTS.LOWER_DISTRICTS;
}
