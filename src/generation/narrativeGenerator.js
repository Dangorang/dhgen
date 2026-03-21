// narrativeGenerator.js — Procedural narrative text for campaign events
// Returns flavour strings for key moments in the investigation loop.

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Arrival on planet ────────────────────────────────────────────────────────
export function arrivalNarrative(planet) {
  const biome = planet.biome || "temperate";
  const name = planet.name || "this world";

  const openers = [
    `The shuttle breaks atmosphere over ${name}. Sensor feeds flood with data — population density, energy signatures, comm traffic.`,
    `Descent through ${name}'s upper atmosphere reveals a world that has known the Council's order for generations. Whether it still does remains to be seen.`,
    `Landing thrusters fire as the shuttle touches down on ${name}. The air tastes of ${biome === "arid" ? "dust and ozone" : biome === "frozen" ? "frost and recycled heat" : biome === "volcanic" ? "sulphur and ash" : biome === "ocean" ? "salt and machine oil" : biome === "jungle" ? "humidity and rot" : "industry and rain"}.`,
    `${name} stretches beneath the viewport — a world with secrets buried under every district and data-slab. Your mandate is clear: find the Loyalist cell.`,
  ];

  const briefings = [
    `The Planetary Administrator has been informed of your arrival. Cooperation is expected, though not guaranteed.`,
    `Intelligence suggests Loyalist operatives have embedded themselves within the population. Their command structure remains unknown.`,
    `Council records show a pattern of disrupted communications and missing supply manifests. Someone is operating in the shadows.`,
    `Your cover is thin. Move carefully — the cell will be watching for investigators.`,
  ];

  return `${pick(openers)}\n\n${pick(briefings)}`;
}

// ── Clue discovery ───────────────────────────────────────────────────────────
export function clueNarrative(clue, totalClues) {
  if (totalClues <= 1) {
    return pick([
      "A thread to pull. The investigation has begun in earnest.",
      "First evidence secured. The picture is still fragmentary.",
      "One data point among many yet to be found. But it's a start.",
    ]);
  }
  if (totalClues <= 3) {
    return pick([
      "The pieces are starting to connect. A pattern emerges.",
      "Another fragment of the truth. The cell's outline grows clearer.",
      "Cross-referencing this with prior intel narrows the search.",
    ]);
  }
  if (totalClues <= 5) {
    return pick([
      "The net is closing. The cell can feel it — their movements are becoming erratic.",
      "Enough evidence to act. But the Commander's location remains elusive.",
      "The intelligence picture is nearly complete. One more lead could break this open.",
    ]);
  }
  return pick([
    "Overwhelming evidence. The cell's hierarchy is laid bare.",
    "There is nowhere left to hide. The Commander's position is triangulated.",
    "The investigation concludes. All that remains is the confrontation.",
  ]);
}

// ── Threat escalation ────────────────────────────────────────────────────────
export function threatNarrative(tier, previousTier) {
  if (tier === previousTier) return null;

  const escalations = {
    Cautious: [
      "Whispers in the comm-channels. Someone has noticed your presence.",
      "A surveillance drone adjusts its pattern. Coincidence — or response?",
      "Local enforcers report an uptick in encrypted traffic. The cell is stirring.",
    ],
    Alerted: [
      "Armed figures spotted in the periphery. The cell knows you're here.",
      "An informant goes silent mid-transmission. They've been compromised.",
      "Patrol routes have changed. The Loyalists are adapting to your movements.",
    ],
    Threatened: [
      "A dead drop contains a message: 'Leave or die.' The cell has escalated.",
      "Reports of armed squads moving through back corridors. They're hunting you.",
      "The Administrator's security detail has doubled. Everyone feels the tension.",
    ],
    Critical: [
      "Explosions in the outer districts. The cell is scorching the earth.",
      "Emergency broadcasts crackle across all channels. The situation is critical.",
      "The Loyalist Commander has been sighted rallying their forces. The endgame approaches.",
    ],
  };

  const deescalations = {
    Unaware: [
      "The tension eases. For now, the cell believes the threat has passed.",
    ],
    Cautious: [
      "Activity levels are dropping. Your discretion is paying off.",
    ],
    Alerted: [
      "The immediate danger has lessened, but the cell remains on guard.",
    ],
    Threatened: [
      "Hostile activity has pulled back slightly, though the cell is far from calm.",
    ],
  };

  const tierOrder = ["Unaware", "Cautious", "Alerted", "Threatened", "Critical"];
  const oldIdx = tierOrder.indexOf(previousTier);
  const newIdx = tierOrder.indexOf(tier);

  if (newIdx > oldIdx && escalations[tier]) {
    return pick(escalations[tier]);
  }
  if (newIdx < oldIdx && deescalations[tier]) {
    return pick(deescalations[tier]);
  }
  return null;
}

