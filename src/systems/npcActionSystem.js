// npcActionSystem.js — Hidden NPC action processing per tick
// Each time the player acts, all NPCs on the planet also act.
// NPCs grow increasingly desperate the longer the player is on-planet.

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Desperation scaling — time on planet makes enemies more aggressive ───────
function getDesperation(tick) {
  // 0-10: calm, 11-25: uneasy, 26-50: aggressive, 51+: frantic
  if (tick <= 10) return 0;
  if (tick <= 25) return 1;
  if (tick <= 50) return 2;
  return 3;
}

// ── Move toward target ──────────────────────────────────────────────────────
function moveToward(from, to, steps = 1) {
  let { gridX, gridY } = from;
  for (let i = 0; i < steps; i++) {
    const dx = Math.sign(to.gridX - gridX);
    const dy = Math.sign(to.gridY - gridY);
    gridX = clamp(gridX + dx, 0, 19);
    gridY = clamp(gridY + dy, 0, 19);
  }
  return { gridX, gridY };
}

// ── Random patrol movement ──────────────────────────────────────────────────
function randomMove(loc) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[0,0],[0,0]]; // 33% chance stay put
  const [dx, dy] = dirs[randInt(0, dirs.length - 1)];
  return {
    gridX: clamp(loc.gridX + dx, 1, 18),
    gridY: clamp(loc.gridY + dy, 1, 18),
  };
}

// ── Aggressive patrol — biased toward player's region ────────────────────────
function aggressiveMove(loc, playerPos) {
  // 60% move toward player, 40% random
  if (Math.random() < 0.6) {
    return moveToward(loc, { gridX: playerPos.x, gridY: playerPos.y });
  }
  return randomMove(loc);
}

