// npcGenerator.js — Procedural NPC generation for planetary campaigns
// Generates Administrator (ally), Loyalist Leader (antagonist), and agents.

function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(min, max, rng) { return Math.floor(rng() * (max - min + 1)) + min; }

// ── Name generation ─────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Kael", "Voss", "Mira", "Dren", "Syla", "Torin", "Neva", "Crix",
  "Asha", "Renn", "Lyra", "Garen", "Zara", "Thane", "Elka", "Dorik",
  "Sera", "Alaric", "Nyx", "Cassian", "Bryn", "Korrin", "Ildra", "Fenix",
  "Vala", "Orsen", "Eira", "Malik", "Petra", "Hadrik",
];
const SURNAMES = [
  "Volkov", "Ashren", "Drakos", "Kellam", "Veyren", "Stohl", "Korren",
  "Halden", "Vexis", "Thrain", "Moreau", "Garris", "Skaldt", "Revik",
  "Kyren", "Orvash", "Tennion", "Belcourt", "Valdren", "Osterman",
];

function generateName(rng) {
  return pick(FIRST_NAMES, rng) + " " + pick(SURNAMES, rng);
}

// ── Trait pools ─────────────────────────────────────────────────────────────
const ADMIN_TRAITS = [
  "Cautious", "Ambitious", "Honest", "Corrupt", "Pragmatic",
  "Idealistic", "Paranoid", "Trusting", "Bureaucratic", "Shrewd",
];
const LOYALIST_TRAITS = [
  "Ruthless", "Charismatic", "Fanatical", "Calculating", "Desperate",
  "Patient", "Vengeful", "Honorable", "Cunning", "Zealous",
];
const AGENT_SPECIALTIES = ["infiltration", "sabotage", "combat", "intel"];

// ── Stat generation ─────────────────────────────────────────────────────────
function generateStats(base, variance, rng) {
  const stats = {};
  const keys = ["meleeSkill", "rangeSkill", "strength", "toughness",
    "agility", "perception", "intelligence", "willpower", "fellowship"];
  for (const key of keys) {
    stats[key] = base + randInt(-variance, variance, rng);
  }
  return stats;
}

// ── Planetary Administrator ─────────────────────────────────────────────────
function generateAdministrator(planetName, rng) {
  const traits = [];
  while (traits.length < 3) {
    const t = pick(ADMIN_TRAITS, rng);
    if (!traits.includes(t)) traits.push(t);
  }

  return {
    id: `admin_${Math.floor(rng() * 100000)}`,
    name: generateName(rng),
    role: "Planetary Administrator",
    title: `Governor of ${planetName}`,
    traits,
    stats: generateStats(30, 8, rng),
    goal: "Maintain order, serve the Council, keep position",
    location: { regionIndex: 0, gridX: 10, gridY: 10 },
    hidden: false,
    alive: true,
    faction: "council",
    intelCooldown: 0,
  };
}

// ── Loyalist Leader ─────────────────────────────────────────────────────────
function generateLoyalistLeader(planet, rng) {
  const traits = [];
  while (traits.length < 3) {
    const t = pick(LOYALIST_TRAITS, rng);
    if (!traits.includes(t)) traits.push(t);
  }

  const base = planet.hiddenState.loyalistBase;
  // Manpower pool: average 100, variance ±30 based on planet development
  const baseManpower = 100;
  const devBonus = planet.development === "high" ? 20 : planet.development === "low" ? -20 : 0;
  const manpower = baseManpower + devBonus + randInt(-10, 10, rng);

  return {
    id: `leader_${Math.floor(rng() * 100000)}`,
    name: generateName(rng),
    role: "Cell Commander",
    title: "Imperial Loyalist Commander",
    traits,
    stats: generateStats(38, 6, rng),
    goal: "Remain hidden, undermine Administrator, protect the cell",
    location: {
      regionIndex: base.regionIndex,
      gridX: base.gridX,
      gridY: base.gridY,
    },
    hidden: true,
    alive: true,
    faction: "loyalist",
    manpower,          // total manpower pool
    manpowerUsed: 0,   // how much has been committed
    ambushesSet: [],    // list of ambush positions
  };
}

// ── Loyalist Agents ─────────────────────────────────────────────────────────
function generateAgents(planet, count, rng) {
  const agents = [];
  for (let i = 0; i < count; i++) {
    const regionIndex = randInt(0, planet.regions.length - 1, rng);
    const specialty = pick(AGENT_SPECIALTIES, rng);

    agents.push({
      id: `agent_${i}_${Math.floor(rng() * 100000)}`,
      name: generateName(rng),
      role: `Loyalist Agent (${specialty})`,
      specialty,
      traits: [pick(LOYALIST_TRAITS, rng)],
      stats: generateStats(32, 5, rng),
      goal: specialty === "infiltration" ? "Shadow the player, gather intel"
        : specialty === "sabotage" ? "Disrupt Council infrastructure"
        : specialty === "combat" ? "Eliminate threats to the cell"
        : "Feed misinformation to investigators",
      location: {
        regionIndex,
        gridX: randInt(2, 17, rng),
        gridY: randInt(2, 17, rng),
      },
      hidden: true,
      alive: true,
      faction: "loyalist",
    });
  }
  return agents;
}

// ── Loyalist Squads ─────────────────────────────────────────────────────────
function generateSquads(planet, count, rng) {
  const squads = [];
  for (let i = 0; i < count; i++) {
    const regionIndex = randInt(0, planet.regions.length - 1, rng);
    squads.push({
      id: `squad_${i}_${Math.floor(rng() * 100000)}`,
      name: `Loyalist Squad ${String.fromCharCode(65 + i)}`,
      mode: "patrol",
      strength: randInt(3, 6, rng),
      location: {
        regionIndex,
        gridX: randInt(3, 16, rng),
        gridY: randInt(3, 16, rng),
      },
      hidden: true,
      alive: true,
      targetLocation: null,
    });
  }
  return squads;
}

// ── Main generation ─────────────────────────────────────────────────────────
export function generatePlanetaryNPCs(planet, seed, mulberry32Fn) {
  const rng = mulberry32Fn(seed || 12345);

  const administrator = generateAdministrator(planet.name, rng);
  const loyalistLeader = generateLoyalistLeader(planet, rng);

  const agentCount = randInt(2, 5, rng);
  const agents = generateAgents(planet, agentCount, rng);

  const squadCount = randInt(2, 4, rng);
  const squads = generateSquads(planet, squadCount, rng);

  return { administrator, loyalistLeader, agents, squads };
}
