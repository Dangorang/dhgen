// characterGenerator.js — Full 8-layer character generation from Character_Generation.md
// Layers: Origin → Stats → Role → Physiology → Name → Personality → Gear → Details

function d10() { return Math.ceil(Math.random() * 10); }
function nd10(n) { let t = 0; for (let i = 0; i < n; i++) t += d10(); return t; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function weightedPick(entries) {
  // entries: [{ value, weight }] — higher weight = more likely
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of entries) { r -= e.weight; if (r <= 0) return e.value; }
  return entries[entries.length - 1].value;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: ORIGINS
// ═══════════════════════════════════════════════════════════════════════════════
export const ORIGINS = {
  "Hive-born": {
    statMods: { toughness: 5, perception: 5, agility: 5, intelligence: -5 },
    roles: ["Veteran Infantry", "Corpsman", "Demotech", "Infiltrator"],
    rareRoles: [],
    heightAdj: -5, weightAdj: 5,
    buildTendency: "stocky",
    skinPool: ["Pale", "Sallow", "Light Olive"],
    hairWeights: { Black: 5, "Dark Brown": 5, Brown: 3, Auburn: 1, Blonde: 1 },
    eyeWeights: { "Dark Brown": 5, Brown: 5, Hazel: 3, Green: 1, Grey: 1 },
    visualTraits: ["Facial scarring", "Chemical burns", "Industrial tattoos", "Missing teeth", "Calloused hands", "Smog-stained skin"],
    charms: ["Corroded factory token", "Bent gear cog on a cord", "Scrap of cloth from a dead sibling", "Spent shell casing from first gang fight"],
  },
  "Void-born": {
    statMods: { agility: 5, intelligence: 5, perception: 5, strength: -5, toughness: -5 },
    roles: ["Veteran Infantry", "Sanctioned", "Artificer", "Corpsman", "Demotech", "Infiltrator"],
    rareRoles: [],
    heightAdj: 10, weightAdj: -10,
    buildTendency: "lean",
    skinPool: ["Very Pale", "Pale", "Slightly Translucent"],
    hairWeights: { White: 5, "Light Blonde": 5, Grey: 4, Blonde: 3, Brown: 1 },
    eyeWeights: { Grey: 5, "Pale Blue": 5, Blue: 3, Hazel: 1 },
    visualTraits: ["Elongated fingers", "Light-sensitive eyes", "Faint blue veins visible through skin", "Zero-G posture"],
    charms: ["Void-crystal pendant", "Fragment of station hull plating", "Star chart etched on metal", "Pressurized air capsule from birth-station"],
  },
  "Frontier-born": {
    statMods: { strength: 5, toughness: 5, perception: 5, leadership: -5, willpower: -5 },
    roles: ["Veteran Infantry", "Corpsman", "Demotech", "Infiltrator"],
    rareRoles: [],
    heightAdj: 0, weightAdj: 5,
    buildTendency: "rangy",
    skinPool: ["Sun-Darkened", "Weathered Tan", "Pale", "Deep Brown"],
    hairWeights: { Brown: 4, "Light Blonde": 3, Blonde: 3, Auburn: 2, Black: 2 },
    eyeWeights: { Brown: 3, Hazel: 3, Green: 3, Grey: 3, Blue: 3 },
    visualTraits: ["Weather-beaten skin", "Calloused hands", "Animal-bite scarring", "Sun damage", "Wind-chapped features"],
    charms: ["Predator tooth necklace", "Carved wooden figure", "Seed pouch from homestead", "Polished river stone", "Tanned leather cord"],
  },
  "Schola-born": {
    statMods: { willpower: 10, leadership: 5, strength: -5 },
    roles: ["Veteran Infantry", "Sanctioned", "Artificer", "Corpsman", "Demotech", "Infiltrator"],
    rareRoles: [],
    heightAdj: 0, weightAdj: 0,
    buildTendency: "average",
    skinPool: ["Any"],
    hairWeights: { Black: 2, "Dark Brown": 2, Brown: 2, Auburn: 2, Blonde: 2, "Light Blonde": 2, Grey: 1 },
    eyeWeights: { "Dark Brown": 2, Brown: 2, Hazel: 2, Green: 2, Grey: 2, Blue: 2, "Pale Blue": 1 },
    visualTraits: ["Institutional brand", "Schola tattoo", "Close-cropped hair", "Rigid posture", "Uniform grooming"],
    charms: ["Prayer coin with Schola seal", "Worn Council catechism", "Braided wristband from a Schola-mate", "Merit badge"],
    personalityOverride: ["Zealous", "Disciplined", "Ambitious"], // forced to HIGH weight
  },
  "Noble-born": {
    statMods: { intelligence: 5, leadership: 10, toughness: -5, strength: -5 },
    roles: ["Veteran Infantry", "Sanctioned", "Artificer", "Infiltrator"],
    rareRoles: ["Corpsman", "Demotech"],
    heightAdj: 5, weightAdj: 0,
    buildTendency: "tall",
    skinPool: ["Clear Light", "Warm Brown", "Dark", "Fair", "Olive"],
    hairWeights: { Black: 2, "Dark Brown": 2, Brown: 2, Auburn: 2, Blonde: 2, "Light Blonde": 2, Red: 1 },
    eyeWeights: { Green: 3, Blue: 3, "Pale Blue": 2, Brown: 2, Hazel: 2, Grey: 2 },
    visualTraits: ["Manicured appearance", "Subtle gene-seed enhancement", "Clear skin", "Well-maintained teeth"],
    charms: ["Signet ring with family crest", "Miniature portrait of family", "Silver chain of office", "Monogrammed handkerchief"],
  },
  "Militarum-born": {
    statMods: { strength: 5, toughness: 5, willpower: 5, leadership: 5, intelligence: -5 },
    roles: ["Veteran Infantry", "Corpsman", "Demotech"],
    rareRoles: ["Sanctioned"],
    heightAdj: 0, weightAdj: 5,
    buildTendency: "developed",
    skinPool: ["Any"],
    hairWeights: { Black: 2, "Dark Brown": 2, Brown: 2, Auburn: 2, Blonde: 2, "Light Blonde": 2 },
    eyeWeights: { "Dark Brown": 2, Brown: 2, Hazel: 2, Green: 2, Grey: 2, Blue: 2 },
    visualTraits: ["Unit tattoos", "Training scars", "Cropped hair", "Tan lines from armor", "Cauliflower ears"],
    charms: ["Shell casing from first engagement", "Dog tags of a fallen parent", "Regimental badge", "Worn holo-pic of family in uniform"],
  },
  "Outcast": {
    statMods: { agility: 10, perception: 5, willpower: -5, leadership: -10 },
    roles: ["Infiltrator", "Veteran Infantry"],
    rareRoles: ["Corpsman"],
    heightAdj: -5, weightAdj: -5,
    buildTendency: "lean",
    skinPool: ["Any"],
    hairWeights: { Black: 2, "Dark Brown": 2, Brown: 2, Auburn: 2, Blonde: 2, Grey: 1 },
    eyeWeights: { "Dark Brown": 2, Brown: 2, Hazel: 2, Green: 2, Grey: 2, Blue: 2 },
    visualTraits: ["Missing digit", "Penal brand", "Gang tattoos", "Malnutrition markers", "Improvised piercings", "Knife scars"],
    charms: ["Stolen data chip", "Shiv they refuse to discard", "Faded tattoo ink vial", "Luck charm from scavenged wire"],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: STATS — Role base stats (Origin mods applied on top)
// ═══════════════════════════════════════════════════════════════════════════════
const ROLE_STAT_BASES = {
  "Veteran Infantry": { strength: 30, toughness: 30, agility: 20, perception: 30, intelligence: 20, willpower: 35, leadership: 30, psyRating: 0 },
  "Sanctioned":       { strength: 20, toughness: 25, agility: 20, perception: 30, intelligence: 25, willpower: 40, leadership: 5,  psyRating: 20 },
  "Artificer":        { strength: 20, toughness: 25, agility: 25, perception: 30, intelligence: 40, willpower: 25, leadership: 10, psyRating: 0 },
  "Corpsman":         { strength: 25, toughness: 30, agility: 25, perception: 30, intelligence: 30, willpower: 35, leadership: 15, psyRating: 0 },
  "Demotech":         { strength: 30, toughness: 35, agility: 20, perception: 30, intelligence: 30, willpower: 30, leadership: 10, psyRating: 0 },
  "Infiltrator":      { strength: 20, toughness: 20, agility: 35, perception: 40, intelligence: 35, willpower: 30, leadership: 5,  psyRating: 0 },
};

const HUMAN_BASES = { strength: 20, toughness: 20, agility: 20, perception: 20, intelligence: 20, willpower: 20, leadership: 5, psyRating: 0 };

const STAT_KEYS = ["strength", "toughness", "agility", "perception", "intelligence", "willpower", "leadership", "psyRating"];

export function generateStats(origin, role) {
  const originMods = ORIGINS[origin]?.statMods || {};
  const roleBases = ROLE_STAT_BASES[role] || HUMAN_BASES;
  const stats = {};
  for (const key of STAT_KEYS) {
    const humanBase = HUMAN_BASES[key];
    const roleBase = roleBases[key];
    const originMod = originMods[key] || 0;
    // If role base > human base, apply origin mod to role base; else apply to human base
    const base = roleBase > humanBase ? roleBase + originMod : humanBase + originMod;
    const dice = key === "psyRating" ? d10() : nd10(2);
    stats[key] = Math.max(1, base + dice);
  }
  return stats;
}

// Prefect promotion: +5 WIL, +10 LDR
export function applyPrefectPromotion(stats) {
  return { ...stats, willpower: stats.willpower + 5, leadership: stats.leadership + 10 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: ROLE SELECTION — helpers
// ═══════════════════════════════════════════════════════════════════════════════
export const ALL_ROLES = ["Veteran Infantry", "Sanctioned", "Artificer", "Corpsman", "Demotech", "Infiltrator"];

export function getAvailableRoles(origin) {
  const o = ORIGINS[origin];
  if (!o) return ALL_ROLES;
  return [...o.roles, ...o.rareRoles];
}

export function pickRandomRole(origin) {
  const o = ORIGINS[origin];
  if (!o) return pick(ALL_ROLES);
  // Weight: normal roles 10x, rare roles 1x
  const entries = o.roles.map(r => ({ value: r, weight: 10 }));
  for (const r of o.rareRoles) entries.push({ value: r, weight: 1 });
  return weightedPick(entries);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4: PHYSIOLOGY
// ═══════════════════════════════════════════════════════════════════════════════
export function generatePhysiology(origin, stats) {
  const o = ORIGINS[origin] || ORIGINS["Hive-born"];
  const age = 16 + nd10(4); // 20-56

  // Height
  const statHeightMod = Math.round((stats.strength + stats.toughness) / 10 - stats.agility / 10);
  const height = 160 + (o.heightAdj || 0) + statHeightMod + nd10(2);

  // Weight
  const statWeightMod = Math.round((stats.strength + stats.toughness) / 5 - stats.agility / 5);
  const weight = 60 + (o.weightAdj || 0) + statWeightMod + nd10(2);

  // Build descriptor
  const bmi = weight / ((height / 100) ** 2);
  const build = bmi < 17 ? "Gaunt" : bmi < 19 ? "Lean" : bmi < 21 ? "Wiry"
    : bmi < 24 ? "Average" : bmi < 27 ? "Stocky" : bmi < 30 ? "Broad" : "Heavy";

  // Skin tone
  const skinPool = o.skinPool[0] === "Any"
    ? ["Pale", "Fair", "Light Olive", "Tan", "Warm Brown", "Dark Brown", "Deep Brown"]
    : o.skinPool;
  const skinTone = pick(skinPool);

  // Hair
  const hairEntries = Object.entries(o.hairWeights).map(([v, w]) => ({ value: v, weight: w }));
  let hairColor = weightedPick(hairEntries);
  // Age modifier
  if (age > 50) hairColor = Math.random() < 0.6 ? "Grey" : "White";
  else if (age > 40) hairColor = Math.random() < 0.3 ? "Grey" : hairColor;

  // Eyes
  const eyeEntries = Object.entries(o.eyeWeights).map(([v, w]) => ({ value: v, weight: w }));
  let eyeColor = weightedPick(eyeEntries);
  if (Math.random() < 0.01) eyeColor = Math.random() < 0.5 ? "Violet" : "Amber"; // 1% rare

  return { age, height, weight, build, skinTone, hairColor, eyeColor };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5: NAME GENERATION
// ═══════════════════════════════════════════════════════════════════════════════
const NAME_TABLES = {
  "Hive-born": {
    given: ["Kael", "Ren", "Tam", "Voss", "Brix", "Sal", "Dek", "Nev", "Grinn", "Jace", "Tol", "Mak", "Fen", "Rook", "Cog"],
    surname: ["Drosswick", "Ashward", "Greymill", "Cinder", "Foundry", "Millbank", "Rustfield", "Smeltdon", "Pressward", "Cokeburn"],
    format: (g, s) => `${g} ${s}`,
  },
  "Void-born": {
    given: ["Seren", "Cael", "Lyss", "Mira", "Theron", "Vega", "Altair", "Eos", "Lune", "Peri", "Axis", "Zenith", "Cora", "Solenne"],
    surname: ["Ark-Valis", "Orion-Dray", "Threshold-Kaine", "Solace-Venn", "Drift-Callum", "Meridian-Salk", "Haven-Rho", "Eclipse-Farren"],
    format: (g, s) => `${g} ${s}`,
  },
  "Frontier-born": {
    given: ["Drev", "Marra", "Joss", "Tarn", "Kira", "Breck", "Hale", "Wynn", "Colt", "Dessa", "Leith", "Rowan", "Thane", "Petra"],
    surname: ["Coldridge", "Stonefield", "Windhollow", "Ashfen", "Deepwell", "Thornwall", "Ironmoor", "Dryreach", "Blackthorn", "Stormvale"],
    format: (g, s) => `${g} ${s}`,
  },
  "Schola-born": {
    given: ["Castus", "Venn", "Sera", "Aldren", "Maren", "Lucan", "Decima", "Corvus", "Pallas", "Septima", "Felix", "Justus"],
    surname: ["Primus-VII", "Doctrina-XII", "Fortis-III", "Vigil-IX", "Crucis-IV", "Ferrum-VI", "Bellum-II", "Fidus-VIII"],
    format: (g, s) => `${g} ${s}`,
  },
  "Noble-born": {
    prefixes: ["Ser", "Dame", "Lord", "Lady", "Scion"],
    given: ["Aldric", "Lysara", "Cassius", "Petra", "Valerian", "Isolde", "Octavian", "Seraphine", "Hadrian", "Celestine"],
    middle: ["Voss-Meridian", "Thane-Solari", "Draeven-Kael", "Venn-Auric", "Cross-Halcyon"],
    surname: ["Caelworth", "Ashcourt", "Mordaine", "Halstead", "Blackholme", "Argentus", "Valorian", "Sternmark"],
    suffixes: ["the Younger", "the Elder", "the Third", "of the Fourth Hour", "Secondborn"],
    format: (g, s, o) => {
      const t = NAME_TABLES["Noble-born"];
      const prefix = pick(t.prefixes);
      const mid = pick(t.middle);
      // 50% chance for suffix
      const suffix = Math.random() < 0.5 ? " " + pick(t.suffixes) : "";
      return `${prefix} ${g} ${mid} ${s}${suffix}`;
    },
  },
  "Militarum-born": {
    given: ["Bren", "Dalla", "Cade", "Jael", "Ryn", "Torr", "Vex", "Kade", "Mira", "Stern", "Holt", "Dace"],
    surname: ["Harkov", "Vostok", "Marek", "Torrin", "Callus", "Brenn", "Dekker", "Volsk", "Thrace", "Renn"],
    honorifics: ["Sixthline", "Tenthwatch", "Firstsword", "Fourthblade", "Eighthwall", "Thirdshield", "Secondguard", "Fifthwall"],
    format: (g, s) => `${g} ${s} ${pick(NAME_TABLES["Militarum-born"].honorifics)}`,
  },
  "Outcast": {
    given: ["Slit", "Marrow", "Dusk", "Glass", "Sable", "Haunt", "Crow", "Jink", "Needle", "Whisper", "Notch", "Copper", "Splint", "Gutter", "Ash", "Flicker", "Moth", "Scratch", "Rust", "Shale"],
    surname: [],
    modifiers: ["Nine-Finger", "Blind", "Tall", "Old", "Red"],
    format: (g) => Math.random() < 0.25 ? `${pick(NAME_TABLES["Outcast"].modifiers)} ${g}` : g,
  },
};

export function generateName(origin) {
  const t = NAME_TABLES[origin] || NAME_TABLES["Hive-born"];
  const given = pick(t.given);
  const surname = t.surname.length > 0 ? pick(t.surname) : "";
  return t.format(given, surname, origin);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 6: PERSONALITY
// ═══════════════════════════════════════════════════════════════════════════════
const ALL_PERSONALITIES = [
  "Stoic", "Zealous", "Pragmatic", "Bitter", "Quiet", "Arrogant", "Cautious",
  "Aggressive", "Loyal", "Sardonic", "Disciplined", "Curious", "Ruthless",
  "Compassionate", "Haunted", "Ambitious",
];

// Weights: HIGH=8, MED=4, LOW=2, RARE=1, EXCLUDED=0
const ROLE_PERSONALITY_WEIGHTS = {
  "Veteran Infantry": { Stoic:8,Aggressive:8,Loyal:8,Disciplined:8,Bitter:8, Pragmatic:4,Zealous:4,Haunted:4,Sardonic:4, Cautious:2,Ruthless:2,Compassionate:2,Ambitious:2, Quiet:1,Arrogant:1, Curious:0 },
  "Sanctioned":       { Stoic:8,Quiet:8,Haunted:8,Bitter:8, Disciplined:4,Cautious:4,Arrogant:4, Zealous:2,Ruthless:2,Pragmatic:2, Compassionate:1,Sardonic:1, Loyal:0,Aggressive:0 },
  "Artificer":        { Curious:8,Pragmatic:8,Cautious:8,Quiet:8, Sardonic:4,Stoic:4,Disciplined:4, Loyal:2,Compassionate:2,Haunted:2, Bitter:1,Arrogant:1,Ambitious:1, Aggressive:0,Zealous:0 },
  "Corpsman":         { Stoic:8,Compassionate:8,Pragmatic:8,Haunted:8, Disciplined:4,Loyal:4,Sardonic:4,Bitter:4, Cautious:2,Quiet:2, Curious:1,Aggressive:1,Ambitious:1, Ruthless:0,Arrogant:0 },
  "Demotech":         { Stoic:8,Disciplined:8,Pragmatic:8,Cautious:8, Sardonic:4,Quiet:4,Aggressive:4,Loyal:4, Bitter:2,Haunted:2,Arrogant:2,Ambitious:2, Compassionate:1,Ruthless:1, Curious:0 },
  "Infiltrator":      { Quiet:8,Arrogant:8,Pragmatic:8,Ruthless:8, Cautious:4,Sardonic:4,Stoic:4,Curious:4, Disciplined:2,Haunted:2,Bitter:2,Ambitious:2, Compassionate:1, Zealous:0,Loyal:0,Aggressive:0 },
};

const PREFECT_WEIGHTS = { Disciplined:8,Zealous:8,Pragmatic:8,Stoic:8,Ambitious:8, Ruthless:4,Aggressive:4,Loyal:4,Arrogant:4 };

export function generatePersonality(role, origin, isPrefect = false) {
  const roleWeights = ROLE_PERSONALITY_WEIGHTS[role] || {};
  const entries = ALL_PERSONALITIES.map(p => {
    let w = roleWeights[p] !== undefined ? roleWeights[p] : 2;
    // Prefect override
    if (isPrefect && PREFECT_WEIGHTS[p]) w = Math.max(w, PREFECT_WEIGHTS[p]);
    // Schola-born override
    if (origin === "Schola-born" && ["Zealous", "Disciplined", "Ambitious"].includes(p)) w = Math.max(w, 8);
    return { value: p, weight: w };
  }).filter(e => e.weight > 0);
  return weightedPick(entries);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 7: GEAR LOADOUT
// ═══════════════════════════════════════════════════════════════════════════════
const STANDARD_ISSUE = [
  { id: "thorn_sidearm", name: "Thorn Sidearm", desc: "Standard-issue pistol. Compact, reliable." },
  { id: "ashmark_knife", name: "Ashmark Combat Knife", desc: "Utility blade and last-resort weapon." },
  { id: "meridian_helmet", name: "Meridian Helmet", desc: "Short-range comms and basic HUD." },
  { id: "suture_kit", name: "Suture Kit", desc: "Bandages, coagulant patch, single stimulant." },
];

const ROLE_LOADOUTS = {
  "Veteran Infantry": {
    primary: [
      { id: "vex9_rifle", name: "Vex-9 Assault Rifle", desc: "Standard workhorse. Reliable, accurate." },
      { id: "hound_lmg", name: "Hound LMG", desc: "Squad automatic weapon. Belt-fed, sustained fire." },
      { id: "vigil_marksman", name: "Vigil Marksman Rifle", desc: "Precision weapon with integrated optics." },
      { id: "reaver_shotgun", name: "Reaver Shotgun", desc: "Close-quarters. Various shell types." },
    ],
    armor: { id: "forge_plate", name: "Forge Plate Armor", desc: "Full set. Mass-produced stamped alloy." },
    extras: [
      { id: "pyre_grenade", name: "Pyre Grenades (x2)", desc: "Fragmentation." },
      { id: "veil_grenade", name: "Veil Grenade (x1)", desc: "Smoke concealment." },
    ],
  },
  "Sanctioned": {
    primary: [
      { id: "council_focus", name: "Council Focus Apparatus", desc: "Psionic channeling gauntlet. Monitors output." },
    ],
    armor: { id: "forge_plate_light", name: "Forge Plate (Light)", desc: "Head and body only. Mobility prioritized." },
    extras: [
      { id: "limiter_device", name: "Limiter Device", desc: "Allows command to suppress abilities." },
      { id: "blood_vial", name: "Blood Vial", desc: "Condensed sanctioned blood for field screening." },
    ],
  },
  "Artificer": {
    primary: [
      { id: "vex9c_carbine", name: "Vex-9C Carbine", desc: "Compact variant. Not a primary combatant." },
    ],
    armor: { id: "shade_vest", name: "Shade Vest", desc: "Light torso armor. Mobility for tech work." },
    extras: [
      { id: "diagnostic_array", name: "Diagnostic Array", desc: "Portable tools for cogitator systems." },
      { id: "repair_kit", name: "Repair Kit", desc: "Pre-war components, hoarded and rationed." },
      { id: "comms_array", name: "High-Power Encrypted Comms", desc: "Squad's link to the Justicar." },
    ],
  },
  "Corpsman": {
    primary: [
      { id: "vex9c_carbine", name: "Vex-9C Carbine", desc: "Compact primary. Needs hands free for medical work." },
    ],
    armor: { id: "forge_plate", name: "Forge Plate Armor", desc: "Full set. Former infantry, expects fire." },
    extras: [
      { id: "trauma_kit", name: "Field Trauma Kit", desc: "Surgical tools, coagulants, bone-setting splints." },
      { id: "stimulant_suite", name: "Stimulant Suite", desc: "Combat-grade injectors. Pushes past shock." },
      { id: "diagnostic_scanner", name: "Diagnostic Scanner", desc: "Handheld vitals reader." },
    ],
  },
  "Demotech": {
    primary: [
      { id: "reaver_shotgun", name: "Reaver Shotgun", desc: "Close-quarters. First through the breach." },
    ],
    armor: { id: "forge_plate_heavy", name: "Forge Plate (Heavy)", desc: "Reinforced with blast protection." },
    extras: [
      { id: "breaching_charges", name: "Breaching Charges", desc: "Door, wall, shaped configurations." },
      { id: "blast_kit", name: "Blast Kit", desc: "Detonators, fuses, remote triggers." },
      { id: "structural_scanner", name: "Structural Scanner", desc: "Reads load-bearing points and material density." },
      { id: "pyre_grenade", name: "Pyre Grenades (x3)", desc: "Extra fragmentation allocation." },
    ],
  },
  "Infiltrator": {
    primary: [
      { id: "vex9c_carbine", name: "Vex-9C Carbine", desc: "Compact, concealable configuration." },
    ],
    armor: { id: "shade_vest", name: "Shade Vest", desc: "Light torso armor, concealable." },
    extras: [
      { id: "cover_kit", name: "Cover Kit", desc: "False identity docs, appearance alteration." },
      { id: "bypass_suite", name: "Bypass Suite", desc: "Tools for locks, alarms, security." },
      { id: "surveillance_package", name: "Surveillance Package", desc: "Miniaturized recording devices." },
      { id: "spectra_scanner", name: "Spectra Scanner", desc: "Handheld sensor for life signs." },
      { id: "lull_grenade", name: "Lull Grenades (x2)", desc: "Flashbang for disorientation." },
    ],
  },
};

export function generateLoadout(role) {
  const loadout = ROLE_LOADOUTS[role];
  if (!loadout) return [...STANDARD_ISSUE];
  const primary = pick(loadout.primary);
  return [primary, loadout.armor, ...loadout.extras, ...STANDARD_ISSUE];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 8: DETAILS — visual traits, charm, quirk
// ═══════════════════════════════════════════════════════════════════════════════
const QUIRKS = [
  "Taps sidearm holster when nervous", "Hums under their breath before combat",
  "Never eats in front of others", "Sleeps with boots on",
  "Writes letters they never send", "Counts rounds obsessively",
  "Talks to their weapon", "Chews something constantly",
  "Cleans weapon at every opportunity", "Refuses to use others' equipment",
  "Always checks exits first", "Cracks knuckles before decisions",
  "Stares at the sky whenever outdoors", "Keeps a running tally scratched into armor",
  "Whistles the same three-note phrase", "Touches charm before every engagement",
  "Speaks to the dead — mutters fallen names", "Avoids mirrors and reflective surfaces",
  "Always volunteers for first watch", "Memorizes the name of every kill",
];

export function generateDetails(origin) {
  const o = ORIGINS[origin] || ORIGINS["Hive-born"];
  // 1-2 visual traits
  const traitCount = Math.random() < 0.5 ? 1 : 2;
  const traits = [];
  while (traits.length < traitCount && traits.length < o.visualTraits.length) {
    const t = pick(o.visualTraits);
    if (!traits.includes(t)) traits.push(t);
  }
  const charm = pick(o.charms);
  const quirk = pick(QUIRKS);
  return { visualTraits: traits, charm, quirk };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WOUNDS + DERIVED
// ═══════════════════════════════════════════════════════════════════════════════
function d5() { return Math.ceil(Math.random() * 5); }

export function calcWounds(stats) {
  return d5() + Math.floor(stats.willpower / 10) + Math.floor(stats.toughness / 10) + 5;
}

export function calcFate(role) {
  return role === "Sanctioned" ? 3 : 2;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL CHARACTER GENERATION
// ═══════════════════════════════════════════════════════════════════════════════
export function generateFullCharacter(options = {}) {
  const {
    origin: forcedOrigin,
    role: forcedRole,
    isPrefect = false,
  } = options;

  // Layer 1: Origin
  const origin = forcedOrigin || pick(Object.keys(ORIGINS));

  // Layer 3: Role (before stats, since stats depend on role)
  const role = forcedRole || pickRandomRole(origin);

  // Layer 2: Stats
  let stats = generateStats(origin, role);
  if (isPrefect) stats = applyPrefectPromotion(stats);

  // Layer 4: Physiology
  const physiology = generatePhysiology(origin, stats);

  // Layer 5: Name
  const name = generateName(origin);

  // Layer 6: Personality
  const personality = generatePersonality(role, origin, isPrefect);

  // Layer 7: Gear
  const equipment = generateLoadout(role);

  // Layer 8: Details
  const details = generateDetails(origin);

  // Derived
  const wounds = calcWounds(stats);
  const fate = calcFate(role);

  return {
    id: `char_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name,
    origin,
    role,
    isPrefect,
    class: isPrefect ? `Prefect (${role})` : role,
    stats,
    wounds,
    fate,
    physiology,
    personality,
    equipment,
    details,
    background: `${origin} origin. ${role}${isPrefect ? " — promoted to Prefect, bearing the Seal of Authority." : "."}`,
    xp: 0,
    kia: false,
    insanity: 0,
    corruption: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT METADATA for UI rendering
// ═══════════════════════════════════════════════════════════════════════════════
export const STAT_META = [
  { key: "strength",     label: "STRENGTH",  abbr: "STR", desc: "Melee damage & feats of strength" },
  { key: "toughness",    label: "TOUGHNESS", abbr: "TGH", desc: "Resist damage & critical injury" },
  { key: "agility",      label: "AGILITY",   abbr: "AGI", desc: "Dodge, movement, initiative" },
  { key: "perception",   label: "PERCEPTION",abbr: "PER", desc: "Awareness, range bonus, detection" },
  { key: "intelligence", label: "INTEL",     abbr: "INT", desc: "Reasoning, tech, investigation" },
  { key: "willpower",    label: "WILLPOWER", abbr: "WIL", desc: "Resist fear, psionics, corruption" },
  { key: "leadership",   label: "LEADERSHIP",abbr: "LDR", desc: "Command authority & squad cohesion" },
  { key: "psyRating",    label: "PSY RATING",abbr: "PSY", desc: "Aetheric potential" },
];