// ── Process one tick of NPC actions ─────────────────────────────────────────
export function processNPCTick(npcs, threatLevel, playerPos, currentRegionId, tick) {
  const events = [];
  const updatedNPCs = { ...npcs };
  const desperation = getDesperation(tick);
  const regionIdx = getRegionIndex(currentRegionId);

  // ── Administrator intel delivery ────────────────────────────────────────
  if (npcs.administrator?.alive) {
    const admin = { ...npcs.administrator };
    if (admin.intelCooldown <= 0) {
      // Intel comes faster as desperation rises
      const interval = desperation >= 2 ? 5 : desperation >= 1 ? 8 : 12;
      if (tick > 0 && tick % interval === 0) {
        events.push({
          actor: admin.name,
          action: "intel_delivery",
          details: generateAdminIntel(npcs, threatLevel, desperation),
          region: "Capital",
        });
        admin.intelCooldown = interval;
      }
    } else {
      admin.intelCooldown--;
    }
    updatedNPCs.administrator = admin;
  }

  // ── Loyalist Leader actions ─────────────────────────────────────────────
  if (npcs.loyalistLeader?.alive) {
    const leader = { ...npcs.loyalistLeader };
    const loc = { ...leader.location };
    const inSameRegion = loc.regionIndex === regionIdx;
    const manpowerRemaining = (leader.manpower || 100) - (leader.manpowerUsed || 0);

    // Leader moves each tick (patrol or flee)
    if (threatLevel >= 70 || desperation >= 3) {
      // Desperate: flee if in same region
      if (inSameRegion) {
        const newPos = moveToward(loc, { gridX: 19, gridY: 0 }, 2);
        loc.gridX = newPos.gridX;
        loc.gridY = newPos.gridY;
        events.push({
          actor: leader.name,
          action: "flee_attempt",
          details: "The Commander is desperately trying to evacuate! All units converging!",
          region: `Region ${loc.regionIndex}`,
        });
      } else {
        // Flee to a random edge
        const newPos = moveToward(loc, { gridX: randInt(0, 19), gridY: 0 }, 2);
        loc.gridX = newPos.gridX;
        loc.gridY = newPos.gridY;
        events.push({
          actor: leader.name,
          action: "rally_all",
          details: "The Commander has ordered all units to converge on the investigator — kill on sight!",
          region: `Region ${loc.regionIndex}`,
        });
      }
    } else {
      // Move around (patrol/reposition)
      const newPos = randomMove(loc);
      loc.gridX = newPos.gridX;
      loc.gridY = newPos.gridY;
    }

    // ── Spawn squads from manpower pool ──────────────────────────────────
    // Leader commits forces based on desperation and threat
    const spawnThreshold = desperation >= 3 ? 3 : desperation >= 2 ? 6 : desperation >= 1 ? 12 : 20;
    if (manpowerRemaining >= 3 && tick > 0 && tick % spawnThreshold === 0) {
      // Squad size scales with desperation
      const squadSize = desperation >= 3 ? randInt(5, 8) : desperation >= 2 ? randInt(4, 6) : randInt(3, 5);
      const actualSize = Math.min(squadSize, manpowerRemaining);

      if (actualSize >= 3) {
        const spawnRegion = inSameRegion ? regionIdx : loc.regionIndex;
        const newSquad = {
          id: `squad_spawned_${tick}_${Math.floor(Math.random() * 100000)}`,
          name: `Loyalist Kill-Team ${String.fromCharCode(65 + (updatedNPCs.squads?.length || 0))}`,
          mode: desperation >= 2 ? "hunt" : "patrol",
          strength: actualSize,
          location: {
            regionIndex: spawnRegion,
            gridX: clamp(loc.gridX + randInt(-3, 3), 1, 18),
            gridY: clamp(loc.gridY + randInt(-3, 3), 1, 18),
          },
          hidden: true,
          alive: true,
          targetLocation: null,
        };

        if (!updatedNPCs.squads) updatedNPCs.squads = [];
        updatedNPCs.squads = [...updatedNPCs.squads, newSquad];
        leader.manpowerUsed = (leader.manpowerUsed || 0) + actualSize;

        events.push({
          actor: leader.name,
          action: "spawn_squad",
          details: desperation >= 2
            ? `Leader is panicking — deploying ${actualSize}-strong kill-team! (${manpowerRemaining - actualSize} reserves remain)`
            : `Leader deployed ${newSquad.name} (${actualSize} strong). ${manpowerRemaining - actualSize} reserves remain.`,
          region: `Region ${spawnRegion}`,
        });
      }
    }

    // ── Set ambushes along movement path ────────────────────────────────
    // Leader periodically plants ambushes at his current position
    const ambushInterval = desperation >= 3 ? 4 : desperation >= 2 ? 8 : desperation >= 1 ? 15 : 25;
    const ambushCost = desperation >= 2 ? randInt(4, 7) : randInt(2, 4);
    if (manpowerRemaining >= ambushCost && tick > 0 && tick % ambushInterval === 0) {
      const ambush = {
        id: `ambush_${tick}_${Math.floor(Math.random() * 100000)}`,
        regionIndex: loc.regionIndex,
        gridX: loc.gridX,
        gridY: loc.gridY,
        strength: ambushCost,
        tick: tick,
        triggered: false,
      };

      if (!leader.ambushesSet) leader.ambushesSet = [];
      leader.ambushesSet = [...leader.ambushesSet, ambush];
      leader.manpowerUsed = (leader.manpowerUsed || 0) + ambushCost;

      events.push({
        actor: leader.name,
        action: "set_ambush",
        details: `The Commander has set a ${ambushCost}-strong ambush at a strategic position. (${manpowerRemaining - ambushCost} reserves remain)`,
        region: `Region ${loc.regionIndex}`,
      });
    }

    leader.location = loc;
    updatedNPCs.loyalistLeader = leader;
  }

  // ── Agent actions ───────────────────────────────────────────────────────
  const updatedAgents = npcs.agents.map((agent) => {
    if (!agent.alive) return agent;
    const a = { ...agent, location: { ...agent.location } };
    const inSameRegion = a.location.regionIndex === regionIdx;

    // Desperation lowers the threat threshold for hunting
    const huntThreshold = Math.max(0, 20 - desperation * 8); // 20 → 12 → 4 → 0

    if (inSameRegion && (threatLevel >= huntThreshold || desperation >= 2)) {
      // All agent types become hunters as desperation rises
      if (a.specialty === "combat" || a.specialty === "infiltration" || desperation >= 2) {
        const steps = desperation >= 3 ? 2 : 1; // frantic agents move faster
        const newPos = moveToward(a.location, { gridX: playerPos.x, gridY: playerPos.y }, steps);
        a.location.gridX = newPos.gridX;
        a.location.gridY = newPos.gridY;
        events.push({
          actor: a.name,
          action: "hunting",
          details: desperation >= 3
            ? `Agent ${a.name} is charging recklessly toward the investigator!`
            : desperation >= 2
            ? `Agent ${a.name} (${a.specialty}) aggressively closing in!`
            : `Agent ${a.name} (${a.specialty}) moving toward investigator.`,
          region: `Region ${a.location.regionIndex}`,
        });
      } else {
        const newPos = aggressiveMove(a.location, playerPos);
        a.location.gridX = newPos.gridX;
        a.location.gridY = newPos.gridY;
      }
    } else if (desperation >= 1) {
      // Even out-of-region agents start moving toward player's region
      const newPos = aggressiveMove(a.location, playerPos);
      a.location.gridX = newPos.gridX;
      a.location.gridY = newPos.gridY;
    } else {
      const newPos = randomMove(a.location);
      a.location.gridX = newPos.gridX;
      a.location.gridY = newPos.gridY;
    }

    return a;
  });
  updatedNPCs.agents = updatedAgents;

  // ── Squad actions ───────────────────────────────────────────────────────
  const updatedSquads = npcs.squads.map((squad) => {
    if (!squad.alive) return squad;
    const s = { ...squad, location: { ...squad.location } };
    const inSameRegion = s.location.regionIndex === regionIdx;

    // Squads become hunters earlier as desperation rises
    const huntThreshold = Math.max(0, 30 - desperation * 10); // 30 → 20 → 10 → 0
    if (threatLevel >= huntThreshold || desperation >= 2) s.mode = "hunt";
    else if (desperation >= 1) s.mode = inSameRegion ? "hunt" : "patrol";
    else s.mode = "patrol";

    if (s.mode === "hunt") {
      if (inSameRegion) {
        const steps = desperation >= 3 ? 2 : 1;
        const newPos = moveToward(s.location, { gridX: playerPos.x, gridY: playerPos.y }, steps);
        s.location.gridX = newPos.gridX;
        s.location.gridY = newPos.gridY;
        events.push({
          actor: s.name,
          action: "hunting",
          details: desperation >= 3
            ? `${s.name} is sprinting toward the investigator — weapons hot!`
            : `${s.name} hunting toward [${playerPos.x}, ${playerPos.y}].`,
          region: `Region ${s.location.regionIndex}`,
        });
      } else {
        // Out-of-region squads move toward player's region
        const newPos = aggressiveMove(s.location, playerPos);
        s.location.gridX = newPos.gridX;
        s.location.gridY = newPos.gridY;
      }
    } else {
      const newPos = randomMove(s.location);
      s.location.gridX = newPos.gridX;
      s.location.gridY = newPos.gridY;
    }

    return s;
  });
  updatedNPCs.squads = updatedSquads;

  return { npcs: updatedNPCs, events };
}

