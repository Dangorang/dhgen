// planetGenerator.js — Procedural planet + region generation
// Generates a planet of interest with biomes, regions, POIs, and hidden state.

import { mulberry32 } from "./starSystemGenerator";

function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(min, max, rng) { return Math.floor(rng() * (max - min + 1)) + min; }
function weightedPick(items, rng) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}

// ── Planet name parts ───────────────────────────────────────────────────────
const PREFIXES = [
  "Kel", "Vor", "Ash", "Ner", "Thal", "Kyr", "Zan", "Pel", "Dra", "Cor",
  "Val", "Hex", "Orm", "Syn", "Bel", "Tor", "Phar", "Gal", "Ith", "Mor",
];
const SUFFIXES = ["ris", "don", "thos", "van", "nar", "phen", "gon", "lex", "rus", "tos"];

// ── Biome definitions ───────────────────────────────────────────────────────
const BIOME_TABLE = {
  temperate: {
    subBiomes: ["Grasslands", "Deciduous Forest", "Coastal Lowlands", "Mountain Range", "River Basin", "Highland Plateau"],
    tileColors: { base: "#3a5a30", alt: "#4a6a40", accent: "#2e4a28" },
    installations: ["Biodome Agriculture", "Starport City", "Research Station", "Communications Hub", "Military Garrison", "Administrative Complex"],
  },
  arid: {
    subBiomes: ["Desert Expanse", "Badlands", "Salt Flats", "Mesa Highlands", "Canyon System", "Oasis Basin"],
    tileColors: { base: "#6a5a30", alt: "#7a6a40", accent: "#5a4a28" },
    installations: ["Mining Complex", "Water Reclamation Plant", "Relay Station", "Geothermal Plant", "Trade Outpost", "Refinery"],
  },
  frozen: {
    subBiomes: ["Frozen Waste", "Icy Canyons", "Tundra Flats", "Geothermal Vent Zone", "Glacier Field", "Permafrost Basin"],
    tileColors: { base: "#4a5a6a", alt: "#5a6a7a", accent: "#3a4a5a" },
    installations: ["Enclosed Habitat", "Geothermal Plant", "Research Station", "Mining Complex", "Communications Hub", "Military Garrison"],
  },
  volcanic: {
    subBiomes: ["Lava Fields", "Obsidian Plains", "Ash Desert", "Caldera Basin", "Thermal Rift", "Basalt Plateau"],
    tileColors: { base: "#5a3020", alt: "#6a4030", accent: "#4a2518" },
    installations: ["Hardened Refinery", "Shielded Habitat", "Mining Complex", "Geothermal Plant", "Military Garrison", "Research Station"],
  },
  ocean: {
    subBiomes: ["Archipelago", "Reef Platform", "Deep Trench Zone", "Floating City", "Coastal Shelf", "Tidal Flats"],
    tileColors: { base: "#2a4a6a", alt: "#3a5a7a", accent: "#1a3a5a" },
    installations: ["Platform Habitat", "Aquaculture Complex", "Deep-Sea Mining Rig", "Communications Array", "Naval Garrison", "Research Station"],
  },
  jungle: {
    subBiomes: ["Dense Canopy", "River Basin", "Swamp", "Highland Clearing", "Vine Plateau", "Fungal Cavern"],
    tileColors: { base: "#2a5a20", alt: "#3a6a30", accent: "#1a4a18" },
    installations: ["Cleared Outpost", "Biodome Agriculture", "Research Station", "Logging Complex", "Communications Hub", "Military Garrison"],
  },
};

// ── Biome selection by orbital distance ─────────────────────────────────────
const BIOME_BY_DISTANCE = {
  near: [
    { biome: "arid", weight: 40 }, { biome: "volcanic", weight: 30 },
    { biome: "temperate", weight: 20 }, { biome: "jungle", weight: 10 },
  ],
  mid: [
    { biome: "temperate", weight: 35 }, { biome: "jungle", weight: 20 },
    { biome: "ocean", weight: 20 }, { biome: "arid", weight: 15 },
    { biome: "frozen", weight: 10 },
  ],
  far: [
    { biome: "frozen", weight: 50 }, { biome: "temperate", weight: 20 },
    { biome: "arid", weight: 15 }, { biome: "ocean", weight: 15 },
  ],
};

