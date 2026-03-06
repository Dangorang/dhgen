export const RANKS = [
  { name: "Acolyte",     minXP: 0    },
  { name: "Disciple",    minXP: 1000 },
  { name: "Crusader",    minXP: 2000 },
  { name: "Veteran",     minXP: 3000 },
  { name: "Inquisitor",  minXP: 5000 },
];

export function getRank(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i].name;
  }
  return RANKS[0].name;
}

export const INJURY_TABLE = [
  { name: "Lost Eye",     stat: "perception",   penalty: -5, description: "A blade or bullet has claimed your eye. Perception forever diminished." },
  { name: "Lame Leg",     stat: "agility",      penalty: -5, description: "Your leg was shattered. You will never move the same way again." },
  { name: "Scarred Face", stat: "fellowship",   penalty: -5, description: "Your face bears terrible wounds. Others recoil from your visage." },
  { name: "Nerve Damage", stat: "meleeSkill",   penalty: -5, description: "Your sword arm trembles. The nerve damage may never fully heal." },
  { name: "Broken Ribs",  stat: "toughness",    penalty: -5, description: "Your ribs were crushed. Every breath is a reminder of your failure." },
  { name: "Head Wound",   stat: "intelligence", penalty: -5, description: "A blow to the skull has dulled your mind. Some things you will never recall." },
];

// ── Single testbed mission ─────────────────────────────────────
export const MISSIONS = [
  {
    id: "testbed_contact",
    name: "Contact Protocol",
    type: "Engagement",
    tier: "Dangerous",
    flavor: "Hostiles confirmed at the objective. Three contacts, unknown disposition. Close in and neutralise. This mission serves as the proving ground for all tactical systems.",
    checks: [
      { stat: "perception",  difficulty: 30, label: "Scan the area",       flavor: "You sweep the approach for sentries and hidden threats.", isCombat: false },
      { stat: "meleeSkill",  difficulty: 35, label: "Engage the hostiles", flavor: "Three enemies stand between you and the objective.",       isCombat: true  },
    ],
    xpSuccess: 250,
    xpFailure: 75,
    woundDamageRange: [1, 4],
  },
];