// ── Admin intel generation ──────────────────────────────────────────────────
function generateAdminIntel(npcs, threatLevel, desperation) {
  const templates = [
    "Surveillance detected unusual activity in the outer regions. Recommend investigation.",
    "Loyalist propaganda material found in worker quarters. Source unknown.",
    "Supply chain irregularities suggest covert resupply operations.",
    "An informant reports clandestine meetings near industrial installations.",
    "Communication intercepts suggest the cell has a command structure nearby.",
    "Local enforcement reports increased resistance to Council authority.",
  ];
  if (desperation >= 1) {
    templates.push(
      "WARNING: Armed groups spotted. Exercise extreme caution.",
      "Security forces report hostile encounters. Recommending military support.",
      "Enemy patrols are increasing in frequency — they know you're close.",
    );
  }
  if (desperation >= 2) {
    templates.push(
      "URGENT: Multiple hostile squads converging on your position!",
      "The cell is mobilising everything. They're getting desperate.",
      "Intercepted panic transmissions — the Loyalists are afraid. Press the advantage!",
    );
  }
  if (desperation >= 3) {
    templates.push(
      "CRITICAL: The Commander has ordered scorched-earth protocols! Move NOW!",
      "Enemy forces are in full panic. Expect reckless, suicidal attacks!",
      "All Loyalist assets are converging. This is the endgame.",
    );
  }
  return templates[Math.floor(Math.random() * templates.length)];
}