// ── Combat start ─────────────────────────────────────────────────────────────
export function combatStartNarrative(encounterType, entityName) {
  if (encounterType === "leader_ambush") {
    return pick([
      `It's a trap! ${entityName} emerge from all directions — you're surrounded!`,
      `The ground shakes as ${entityName} close in from every side! The Commander planned this!`,
      `Hostiles on all flanks! ${entityName} has you encircled — fight your way out!`,
      `"Cut them off!" — The Commander's ambush snaps shut. Enemies on all sides!`,
    ]);
  }
  if (encounterType === "ambush") {
    return pick([
      `${entityName} springs from concealment! Weapons hot — no time to think!`,
      `Gunfire erupts without warning! ${entityName} had you pinned from the start!`,
      `The ambush is sprung. ${entityName} opens fire from prepared positions!`,
    ]);
  }
  return pick([
    `You round the corner and come face-to-face with ${entityName}. Combat is inevitable.`,
    `${entityName} spots you and reaches for weapons. The moment of contact has arrived.`,
    `No more shadows. ${entityName} steps into the open, weapons raised.`,
  ]);
}

// ── Combat end ───────────────────────────────────────────────────────────────
export function combatEndNarrative(victory, partyWounds) {
  if (victory && partyWounds === 0) {
    return pick([
      "A clean engagement. No casualties. The cell will think twice before engaging again.",
      "Hostiles neutralised without loss. Textbook fieldwork.",
    ]);
  }
  if (victory) {
    return pick([
      "The firefight is over. Wounds need tending, but the mission continues.",
      "Victory — though not without cost. The medkit sees heavy use.",
      "Hostiles down. Your team regroups, battered but functional.",
    ]);
  }
  return pick([
    "A tactical withdrawal. Sometimes survival is its own victory.",
    "Fall back! The engagement was untenable. Regroup and reassess.",
    "The team disengages under fire. A costly lesson in enemy capability.",
  ]);
}

// ── Region entry ─────────────────────────────────────────────────────────────
export function regionEntryNarrative(region) {
  const subBiome = region.subBiome || "unknown terrain";
  const name = region.name || "this region";
  return pick([
    `You enter ${name}. The landscape shifts to ${subBiome}. New threats, new opportunities.`,
    `${name} lies ahead — ${subBiome} as far as sensors can read. Proceed with caution.`,
    `Crossing into ${name}. The ${subBiome} terrain will require careful navigation.`,
    `${name}. Auspex readings show scattered energy signatures across the ${subBiome}.`,
  ]);
}

// ── Investigation success/failure ────────────────────────────────────────────
export function investigationNarrative(success, poiName) {
  if (success) {
    return pick([
      `The data-cores at ${poiName} yield results. Cross-referencing with existing intelligence...`,
      `${poiName} delivers. A new lead — encrypted, but your cogitator handles the rest.`,
      `Hours of careful work at ${poiName} pay off. Another piece of the puzzle secured.`,
    ]);
  }
  return pick([
    `${poiName} yields nothing of value. The data has been scrubbed — or was never there.`,
    `A dead end at ${poiName}. The cell's counter-intelligence is thorough.`,
    `The search at ${poiName} comes up empty. Time wasted, but at least you weren't detected.`,
  ]);
}
