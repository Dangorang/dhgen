// starSystemGenerator.js — Procedural star system generation
// Generates stars with orbital bodies for the sector map.

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedPick(items, rng) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ── Star types ──────────────────────────────────────────────────────────────
const STAR_TYPES = [
  { type: "Red Dwarf",     spectral: "M-class",  color: "#e85030", habitability: "High",          weight: 45, hzDistance: "close"   },
  { type: "Yellow Dwarf",  spectral: "G-class",  color: "#f0d848", habitability: "High",          weight: 30, hzDistance: "mid"     },
  { type: "Orange Dwarf",  spectral: "K-class",  color: "#e8a040", habitability: "Moderate-High", weight: 15, hzDistance: "mid"     },
  { type: "Blue Giant",    spectral: "B/O-class", color: "#80b0ff", habitability: "Low",          weight: 7,  hzDistance: "far"     },
  { type: "Red Giant",     spectral: "evolved",  color: "#c03020", habitability: "Very Low",      weight: 3,  hzDistance: "far"     },
];

// ── Name generation ─────────────────────────────────────────────────────────
const PREFIXES = [
  "Kel", "Vor", "Ash", "Ner", "Thal", "Kyr", "Zan", "Pel", "Dra", "Cor",
  "Val", "Hex", "Orm", "Syn", "Bel", "Tor", "Phar", "Gal", "Ith", "Mor",
  "Ven", "Syr", "Kol", "Ren", "Xen", "Hel", "Nyx", "Sol", "Ark", "Lux",
];
const SUFFIXES = [
  "ris", "don", "thos", "van", "nar", "phen", "gon", "lex", "rus", "tos",
  "ian", "us", "ax", "on", "is", "ar", "en", "or", "um", "al",
];
const DESIGNATIONS = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
  "Iota", "Kappa", "Lambda", "Sigma", "Tau", "Omega",
];

function generateStarName(rng) {
  if (rng() < 0.35) {
    // Designation style: "KSR-4721"
    const letters = "ABCDEFGHJKLMNPQRSTVWXYZ";
    const code = letters[Math.floor(rng() * letters.length)]
      + letters[Math.floor(rng() * letters.length)]
      + letters[Math.floor(rng() * letters.length)];
    const num = randInt(1000, 9999, rng);
    return `${code}-${num}`;
  }
  // Named style: "Kelthos Gamma"
  const name = pick(PREFIXES, rng) + pick(SUFFIXES, rng);
  if (rng() < 0.4) return name + " " + pick(DESIGNATIONS, rng);
  return name;
}

function generatePlanetName(starName, slot, rng) {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  if (rng() < 0.5) {
    return `${starName} ${roman[slot] || slot + 1}`;
  }
  return pick(PREFIXES, rng) + pick(SUFFIXES, rng);
}

// ── Orbital body generation ─────────────────────────────────────────────────
const BODY_TYPES_INNER = ["rocky_barren", "rocky_barren", "rocky_barren", "asteroid_belt"];
const BODY_TYPES_MID = ["gas_giant", "gas_giant", "rocky_barren", "planet_of_interest"];
const BODY_TYPES_OUTER = ["gas_giant", "ice_dwarf", "ice_dwarf", "asteroid_belt"];

const GAS_GIANT_DESCRIPTORS = [
  "Massive hydrogen-helium atmosphere with violent storm bands.",
  "Pale blue methane giant with faint ring system.",
  "Banded ammonia clouds with a prominent anticyclonic vortex.",
  "Deep orange giant with 20+ catalogued moons.",
  "Supermassive gas body with detectable magnetosphere.",
];

const ROCKY_DESCRIPTORS = [
  "Airless, cratered surface. No signs of habitation.",
  "Thin sulfuric atmosphere. Extreme surface temperatures.",
  "Tidally locked. One hemisphere in perpetual darkness.",
  "Dense iron core. Trace mineral deposits detected.",
  "Heavily bombarded surface. Ancient impact basins visible.",
];

const ICE_DESCRIPTORS = [
  "Frozen nitrogen surface. Distant orbit, minimal solar heating.",
  "Subsurface ocean suspected beneath ice crust.",
  "Highly eccentric orbit. Periodic sublimation events.",
  "Kuiper-class body. Faint cometary outgassing detected.",
];

function generateOrbitalBodies(star, rng) {
  const count = randInt(4, 8, rng);
  const bodies = [];
  let planetOfInterestPlaced = false;

  // Determine habitable zone slot based on star type
  const hzSlot = star.hzDistance === "close" ? randInt(1, 2, rng)
    : star.hzDistance === "mid" ? randInt(2, 4, rng)
    : randInt(4, 6, rng);

  for (let slot = 0; slot < count; slot++) {
    const zone = slot <= 1 ? "inner" : slot <= 4 ? "mid" : "outer";

    // Place planet of interest at or near habitable zone
    if (!planetOfInterestPlaced && (slot === hzSlot || slot === count - 1)) {
      planetOfInterestPlaced = true;
      bodies.push({
        slot,
        type: "planet_of_interest",
        name: generatePlanetName(star.name, slot, rng),
        description: "Mission target. Detailed survey required.",
        zone,
        isPOI: true,
      });
      continue;
    }

    const pool = zone === "inner" ? BODY_TYPES_INNER
      : zone === "mid" ? BODY_TYPES_MID
      : BODY_TYPES_OUTER;

    let type = pick(pool, rng);
    if (type === "planet_of_interest") type = "gas_giant"; // avoid second POI

    const name = type === "asteroid_belt"
      ? `${star.name} Belt ${String.fromCharCode(65 + slot)}`
      : generatePlanetName(star.name, slot, rng);

    const description = type === "gas_giant" ? pick(GAS_GIANT_DESCRIPTORS, rng)
      : type === "ice_dwarf" ? pick(ICE_DESCRIPTORS, rng)
      : type === "asteroid_belt" ? "Dense ring of metallic and silicate debris."
      : pick(ROCKY_DESCRIPTORS, rng);

    const moons = type === "gas_giant" ? randInt(2, 24, rng) : 0;

    bodies.push({ slot, type, name, description, zone, moons, isPOI: false });
  }

  return bodies;
}

// ── Generate a single star system ───────────────────────────────────────────
function generateStarSystem(seed) {
  const rng = mulberry32(seed);
  const starDef = weightedPick(STAR_TYPES, rng);
  const name = generateStarName(rng);

  const star = {
    id: `star_${seed}`,
    name,
    type: starDef.type,
    spectral: starDef.spectral,
    color: starDef.color,
    habitability: starDef.habitability,
    hzDistance: starDef.hzDistance,
  };

  star.bodies = generateOrbitalBodies(star, rng);
  return star;
}

// ── Generate a sector with multiple star systems ────────────────────────────
export function generateSector(sectorSeed = 42) {
  const rng = mulberry32(sectorSeed);
  const count = randInt(5, 8, rng);
  const stars = [];

  // Generate positions with minimum distance
  const positions = [];
  for (let i = 0; i < count; i++) {
    let x, y, attempts = 0;
    do {
      x = 10 + rng() * 80;
      y = 10 + rng() * 80;
      attempts++;
    } while (
      attempts < 50 &&
      positions.some((p) => Math.hypot(p.x - x, p.y - y) < 15)
    );
    positions.push({ x, y });
  }

  for (let i = 0; i < count; i++) {
    const seed = Math.floor(rng() * 0x7fffffff);
    const system = generateStarSystem(seed);
    system.position = positions[i];
    stars.push(system);
  }

  return stars;
}

export { generateStarSystem, mulberry32 };
