export const WEAPON_TYPES = {
  MELEE: "Melee",
  PISTOL: "Pistol",
  BASIC: "Basic",
  HEAVY: "Heavy",
  SPECIAL: "Special",
};

export const WEAPON_CLASS = {
  LAS: "Las",
  SOLID_PROJECTILE: "Solid Projectile",
  PLASMA: "Plasma",
  BOLTER: "Bolter",
  FLAMER: "Flamer",
  MECHADENDRITE: "Mechadendrite",
  CHAIN: "Chain",
  POWER: "Power",
};

export const WEAPON_AVAILABILITY = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  VERY_RARE: "Very Rare",
  ARCANE: "Arcane",
};

export const WEAPONS = [
  {
    id: "laspistol",
    name: "Laspistol",
    type: WEAPON_TYPES.PISTOL,
    class: WEAPON_CLASS.LAS,
    damage: "1d10",
    pen: 0,
    range: "30m",
    rateOfFire: "S/2/-",
    clip: 30,
    reload: "Half",
    weight: 1.5,
    availability: WEAPON_AVAILABILITY.COMMON,
    description: "The standard sidearm of the Imperial Guard and a reliable weapon for any Acolyte. Compact and easy to maintain.",
    specialRules: ["Reliable", "UB"],
    cost: 15,
  },
  {
    id: "lasgun",
    name: "Lasgun",
    type: WEAPON_TYPES.BASIC,
    class: WEAPON_CLASS.LAS,
    damage: "1d10+1",
    pen: 0,
    range: "100m",
    rateOfFire: "S/3/-",
    clip: 40,
    reload: "Half",
    weight: 3,
    availability: WEAPON_AVAILABILITY.COMMON,
    description: "The most common weapon in the Imperium. Reliable, cheap, and deadly in volume.",
    specialRules: ["Reliable", "UB"],
    cost: 25,
  },
  {
    id: "bolt_pistol",
    name: "Bolt Pistol",
    type: WEAPON_TYPES.PISTOL,
    class: WEAPON_CLASS.BOLTER,
    damage: "1d10+4",
    pen: 3,
    range: "30m",
    rateOfFire: "S/2/-",
    clip: 6,
    reload: "Full",
    weight: 2,
    availability: WEAPON_AVAILABILITY.RARE,
    description: "A heavy pistol that fires explosive bolts the size of a man's thumb. Favored by Space Marines and high-ranking officers.",
    specialRules: ["Explosive", "Tearing"],
    cost: 150,
  },
  {
    id: "chainknife",
    name: "Chain Knife",
    type: WEAPON_TYPES.MELEE,
    class: WEAPON_CLASS.CHAIN,
    damage: "1d5+3",
    pen: 1,
    range: "Melee",
    rateOfFire: "-",
    clip: null,
    reload: null,
    weight: 1,
    availability: WEAPON_AVAILABILITY.UNCOMMON,
    description: "A knife with a chain-blade edge. The teeth rip through flesh with horrible efficiency.",
    specialRules: ["Tearing"],
    cost: 30,
  },
  {
    id: "power_sword",
    name: "Power Sword",
    type: WEAPON_TYPES.MELEE,
    class: WEAPON_CLASS.POWER,
    damage: "1d10+5",
    pen: 5,
    range: "Melee",
    rateOfFire: "-",
    clip: null,
    reload: null,
    weight: 3,
    availability: WEAPON_AVAILABILITY.VERY_RARE,
    description: "A blade whose edge crackles with power fields. Even a graze can be fatal.",
    specialRules: ["Power Field", "Balanced"],
    cost: 500,
  },
  {
    id: "plasma_pistol",
    name: "Plasma Pistol",
    type: WEAPON_TYPES.PISTOL,
    class: WEAPON_CLASS.PLASMA,
    damage: "1d10+5",
    pen: 4,
    range: "20m",
    rateOfFire: "S/1/-",
    clip: 6,
    reload: "Full",
    weight: 2.5,
    availability: WEAPON_AVAILABILITY.RARE,
    description: "Fires superheated plasma in controlled bursts. Dangerous but devastating.",
    specialRules: ["Overheat", "Melta"],
    cost: 250,
  },
  {
    id: "flamer",
    name: "Flamer",
    type: WEAPON_TYPES.BASIC,
    class: WEAPON_CLASS.FLAMER,
    damage: "1d10+4",
    pen: 4,
    range: "Cone",
    rateOfFire: "S/2/-",
    clip: 6,
    reload: "Full",
    weight: 8,
    availability: WEAPON_AVAILABILITY.RARE,
    description: "Sprays burning promethium in a cone. Terrifying and effective against groups.",
    specialRules: ["Flamer", "Spray"],
    cost: 200,
  },
  {
    id: "autogun",
    name: "Autogun",
    type: WEAPON_TYPES.BASIC,
    class: WEAPON_CLASS.SOLID_PROJECTILE,
    damage: "1d10",
    pen: 0,
    range: "50m",
    rateOfFire: "S/3/-",
    clip: 30,
    reload: "Half",
    weight: 3.5,
    availability: WEAPON_AVAILABILITY.COMMON,
    description: "A solid, reliable autogun. Nothing special but gets the job done.",
    specialRules: ["UB"],
    cost: 20,
  },
];

export function getWeaponById(id) {
  return WEAPONS.find(w => w.id === id);
}

export function getWeaponsByType(type) {
  return WEAPONS.filter(w => w.type === type);
}

export function getWeaponsByAvailability(availability) {
  return WEAPONS.filter(w => w.availability === availability);
}

export function formatWeaponStats(weapon) {
  let stats = `${weapon.damage} Dmg | Pen ${weapon.pen} | ${weapon.range}`;
  if (weapon.rateOfFire !== "-") {
    stats += ` | RoF ${weapon.rateOfFire}`;
  }
  if (weapon.clip !== null) {
    stats += ` | Clip ${weapon.clip}`;
  }
  return stats;
}