// ── Size definitions ────────────────────────────────────────────────────────
const SIZES = [
  { size: "small",  weight: 30, popRange: [50000, 500000],   regionRange: [4, 6]  },
  { size: "medium", weight: 45, popRange: [500000, 2000000], regionRange: [6, 9]  },
  { size: "large",  weight: 25, popRange: [2000000, 5000000], regionRange: [8, 12] },
];

const ATMOSPHERES = {
  near:  [{ atmo: "Thin", weight: 30 }, { atmo: "Toxic", weight: 40 }, { atmo: "Breathable", weight: 30 }],
  mid:   [{ atmo: "Breathable", weight: 60 }, { atmo: "Thin", weight: 25 }, { atmo: "Toxic", weight: 15 }],
  far:   [{ atmo: "Thin", weight: 40 }, { atmo: "None", weight: 30 }, { atmo: "Breathable", weight: 20 }, { atmo: "Toxic", weight: 10 }],
};

// ── POI types ───────────────────────────────────────────────────────────────
const POI_TYPES = [
  "comm_array", "outpost", "settlement", "surveillance_station",
  "labor_camp", "supply_depot", "relay_node", "hab_block",
];

const POI_NAMES_PREFIX = [
  "Relay", "Station", "Outpost", "Camp", "Hub", "Tower", "Node",
  "Block", "Point", "Watch", "Depot", "Beacon",
];
const POI_NAMES_SUFFIX = [
  "Alpha", "Beta", "Gamma", "Delta", "Theta", "Sigma", "Tau",
  "Prime", "Secundus", "Tertius", "Quartus",
];

// ── Region name generation ──────────────────────────────────────────────────
const REGION_PREFIXES = [
  "Khevren", "Ashfall", "Driftwood", "Ironveil", "Stormbreak",
  "Saltwind", "Darkhollow", "Frostpeak", "Cinderfall", "Deepwell",
  "Thornreach", "Greymist", "Blackspire", "Coldwater", "Sunscorch",
  "Dustmere", "Stonecrest", "Shadowfen", "Brightforge", "Whitepeak",
];
const REGION_SUFFIXES = [
  "Basin", "Wastes", "Flats", "Ridge", "Valley", "Heights",
  "Reach", "Expanse", "Crossing", "Gulch", "Hollow", "Plateau",
];

function generateRegionName(biome, rng) {
  return pick(REGION_PREFIXES, rng) + " " + pick(REGION_SUFFIXES, rng);
}

// ── POI generation ──────────────────────────────────────────────────────────
function generatePOI(regionBiome, index, rng) {
  const type = pick(POI_TYPES, rng);
  const name = pick(POI_NAMES_PREFIX, rng) + " " + pick(POI_NAMES_SUFFIX, rng);
  // Place POIs in the middle area of a 20x20 grid, avoiding edges
  const x = randInt(2, 17, rng);
  const y = randInt(2, 17, rng);
  return {
    id: `poi_${index}_${Math.floor(rng() * 10000)}`,
    name, type, gridX: x, gridY: y,
    investigated: false,
    exhaustedUntilTick: 0,
    compromised: rng() < 0.3, // 30% chance loyalists have a presence here
  };
}

// ── Region tile grid generation (20x20) ─────────────────────────────────────
const TILE_TERRAIN = {
  temperate: ["grass", "grass", "grass", "forest", "forest", "hill", "water", "road"],
  arid:      ["sand", "sand", "sand", "rock", "rock", "mesa", "cracked", "road"],
  frozen:    ["ice", "ice", "ice", "snow", "snow", "rock", "crevasse", "road"],
  volcanic:  ["basalt", "basalt", "ash", "ash", "lava", "rock", "obsidian", "road"],
  ocean:     ["shallows", "shallows", "reef", "deep", "platform", "sand", "dock", "bridge"],
  jungle:    ["canopy", "canopy", "canopy", "vine", "swamp", "clearing", "river", "path"],
};

function generateRegionGrid(biome, pois, installation, rng) {
  const terrainPool = TILE_TERRAIN[biome] || TILE_TERRAIN.temperate;
  const grid = [];

  for (let y = 0; y < 20; y++) {
    const row = [];
    for (let x = 0; x < 20; x++) {
      row.push({ terrain: pick(terrainPool, rng), entity: null });
    }
    grid.push(row);
  }

  // Place installation as a 3x3 block near center
  const instX = randInt(7, 12, rng);
  const instY = randInt(7, 12, rng);
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      if (instY + dy < 20 && instX + dx < 20) {
        grid[instY + dy][instX + dx].terrain = "installation";
      }
    }
  }

  // Mark POI tiles
  for (const poi of pois) {
    if (poi.gridY < 20 && poi.gridX < 20) {
      grid[poi.gridY][poi.gridX].terrain = "poi";
      grid[poi.gridY][poi.gridX].poiId = poi.id;
    }
  }

  return grid;
}

