// ExplorationSystem.jsx — Regional grid exploration UI
// Renders the Phaser exploration grid with a React HUD overlay.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PhaserGame from "../phaser/PhaserGame";
import ExplorationScene from "../phaser/scenes/ExplorationScene";
import { generatePlanetaryNPCs } from "../generation/npcGenerator";
import { mulberry32 } from "../generation/starSystemGenerator";
import { processNPCTick, checkEncounters } from "../systems/npcActionSystem";
import { generateEncounter } from "../enemyData";
import { getRank } from "../missionData";
import {
  threatNarrative,
  clueNarrative,
  investigationNarrative,
  regionEntryNarrative,
  combatStartNarrative,
} from "../generation/narrativeGenerator";

const IMPASSABLE = new Set(["water", "deep", "lava", "crevasse", "installation"]);

export default function ExplorationSystem({ state, dispatch }) {
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [actionLog, setActionLog] = useState([]);

  const planet = state.planet;
  const regionId = state.exploration.currentRegionId;
  const region = planet?.regions?.find((r) => r.id === regionId);
  const playerPos = state.exploration.playerPosition;

  const addLog = (msg) => setActionLog((prev) => [...prev.slice(-19), msg]);
  const prevTierRef = useRef(state.threat.tier);

  // Narrative on threat tier change
  useEffect(() => {
    const prev = prevTierRef.current;
    const curr = state.threat.tier;
    if (prev !== curr) {
      prevTierRef.current = curr;
      const narr = threatNarrative(curr, prev);
      if (narr) addLog(`[THREAT] ${narr}`);
    }
  }, [state.threat.tier]);

  // Narrative on region entry
  useEffect(() => {
    if (region) {
      const narr = regionEntryNarrative(region);
      if (narr) addLog(`[REGION] ${narr}`);
    }
  }, [regionId]);

  // Generate NPCs on first entry if not already generated
  useEffect(() => {
    if (planet && !state.npcs.administrator) {
      const seed = planet.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 3571;
      const generated = generatePlanetaryNPCs(planet, seed, mulberry32);
      dispatch({ type: "SET_NPCS", npcs: generated });
      addLog(`Planetary Administrator ${generated.administrator.name} welcomes you.`);
    }
  }, [planet?.name]);

  // Build the grid state for Phaser
  // Extract numeric region index for NPC filtering
  const regionIndex = regionId ? parseInt((regionId.match(/region_(\d+)/) || [])[1] ?? -1) : -1;

  const gridState = useMemo(() => {
    if (!region) return null;
    return {
      grid: region.grid,
      pois: region.pois,
      playerPosition: playerPos,
      moveRange: 1,
      visionRange: 5,
      revealedTiles: state.exploration.revealedTiles,
      npcs: state.npcs,
      regionIndex,
    };
  }, [region, playerPos, state.exploration.revealedTiles, state.npcs, regionIndex]);

  // Handle grid click — movement
  const handleGridClick = useCallback((x, y) => {
    if (!playerPos || !region) return;

    const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
    if (dist !== 1) return; // 1 tile per action

    // Check passability
    const tile = region.grid[y]?.[x];
    if (!tile) return;
    if (IMPASSABLE.has(tile.terrain)) {
      addLog(`Cannot move there — ${tile.terrain} is impassable.`);
      return;
    }

    // Move player
    dispatch({ type: "MOVE_PLAYER", position: { x, y } });

    // Reveal tiles around new position
    const newRevealed = [];
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 5) {
          newRevealed.push(`${x + dx},${y + dy}`);
        }
      }
    }
    dispatch({ type: "REVEAL_TILES", tiles: newRevealed });

    // Check if adjacent to POI
    const adjacentPOI = region.pois.find((poi) => {
      const pdist = Math.abs(poi.gridX - x) + Math.abs(poi.gridY - y);
      return pdist <= 1 && !poi.investigated;
    });

    if (adjacentPOI) {
      setSelectedPOI(adjacentPOI);
      addLog(`You are near ${adjacentPOI.name}. You may investigate.`);
    } else {
      setSelectedPOI(null);
    }

    // Log movement
    addLog(`Moved to [${x}, ${y}]. Tick ${state.exploration.actionTick + 1}.`);

    // Process NPC actions
    if (state.npcs.administrator) {
      const tick = state.exploration.actionTick + 1;
      const { npcs: updatedNPCs, events } = processNPCTick(
        state.npcs, state.threat.level, { x, y }, regionId, tick
      );
      dispatch({ type: "SET_NPCS", npcs: updatedNPCs });
      for (const evt of events) {
        dispatch({ type: "LOG_EVENT", event: evt });
        if (evt.action === "intel_delivery") {
          addLog(`[INTEL] ${evt.details}`);
        }
      }

      // Check for encounters — use deployed squad
      const squad = state.deployedSquad?.length > 0
        ? state.deployedSquad
        : JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
      const perStat = squad[0]?.stats?.perception || squad[0]?.stats?.Per || 30;
      const encounters = checkEncounters(updatedNPCs, { x, y }, regionId, perStat, tick);
      let combatTriggered = false;
      for (const enc of encounters) {
        if (enc.type === "agent_detected" || enc.type === "squad_detected") {
          addLog(`⚠ CONTACT: ${enc.entity.name || enc.entity.id} detected ${enc.distance} tiles away!`);
        } else if (enc.type === "ambush" || enc.type === "agent_encounter" || enc.type === "leader_ambush") {
          const label = enc.type === "leader_ambush" ? "AMBUSH — SURROUNDED"
            : enc.type === "ambush" ? "AMBUSH"
            : "ENCOUNTER";
          addLog(`⚠ ${label}! ${enc.entity.name} attacks!`);
          const combatNarr = combatStartNarrative(enc.type, enc.entity.name);
          if (combatNarr) addLog(`[NARRATIVE] ${combatNarr}`);
          dispatch({ type: "UPDATE_THREAT", delta: enc.type === "leader_ambush" ? 8 : enc.type === "ambush" ? 5 : 3 });

          // Mark leader ambush as triggered
          if (enc.type === "leader_ambush" && updatedNPCs.loyalistLeader) {
            const leader = { ...updatedNPCs.loyalistLeader };
            leader.ambushesSet = (leader.ambushesSet || []).map(a =>
              a.id === enc.entity.id ? { ...a, triggered: true } : a
            );
            updatedNPCs.loyalistLeader = leader;
            dispatch({ type: "SET_NPCS", npcs: updatedNPCs });
          }

          if (!combatTriggered) {
            combatTriggered = true;
            // Build combat party from deployed squad (up to 8)
            const combatParty = squad.filter(c => c && !c.kia).slice(0, 8);
            if (combatParty.length > 0) {
              // Generate encounter enemies based on squad strength or single agent
              const rank = getRank(combatParty[0]?.xp || 0);
              const enemyCount = enc.entity.strength || 1;
              const fakeMission = { name: "Field Encounter", flavor: "loyalist", type: "investigation", tier: state.threat.level > 60 ? "Deadly" : state.threat.level > 30 ? "Dangerous" : "Routine", rank };
              const combatEncounter = generateEncounter(fakeMission, "LOWER_DISTRICTS", rank);
              // Trim to match squad size
              combatEncounter.enemies = combatEncounter.enemies.slice(0, enemyCount);

              const sourceType = enc.type === "leader_ambush" ? "ambush"
                : enc.type === "ambush" ? "squad"
                : "agent";
              dispatch({
                type: "START_COMBAT",
                context: {
                  encounter: combatEncounter,
                  party: combatParty,
                  sourceEntityId: enc.entity.id,
                  sourceEntityType: sourceType,
                  ambushLayout: enc.ambushLayout || null, // "surround" for leader ambushes
                },
              });
            }
          }
        }
      }

      // Threat escalation — the longer you're here, the more desperate they get
      if (tick % 8 === 0) {
        dispatch({ type: "UPDATE_THREAT", delta: 2 });
      }
    }
  }, [playerPos, region, state.exploration.actionTick, state.npcs, state.threat.level, regionId, dispatch]);

  // Handle investigation
  const handleInvestigate = () => {
    if (!selectedPOI) return;

    // Simple perception + intelligence check (d100 vs stat average)
    const squad = state.deployedSquad?.length > 0
      ? state.deployedSquad
      : JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    const lead = squad[0]; // use prefect/first character's stats
    const per = lead?.stats?.perception || lead?.stats?.Per || 30;
    const int = lead?.stats?.intelligence || lead?.stats?.Int || 30;
    const target = Math.floor((per + int) / 2);
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= target;

    if (success) {
      // Generate a clue
      const clue = generateClue(planet, region, selectedPOI);
      dispatch({ type: "ADD_CLUE", clue });
      dispatch({ type: "UPDATE_THREAT", delta: 3 });
      addLog(`INVESTIGATION SUCCESS (rolled ${roll} vs ${target}): ${clue.text}`);
      const narr = investigationNarrative(true, selectedPOI.name);
      if (narr) addLog(`[NARRATIVE] ${narr}`);
      const clueNarr = clueNarrative(clue, state.exploration.discoveredClues.length + 1);
      if (clueNarr) addLog(`[NARRATIVE] ${clueNarr}`);

      // Mark POI as investigated and potentially spawn new POIs from intel
      const totalClues = state.exploration.discoveredClues.length + 1;
      const updatedRegions = planet.regions.map((r) => {
        if (r.id !== regionId) return r;
        const updatedPois = r.pois.map((p) =>
          p.id === selectedPOI.id ? { ...p, investigated: true } : p
        );
        // Every 2 clues, a new POI is revealed in this region from the intelligence
        if (totalClues % 2 === 0) {
          const newPOI = generateIntelPOI(r, totalClues, updatedPois);
          if (newPOI) {
            updatedPois.push(newPOI);
            addLog(`[INTEL] New location identified: ${newPOI.name} at [${newPOI.gridX}, ${newPOI.gridY}]`);
          }
        }
        return { ...r, pois: updatedPois };
      });
      // Also occasionally reveal a POI in another region
      if (totalClues % 3 === 0 && planet.regions.length > 1) {
        const otherRegions = planet.regions.filter((r) => r.id !== regionId);
        const targetRegion = otherRegions[Math.floor(Math.random() * otherRegions.length)];
        const rIdx = updatedRegions.findIndex((r) => r.id === targetRegion.id);
        if (rIdx >= 0) {
          const newPOI = generateIntelPOI(updatedRegions[rIdx], totalClues, updatedRegions[rIdx].pois);
          if (newPOI) {
            updatedRegions[rIdx] = { ...updatedRegions[rIdx], pois: [...updatedRegions[rIdx].pois, newPOI] };
            addLog(`[INTEL] Cross-region lead: ${newPOI.name} located in ${targetRegion.name}`);
          }
        }
      }
      dispatch({
        type: "UPDATE_PLANET",
        planet: { ...planet, regions: updatedRegions },
      });
      setSelectedPOI(null);
    } else {
      dispatch({ type: "UPDATE_THREAT", delta: selectedPOI.compromised ? 1 : 0 });
      addLog(`INVESTIGATION FAILED (rolled ${roll} vs ${target}). No clue found.`);
      const failNarr = investigationNarrative(false, selectedPOI.name);
      if (failNarr) addLog(`[NARRATIVE] ${failNarr}`);
      setSelectedPOI(null);
    }

    // Advance tick
    dispatch({ type: "MOVE_PLAYER", position: playerPos }); // tick advance without moving
  };

  if (!region) {
    return (
      <div style={{ minHeight: "100vh", background: "#06080f", color: "#8ab4d4",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        No region selected.
      </div>
    );
  }

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#06080f",
      display: "flex", flexDirection: "column",
      fontFamily: "'Cinzel', serif", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        .exploration-body { display: flex; flex: 1; overflow: hidden; }
        .exploration-grid { flex: 0 0 620px; display: flex; align-items: center; justify-content: center; padding: 10px; }
        .exploration-panel { flex: 1; border-left: 1px solid #1e3d5c; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 20px", borderBottom: "1px solid #1e3d5c", flexShrink: 0,
      }}>
        <div>
          <span style={{ color: "#c8a84a", letterSpacing: 4, fontSize: 12 }}>
            {region.name.toUpperCase()}
          </span>
          <span style={{ color: "#1e4a7a", letterSpacing: 3, fontSize: 10, marginLeft: 12 }}>
            — {region.subBiome.toUpperCase()} —
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => dispatch({ type: "BACK_TO_PLANET" })} style={{
            background: "transparent", border: "1px solid #1e3d5c",
            color: "#2e5a82", fontFamily: "'Cinzel', serif",
            fontSize: 9, letterSpacing: 3, padding: "5px 12px",
            cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a84a"; e.currentTarget.style.color = "#c8a84a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3d5c"; e.currentTarget.style.color = "#2e5a82"; }}
          >
            ← CHANGE REGION
          </button>
        </div>
      </div>

      <div className="exploration-body">
        {/* Phaser grid */}
        <div className="exploration-grid">
          <PhaserGame
            gridState={gridState}
            onGridClick={handleGridClick}
            sceneClass={ExplorationScene}
            updateEvent="exploration-update"
            clickEvent="exploration-click"
          />
        </div>

        {/* Right panel — HUD */}
        <div className="exploration-panel">
          {/* Region info */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
              paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
              Region Status
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 10,
              fontFamily: "'Share Tech Mono', monospace", color: "#4a8aaa" }}>
              <span>Tick: {state.exploration.actionTick}</span>
              <span>Pos: [{playerPos?.x}, {playerPos?.y}]</span>
              <span>POIs: {region.pois.filter((p) => p.investigated).length}/{region.pois.length}</span>
            </div>
          </div>

          {/* Deployed Squad */}
          {state.deployedSquad?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
                paddingBottom: 4, marginBottom: 6, textTransform: "uppercase" }}>
                Squad ({state.deployedSquad.length})
              </div>
              {state.deployedSquad.filter(c => !c.kia).map((char, i) => {
                const isPrefect = char.isPrefect || (char.class || "").includes("Prefect");
                return (
                  <div key={char.id || i} style={{
                    display: "flex", justifyContent: "space-between", padding: "2px 0",
                    fontSize: 9, fontFamily: "'Share Tech Mono', monospace",
                    borderBottom: "1px solid #0c1824",
                  }}>
                    <span style={{ color: isPrefect ? "#c8a84a" : "#4a8aaa" }}>
                      {char.name}{isPrefect ? " ★" : ""}
                    </span>
                    <span style={{ color: "#2e5a82" }}>
                      {char.role || char.class}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Threat meter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
              paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
              Threat Level
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                flex: 1, height: 8, background: "#0c1824", border: "1px solid #1e3d5c",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  width: `${state.threat.level}%`, height: "100%",
                  background: state.threat.level > 80 ? "#c05050"
                    : state.threat.level > 60 ? "#c08040"
                    : state.threat.level > 40 ? "#c0a040"
                    : state.threat.level > 20 ? "#80a050"
                    : "#408050",
                  transition: "width 0.3s",
                }} />
              </div>
              <span style={{ fontSize: 10, color: "#2e5a82",
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, whiteSpace: "nowrap" }}>
                {state.threat.tier.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Enemy Intel — manpower and forces */}
          {state.npcs.loyalistLeader?.alive && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
                paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
                Enemy Forces
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace", color: "#4a8aaa" }}>
                <span>Manpower: {Math.max(0, (state.npcs.loyalistLeader.manpower || 100) - (state.npcs.loyalistLeader.manpowerUsed || 0))} / {state.npcs.loyalistLeader.manpower || 100}</span>
                <span>Active Squads: {(state.npcs.squads || []).filter(s => s.alive).length}</span>
                <span>Active Agents: {(state.npcs.agents || []).filter(a => a.alive).length}</span>
                <span>Ambushes Set: {(state.npcs.loyalistLeader.ambushesSet || []).filter(a => !a.triggered).length}</span>
              </div>
            </div>
          )}

          {/* Investigation prompt */}
          {selectedPOI && (
            <div style={{ marginBottom: 12, border: "1px solid #1e4a7a",
              background: "rgba(30,74,122,0.15)", padding: "10px" }}>
              <div style={{ fontSize: 11, color: "#c8a84a", fontFamily: "'Cinzel', serif",
                marginBottom: 4 }}>
                {selectedPOI.name}
              </div>
              <div style={{ fontSize: 10, color: "#2e5a82",
                fontFamily: "'Share Tech Mono', monospace", marginBottom: 8 }}>
                {selectedPOI.type.replace(/_/g, " ").toUpperCase()}
              </div>
              <button onClick={handleInvestigate} style={{
                display: "block", width: "100%",
                background: "linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%)",
                border: "1px solid #c8a84a", color: "#c8a84a",
                fontFamily: "'Cinzel', serif", fontSize: 10,
                letterSpacing: 2, padding: "8px", cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e8d090"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#c8a84a"; }}
              >
                ⬡ INVESTIGATE
              </button>
            </div>
          )}

          {/* Clues */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
              paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
              Intelligence ({state.exploration.discoveredClues.length})
            </div>
            {state.exploration.discoveredClues.length === 0 ? (
              <div style={{ fontSize: 10, color: "#1e3d5c",
                fontFamily: "'Share Tech Mono', monospace" }}>
                No intelligence gathered.
              </div>
            ) : (
              state.exploration.discoveredClues.slice(-5).reverse().map((clue, i) => (
                <div key={i} style={{
                  borderLeft: "2px solid #1e4a7a", paddingLeft: 8,
                  marginBottom: 6, fontSize: 10, color: "#6a90b0", lineHeight: 1.5,
                }}>
                  {clue.text}
                </div>
              ))
            )}
          </div>

          {/* Action log */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
              paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
              Action Log
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {actionLog.slice().reverse().map((msg, i) => (
                <div key={i} style={{
                  fontSize: 9, color: i === 0 ? "#8ab4d4" : "#2e5a82",
                  fontFamily: "'Share Tech Mono', monospace",
                  marginBottom: 3, lineHeight: 1.4,
                }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Intel-driven POI generation ──────────────────────────────────────────────
const INTEL_POI_TYPES = [
  "dead_drop", "safehouse", "arms_cache", "comm_relay", "informant_meeting",
  "surveillance_post", "supply_depot", "loyalist_shrine", "hidden_bunker",
];
const INTEL_POI_NAMES = [
  "Signal Source", "Dead Drop", "Hidden Cache", "Relay Node",
  "Informant Contact", "Observation Post", "Supply Dump", "Shrine of the Old Order",
  "Underground Bunker", "Encrypted Terminal", "Smuggler's Den", "Abandoned Safehouse",
  "Weapon Stash", "Cell Meeting Point", "Data Vault",
];

function generateIntelPOI(region, clueCount, existingPois) {
  const occupied = new Set(existingPois.map((p) => `${p.gridX},${p.gridY}`));
  // Try to place the POI on a valid, unoccupied tile
  for (let attempt = 0; attempt < 30; attempt++) {
    const gx = 2 + Math.floor(Math.random() * 16);
    const gy = 2 + Math.floor(Math.random() * 16);
    const key = `${gx},${gy}`;
    if (occupied.has(key)) continue;
    const tile = region.grid?.[gy]?.[gx];
    if (!tile || ["water", "deep", "lava", "crevasse"].includes(tile.terrain)) continue;

    const suffix = String.fromCharCode(65 + (clueCount % 26)) + (Math.floor(clueCount / 26) || "");
    return {
      id: `intel_poi_${region.id}_${clueCount}_${Date.now()}`,
      name: `${INTEL_POI_NAMES[Math.floor(Math.random() * INTEL_POI_NAMES.length)]} ${suffix}`,
      type: INTEL_POI_TYPES[Math.floor(Math.random() * INTEL_POI_TYPES.length)],
      gridX: gx,
      gridY: gy,
      investigated: false,
      compromised: Math.random() < 0.3 + clueCount * 0.05, // more compromised as intel grows
    };
  }
  return null; // couldn't place
}

// ── Clue generation ─────────────────────────────────────────────────────────
function generateClue(planet, region, poi) {
  const templates = [
    `Encrypted comm traffic detected near ${poi.name}. Signal origin traces to another region.`,
    `Supply manifests show unregistered cargo drops at grid coordinates near ${region.name}.`,
    `A worker reports seeing armed figures near ${poi.name} during off-hours.`,
    `Decoded transmissions reference a "safehouse" in the ${planet.regions[Math.floor(Math.random() * planet.regions.length)].name} region.`,
    `Surveillance logs from ${poi.name} show regular unauthorized access patterns.`,
    `An informant claims Loyalist operatives are using ${poi.name} as a dead drop.`,
    `Energy consumption anomalies at ${poi.name} suggest hidden subsurface activity.`,
    `Communication intercepts mention a "Commander" directing operations from a hidden base.`,
  ];

  return {
    text: templates[Math.floor(Math.random() * templates.length)],
    source: poi.name,
    region: region.id,
    tick: 0,
  };
}
