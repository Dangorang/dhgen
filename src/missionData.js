// Rank titles for Councilar Agents
export const RANKS = [
  { name: "Agent",          minXP: 0    },
  { name: "Operative",      minXP: 1000 },
  { name: "Enforcer",       minXP: 2000 },
  { name: "Vanguard",       minXP: 3000 },
  { name: "Field Director", minXP: 5000 },
];

export function getRank(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i].name;
  }
  return RANKS[0].name;
}

export const INJURY_TABLE = [
  { name: "Lost Eye",        stat: "perception",   penalty: -5, description: "A blade or discharge has claimed your eye. The loss is permanent — your perception diminished in ways training cannot compensate for." },
  { name: "Damaged Leg",     stat: "agility",      penalty: -5, description: "The fracture was severe. Field medics stabilised the bone, but you will never move quite the same way again." },
  { name: "Scarred Face",    stat: "fellowship",   penalty: -5, description: "The wound healed. The mark did not. People read it before they read you." },
  { name: "Nerve Damage",    stat: "meleeSkill",   penalty: -5, description: "Your arm trembles under stress. The neural pathway will not regenerate — only adapt, slowly and imperfectly." },
  { name: "Chest Trauma",    stat: "toughness",    penalty: -5, description: "Three ribs. A lung partially collapsed. You breathe differently now. Your body carries the arithmetic of the engagement." },
  { name: "Concussive Blow", stat: "intelligence", penalty: -5, description: "The blow disrupted something in your processing. Retrieval is slower. Some sequences you reconstruct rather than recall." },
];

export const MISSIONS = [
  {
    id: "fringe_suppression",
    name: "Fringe Suppression",
    type: "Engagement",
    tier: "Routine",
    flavor: "Fringe operatives have disrupted supply lines in the lower transit quarter. Your orders are to locate and neutralise the cell. Senior Overseer Marath wants this resolved quietly — production quotas are already behind.",
    checks: [
      { stat: "perception",  difficulty: 25, label: "Scout the transit quarter",   flavor: "You observe the approach routes from a maintenance gantry, marking guard rotations and choke points.", isCombat: false },
      { stat: "meleeSkill",  difficulty: 30, label: "Engage the cell",             flavor: "Three fringe operatives hold the lower corridor. They are not well-trained. They are desperate.",           isCombat: true  },
    ],
    xpSuccess: 150,
    xpFailure: 50,
    woundDamageRange: [1, 3],
  },
  {
    id: "dissonance_trace",
    name: "Dissonance Trace",
    type: "Investigation",
    tier: "Routine",
    flavor: "Cogitator units in Production Sector 7 have begun routing resources irregularly. Council analysis suspects degraded logic cores — possibly touched by residual Dissonance patterns. Investigate and contain before the anomaly spreads to adjacent sectors.",
    checks: [
      { stat: "intelligence", difficulty: 30, label: "Analyse the cogitator logs",   flavor: "The processing patterns are fragmented — not random. Something in the logic structure is still making decisions.", isCombat: false },
      { stat: "rangeSkill",   difficulty: 35, label: "Suppress the rogue units",      flavor: "Three cogitator units have rerouted themselves into combat protocols. They do not respond to override commands.", isCombat: true  },
    ],
    xpSuccess: 200,
    xpFailure: 65,
    woundDamageRange: [1, 4],
  },
  {
    id: "traitor_contact",
    name: "Contact Protocol",
    type: "Engagement",
    tier: "Dangerous",
    flavor: "Confirmed traitor activity in the outer administrative quarter. Intelligence suggests a cell of Architect loyalists operating from a decommissioned relay station. They are armed and will not surrender. Three contacts, disposition unknown.",
    checks: [
      { stat: "perception",  difficulty: 30, label: "Sweep the relay perimeter",   flavor: "You move through dead corridors — a structure abandoned so long that the cogitator routing has gone completely dark.", isCombat: false },
      { stat: "meleeSkill",  difficulty: 35, label: "Engage the loyalist cell",    flavor: "They are not fringe operatives. They know how to fight.",                                                                 isCombat: true  },
    ],
    xpSuccess: 250,
    xpFailure: 75,
    woundDamageRange: [1, 4],
  },
  {
    id: "archive_recovery",
    name: "Archive Recovery",
    type: "Retrieval",
    tier: "Dangerous",
    flavor: "A sealed archive vault in the lower administrative district contains records flagged for suppression — historical documentation the Council cannot allow to circulate freely. Dissidents have reached the vault first. Recover or destroy the data cores before they extract them.",
    checks: [
      { stat: "perception",   difficulty: 35, label: "Locate the vault entrance",   flavor: "The structure was sealed deliberately — someone who knew the layout wanted the archive to stay buried.", isCombat: false },
      { stat: "intelligence", difficulty: 30, label: "Assess the data cores",        flavor: "The records are intact. What they contain is not something you were briefed on.",                        isCombat: false },
      { stat: "rangeSkill",   difficulty: 40, label: "Hold the extraction point",   flavor: "The dissidents have backup. They want these records. So do you.",                                        isCombat: true  },
    ],
    xpSuccess: 300,
    xpFailure: 90,
    woundDamageRange: [2, 5],
  },
  {
    id: "psionic_anomaly",
    name: "Psionic Anomaly",
    type: "Investigation",
    tier: "Deadly",
    flavor: "An unsanctioned psionic event has been detected in the outer district. Three city blocks are dark — no signals, no personnel returning. The Senior Overseer has authorised lethal containment. Whatever ignited there, it cannot be allowed to spread. Proceed with extreme caution.",
    checks: [
      { stat: "willpower",   difficulty: 40, label: "Enter the dead zone",          flavor: "The silence is not natural. Your instruments read ambient energy patterns that should not exist.", isCombat: false },
      { stat: "perception",  difficulty: 40, label: "Locate the source",            flavor: "Something in there is still active. It knows you are here.",                                      isCombat: false },
      { stat: "meleeSkill",  difficulty: 50, label: "Contain the event",            flavor: "The Aether does not care about your orders. Neither do the things it has drawn to this place.",  isCombat: true  },
    ],
    xpSuccess: 500,
    xpFailure: 150,
    woundDamageRange: [3, 7],
  },
];