// ── Region generation ───────────────────────────────────────────────────────
function generateRegion(planetBiome, index, totalPop, rng) {
  const biomeDef = BIOME_TABLE[planetBiome];
  const subBiome = pick(biomeDef.subBiomes, rng);
  const installation = pick(biomeDef.installations, rng);
  const name = generateRegionName(subBiome, rng);
  const isCapital = index === 0;
  const popFraction = isCapital ? 0.3 + rng() * 0.15 : (0.05 + rng() * 0.15);
  const population = Math.floor(totalPop * popFraction);
  const poiCount = randInt(3, 6, rng);
  const pois = [];
  for (let i = 0; i < poiCount; i++) {
    pois.push(generatePOI(planetBiome, i, rng));
  }

  // Avoid POI coordinate collisions
  const usedCoords = new Set();
  for (const poi of pois) {
    let key = `${poi.gridX},${poi.gridY}`;
    while (usedCoords.has(key)) {
      poi.gridX = randInt(2, 17, rng);
      poi.gridY = randInt(2, 17, rng);
      key = `${poi.gridX},${poi.gridY}`;
    }
    usedCoords.add(key);
  }

  const grid = generateRegionGrid(planetBiome, pois, installation, rng);

  return {
    id: `region_${index}`,
    name,
    subBiome,
    biome: planetBiome,
    installation,
    population,
    isCapital,
    pois,
    grid,
    entities: [],
  };
}

// ── Main planet generation ──────────────────────────────────────────────────
export function generatePlanet(starId, bodySlot, planetName, starType) {
  const seed = (starId + "_" + bodySlot).split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 7919;
  const rng = mulberry32(seed);

  // Determine orbital zone from body slot
  const zone = bodySlot <= 1 ? "near" : bodySlot <= 4 ? "mid" : "far";

  // Size
  const sizeDef = weightedPick(SIZES, rng);
  const population = randInt(sizeDef.popRange[0], sizeDef.popRange[1], rng);
  const regionCount = randInt(sizeDef.regionRange[0], sizeDef.regionRange[1], rng);

  // Biome
  const biomeDef = weightedPick(BIOME_BY_DISTANCE[zone], rng);
  const biome = biomeDef.biome;

  // Atmosphere
  const atmoDef = weightedPick(ATMOSPHERES[zone], rng);

  // Development level
  const devLevel = population > 2000000 ? "Developed"
    : population > 500000 ? "Established"
    : "Frontier";

  // Generate regions
  const regions = [];
  for (let i = 0; i < regionCount; i++) {
    regions.push(generateRegion(biome, i, population, rng));
  }

  // Hidden state — loyalist antagonist layer
  const loyalistBaseRegion = randInt(1, regionCount - 1, rng); // not in capital
  const loyalistBase = {
    regionIndex: loyalistBaseRegion,
    gridX: randInt(3, 16, rng),
    gridY: randInt(3, 16, rng),
    discovered: false,
  };

  const outpostCount = randInt(1, 3, rng);
  const loyalistOutposts = [];
  for (let i = 0; i < outpostCount; i++) {
    loyalistOutposts.push({
      regionIndex: randInt(0, regionCount - 1, rng),
      gridX: randInt(2, 17, rng),
      gridY: randInt(2, 17, rng),
      discovered: false,
    });
  }

  const loyalistStrength = randInt(30, 100, rng);

  return {
    starId,
    bodySlot,
    name: planetName,
    size: sizeDef.size,
    biome,
    atmosphere: atmoDef.atmo,
    population,
    developmentLevel: devLevel,
    regions,
    generated: true,

    hiddenState: {
      antagonistFaction: "Imperial Loyalist Cell",
      loyalistBase,
      loyalistOutposts,
      loyalistStrength,
      supplyLines: randInt(1, 3, rng),
    },
  };
}

export { BIOME_TABLE, TILE_TERRAIN };