function getRegionIndex(regionId) {
  if (!regionId) return -1;
  const match = regionId.match(/region_(\d+)/);
  return match ? parseInt(match[1]) : -1;
}

// ── Check for encounters (proximity detection) ──────────────────────────────
export function checkEncounters(npcs, playerPos, currentRegionId, perceptionStat, tick) {
  const regionIdx = getRegionIndex(currentRegionId);
  const encounters = [];
  const desperation = getDesperation(tick || 0);
  // Detection range increases with desperation (enemies are louder/sloppier)
  const detectionRange = 3 + desperation;

  // Check agents
  for (const agent of npcs.agents) {
    if (!agent.alive || !agent.hidden) continue;
    if (agent.location.regionIndex !== regionIdx) continue;

    const dist = Math.abs(agent.location.gridX - playerPos.x) + Math.abs(agent.location.gridY - playerPos.y);

    if (dist === 0) {
      encounters.push({ type: "agent_encounter", entity: agent, surprise: true });
    } else if (dist <= detectionRange) {
      const dc = dist === 1 ? 5 : dist === 2 ? 10 : 15;
      const roll = Math.floor(Math.random() * 20) + 1;
      const bonus = Math.floor((perceptionStat - 30) / 5) + desperation; // desperation = sloppy
      if (roll + bonus >= dc) {
        encounters.push({ type: "agent_detected", entity: agent, distance: dist });
      }
    }
  }

  // Check squads
  for (const squad of npcs.squads) {
    if (!squad.alive || !squad.hidden) continue;
    if (squad.location.regionIndex !== regionIdx) continue;

    const dist = Math.abs(squad.location.gridX - playerPos.x) + Math.abs(squad.location.gridY - playerPos.y);

    if (dist === 0) {
      encounters.push({ type: "ambush", entity: squad, surprise: true });
    } else if (dist <= detectionRange) {
      const dc = dist === 1 ? 5 : dist === 2 ? 10 : 15;
      const roll = Math.floor(Math.random() * 20) + 1;
      const bonus = Math.floor((perceptionStat - 30) / 5) + desperation;
      if (roll + bonus >= dc) {
        encounters.push({ type: "squad_detected", entity: squad, distance: dist });
      }
    }
  }

  // Check leader-placed ambushes
  if (npcs.loyalistLeader?.alive && npcs.loyalistLeader.ambushesSet) {
    for (const ambush of npcs.loyalistLeader.ambushesSet) {
      if (ambush.triggered) continue;
      if (ambush.regionIndex !== regionIdx) continue;

      const dist = Math.abs(ambush.gridX - playerPos.x) + Math.abs(ambush.gridY - playerPos.y);

      if (dist <= 1) {
        // Ambush triggered — player walked into or adjacent to it
        encounters.push({
          type: "leader_ambush",
          entity: {
            id: ambush.id,
            name: `Loyalist Ambush Force`,
            strength: ambush.strength,
            alive: true,
            hidden: true,
            location: { regionIndex: ambush.regionIndex, gridX: ambush.gridX, gridY: ambush.gridY },
          },
          surprise: true,
          ambushLayout: "surround", // signals encirclement positioning
        });
      }
    }
  }

  return encounters;
}
