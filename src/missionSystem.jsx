import { useState, useRef, useEffect } from "react";
import { MISSIONS, INJURY_TABLE, getRank } from "./missionData";
import { generateEncounter, getEnvironmentFromMission } from "./enemyData";
import { getWeaponById } from "./weaponData";
import PhaserGame from "./phaser/PhaserGame.jsx";
import { eventBridge } from "./phaser/EventBridge.js";

const TIER_COLOR = {
  Routine:   "#6a8060",
  Dangerous: "#a07030",
  Deadly:    "#a03030",
};

const TIER_ORDER = { Routine: 0, Dangerous: 1, Deadly: 2 };

function d100() { return Math.floor(Math.random() * 100) + 1; }
function d6()   { return Math.floor(Math.random() * 6) + 1; }

// ── Combat helpers ────────────────────────────────────────────
function rollDamageDice(damageStr, psyRating = 0) {
  const str = (damageStr || '1d5').replace('PsyRating', String(psyRating));
  const match = str.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return parseInt(str) || 1;
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const bonus = match[3] ? parseInt(match[3]) : 0;
  let total = bonus;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return Math.max(0, total);
}

function hitLocation(roll) {
  // Reverse the digits of the d100 roll to get hit location
  const norm = roll % 100; // 100 → 0
  const rev = parseInt(String(norm).padStart(2, '0').split('').reverse().join(''), 10);
  const loc = norm === 0 ? 100 : rev; // roll 100 (i.e. 00) reversed → Left Leg
  if (loc <= 10) return 'Head';
  if (loc <= 20) return 'Right Arm';
  if (loc <= 30) return 'Left Arm';
  if (loc <= 70) return 'Body';
  if (loc <= 85) return 'Right Leg';
  return 'Left Leg';
}

function getStrBonus(strength) { return Math.floor((strength || 10) / 10); }

// ── Dodge tier helpers ─────────────────────────────────────────────────────
// Party members: Adept = Precognition (AGI+PER+PSY), Veteran = Trained (AGI), else Base (AGI/2)
function getCharDodgeTarget(char) {
  const agi = char.stats?.agility    || 20;
  const per = char.stats?.perception || 20;
  const psy = char.stats?.psyRating  || 0;
  if (char.class === 'Adept')            return { target: agi + per + psy, label: 'Precognition Dodge' };
  if (char.class === 'Veteran Infantry') return { target: agi,             label: 'Trained Dodge'      };
  return { target: Math.floor(agi / 2),                                    label: 'Base Dodge'          };
}
// Enemies: ability "Hyper Drugged Awareness" = AGI+20, skill "Trained Dodge" = AGI, else Base (AGI/2)
function getEnemyDodgeTarget(enemy) {
  const agi = enemy.stats?.agility || 20;
  if ((enemy.abilities || []).some(a => a.includes('Hyper Drugged'))) return { target: agi + 20,              label: 'Hyper Awareness' };
  if ((enemy.skills   || []).includes('Trained Dodge'))               return { target: agi,                   label: 'Trained Dodge'   };
  return { target: Math.floor(agi / 2),                                                                       label: 'Base Dodge'      };
}

// ── Terrain helpers ────────────────────────────────────────────────────────

/** All tiles occupied by a terrain piece */
function terrainTiles(t) {
  const tiles = [];
  for (let dy = 0; dy < t.h; dy++)
    for (let dx = 0; dx < t.w; dx++)
      tiles.push({ x: t.x + dx, y: t.y + dy });
  return tiles;
}

/** True if grid position (x,y) falls inside any cover tile (impassable barriers) */
function isCoverTile(x, y, terrain) {
  return terrain.some(t => t.type === 'cover' &&
    x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h);
}

/** True if position is on an elevated platform */
function isOnPlatform(pos, terrain) {
  return terrain.some(t => t.type === 'platform' &&
    pos.x >= t.x && pos.x < t.x + t.w && pos.y >= t.y && pos.y < t.y + t.h);
}

/**
 * Bresenham line-of-sight check.
 * Returns false if any platform tile (not occupied by shooter or target) lies on the line.
 */
function hasLineOfSight(fromPos, toPos, terrain) {
  let x0 = fromPos.x, y0 = fromPos.y;
  const x1 = toPos.x,  y1 = toPos.y;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    const isEndpoint = (x0 === fromPos.x && y0 === fromPos.y) || (x0 === x1 && y0 === y1);
    if (!isEndpoint) {
      const blocked = terrain.some(t => t.type === 'platform' &&
        x0 >= t.x && x0 < t.x + t.w && y0 >= t.y && y0 < t.y + t.h);
      if (blocked) return false;
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 <  dx) { err += dx; y0 += sy; }
  }
  return true;
}

/**
 * Returns true if targetPos has partial cover vs a shot from shooterPos.
 * A cover tile adjacent to the target counts if it lies between target and shooter.
 */
function hasCoverVsShooter(targetPos, shooterPos, terrain) {
  const distTS = Math.abs(targetPos.x - shooterPos.x) + Math.abs(targetPos.y - shooterPos.y);
  for (const t of terrain) {
    if (t.type !== 'cover') continue;
    for (const { x: cx, y: cy } of terrainTiles(t)) {
      // Adjacent to target?
      if (Math.abs(cx - targetPos.x) > 1 || Math.abs(cy - targetPos.y) > 1) continue;
      // Closer to shooter than the target is?
      const distCS = Math.abs(cx - shooterPos.x) + Math.abs(cy - shooterPos.y);
      if (distCS < distTS) return true;
    }
  }
  return false;
}

/** Body locations blocked by partial cover (legs & torso) */
const COVERED_LOCS = new Set(['Body', 'Right Leg', 'Left Leg']);

/**
 * Generate terrain for one combat encounter.
 * Platforms: elevated, blocks LoS, entities can stand on them.
 * Cover: impassable barriers, provide cover saves to adjacent characters.
 * Placed only in the middle zone (x 6–14) to leave spawn areas clear.
 */
function generateTerrain() {
  const terrain  = [];
  const occupied = new Set();

  const mark = (x, y, w, h) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        occupied.add(`${x + dx},${y + dy}`);
  };

  const canPlace = (x, y, w, h) => {
    if (x < 6 || x + w > 15 || y < 1 || y + h > 19) return false;
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        if (occupied.has(`${x + dx},${y + dy}`)) return false;
    return true;
  };

  const tryPlace = (type, sizes, count) => {
    for (let i = 0; i < count; i++) {
      const { w, h } = sizes[Math.floor(Math.random() * sizes.length)];
      for (let attempt = 0; attempt < 40; attempt++) {
        const x = 6  + Math.floor(Math.random() * (9  - w + 1));
        const y = 1  + Math.floor(Math.random() * (18 - h + 1));
        if (canPlace(x, y, w, h)) {
          terrain.push({ type, x, y, w, h });
          mark(x, y, w, h);
          break;
        }
      }
    }
  };

  // Platforms: 1×1, 2×2, or 2×3
  const platformSizes = [{ w: 1, h: 1 }, { w: 2, h: 2 }, { w: 2, h: 3 }, { w: 3, h: 2 }];
  tryPlace('platform', platformSizes, 2 + Math.floor(Math.random() * 2)); // 2–3

  // Cover barriers: 1×1 or 1×2 strips
  const coverSizes = [{ w: 1, h: 1 }, { w: 1, h: 2 }, { w: 2, h: 1 }];
  tryPlace('cover', coverSizes, 3 + Math.floor(Math.random() * 2)); // 3–4

  return terrain;
}

/**
 * Perpendicular distance from point (px, py) to the ray starting at (ax, ay)
 * going through (bx, by). Returns Infinity if the point is behind the shooter.
 */
function perpDistToRay(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Infinity;
  const t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  if (t < 0) return Infinity; // point is behind the shooter
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

// Equipment items may be stored as string IDs or as {id,name,desc} objects
function itemId(item) { return typeof item === 'string' ? item : item?.id; }

// Armor values for player equipment slots
const EQUIPMENT_ARMOR = { flak_vest: 3, tech_shield_vest: 5, robes: 0 };
function getCharArmor(char) {
  for (const item of (char.equipment || [])) {
    const id = itemId(item);
    if (EQUIPMENT_ARMOR[id] !== undefined) return EQUIPMENT_ARMOR[id];
  }
  return 0;
}

// All weapon objects carried by a character (armor items excluded)
function getCharWeapons(char) {
  const weapons = [];
  for (const item of (char.equipment || [])) {
    const w = getWeaponById(itemId(item));
    if (w) weapons.push(w);
  }
  if (weapons.length === 0)
    weapons.push({ id: 'fists', name: 'Fists', damage: '1d5', pen: 0, type: 'Melee', specialRules: [] });
  return weapons;
}

// Returns the currently-readied weapon for a party member
function getActiveWeapon(char, partyIdx, activeWeapons) {
  const activeId = activeWeapons?.[partyIdx];
  if (activeId) {
    const w = getWeaponById(activeId);
    if (w) return w;
  }
  return getCharWeapons(char)[0];
}

function getCharMeleeWeapon(char) {
  for (const item of (char.equipment || [])) {
    const w = getWeaponById(itemId(item));
    if (w && w.type === 'Melee') return w;
  }
  return { id: 'fists', name: 'Fists', damage: '1d5', pen: 0, type: 'Melee', specialRules: [] };
}

function getCharRangedWeapon(char) {
  for (const item of (char.equipment || [])) {
    const w = getWeaponById(itemId(item));
    if (w && w.type !== 'Melee') return w;
  }
  return null;
}

// ── Ranged fire-mode helpers ───────────────────────────────────
// Parse "S/3/-" → { single:true, semiAuto:3, fullAuto:0 }
function parseRoF(rof) {
  if (!rof || rof === '-' || rof === 'Cone') return { single: false, semiAuto: 0, fullAuto: 0 };
  const parts = rof.split('/');
  return {
    single:   parts[0] === 'S',
    semiAuto: (parts[1] && parts[1] !== '-') ? parseInt(parts[1]) : 0,
    fullAuto: (parts[2] && parts[2] !== '-') ? parseInt(parts[2]) : 0,
  };
}

// Additional burst hits: hit 2 = same limb, hits 3+ scatter to neighbour
const HIT_SCATTER = { Head: 'Body', Body: 'Right Arm', 'Right Arm': 'Body', 'Left Arm': 'Body', 'Right Leg': 'Body', 'Left Leg': 'Right Leg' };
function subsequentHitLoc(firstLoc, extraHitIdx) {
  return extraHitIdx === 0 ? firstLoc : (HIT_SCATTER[firstLoc] || 'Body');
}

// ── Range helpers ──────────────────────────────────────────────
// Parse weapon range string "30m" → 30, "100m" → 100, "Melee" → 0
function parseRangeMeters(rangeStr) {
  if (!rangeStr || rangeStr === 'Melee' || rangeStr === '-') return 0;
  if (rangeStr === 'Cone') return 9; // flamer cone ≈ 9m
  const m = rangeStr.match(/^(\d+)m$/i);
  return m ? parseInt(m[1]) : 30;
}

// Distance modifiers — each grid tile = 3 metres
// Returns { modifier: number|null, band: string }
// modifier === null → out of range (cannot fire)
function getRangeBand(distTiles, weaponRangeMeters) {
  const distMeters = distTiles * 3;
  if (weaponRangeMeters <= 0) return { modifier: 30, band: 'Point Blank' };
  if (distMeters <= 3)                         return { modifier: 30,   band: 'Point Blank' };
  if (distMeters <= weaponRangeMeters / 2)     return { modifier: 10,   band: 'Short'       };
  if (distMeters <= weaponRangeMeters)         return { modifier: 0,    band: 'Normal'      };
  if (distMeters <= weaponRangeMeters * 2)     return { modifier: -10,  band: 'Long'        };
  if (distMeters <= weaponRangeMeters * 3)     return { modifier: -30,  band: 'Extreme'     };
  return { modifier: null, band: 'Out of Range' };
}

function resolveCheck(statValue, difficulty) {
  const roll = d100();
  const passed = roll <= statValue;
  const margin = passed ? statValue - roll : roll - statValue;
  const extreme = margin >= 30;
  return { roll, passed, margin, extreme };
}

export default function MissionSystem({ onNavigate }) {
  const [phase, setPhase]               = useState("select_character");
  const [characters, setCharacters]     = useState(() => JSON.parse(localStorage.getItem("dhgen_roster") || "[]"));
  
  // Party state - array of selected characters
  const [party, setParty] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [currentPartyMember, setCurrentPartyMember] = useState(0); // Index of party member acting

  // Refresh characters from localStorage when phase changes to select_character
  useEffect(() => {
    if (phase === "select_character") {
      const freshRoster = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
      setCharacters(freshRoster);
    }
  }, [phase]);
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [results, setResults]           = useState([]);
  const [injuries, setInjuries]         = useState([]);
  const [deathCheck, setDeathCheck]     = useState(null);
  const [missionOutcome, setMissionOutcome] = useState(null);
  const [xpGained, setXpGained]         = useState(0);
  const [fatePrompt, setFatePrompt]     = useState(false);
  const [isDead, setIsDead]             = useState(false);
  const [encounter, setEncounter]       = useState(null);
  const [combatPhase, setCombatPhase]    = useState(null);
  const [combatLog, setCombatLog]       = useState([]);
  const [fateSpentInMission, setFateSpentInMission] = useState(false);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [checkResults, setCheckResults] = useState([]);
  const combatLogRef = useRef(null);
  // Always-current ref for partyWounds — prevents stale closure in setTimeout callbacks
  const partyWoundsRef = useRef([]);

  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLog]);
  const [partyWounds, setPartyWounds] = useState([]); // Array of wounds taken by each party member
  const [enemyWounds, setEnemyWounds]   = useState([]);
  const [currentEnemy, setCurrentEnemy] = useState(0);
  
  // Grid combat state
  const GRID_SIZE = 20;
  const [gridPositions, setGridPositions] = useState({ party: [], enemies: [] });
  const [selectedMovementTarget, setSelectedMovementTarget] = useState(null);
  
  // Combat sub-phase: 'movement' or 'attack'
  const [combatAction, setCombatAction] = useState('movement');
  
  // Party member needing fate resolution
  const [pendingFateIndex, setPendingFateIndex] = useState(null);

  // Per-location wound tracking & detail popup
  const emptyBodyWounds = () => ({ 'Head': 0, 'Right Arm': 0, 'Left Arm': 0, 'Body': 0, 'Right Leg': 0, 'Left Leg': 0 });
  const [partyBodyWounds, setPartyBodyWounds] = useState([]);
  const [enemyBodyWounds, setEnemyBodyWounds] = useState([]);
  const [detailPopup, setDetailPopup] = useState(null); // { type: 'party'|'enemy', index }
  const [aiming, setAiming] = useState(false);           // true when active character spent move to aim
  const [shootingMode, setShootingMode] = useState(false); // waiting for grid-click to pick ranged target
  const [activeWeapons, setActiveWeapons] = useState({}); // { partyIdx: weaponId } — readied weapon per member
  const [remainingAction, setRemainingAction] = useState('full'); // 'full'=full action left | 'half'=half action used
  const [fireMode, setFireMode] = useState('single');     // 'single' | 'semi' | 'full'
  const [enemyPinned, setEnemyPinned] = useState([]);     // boolean[] — pinned enemies get -20 on next attack
  const [partyReactionsUsed,  setPartyReactionsUsed]  = useState([]); // boolean[] — party member used their 1 reaction this round
  const [enemyReactionsUsed,  setEnemyReactionsUsed]  = useState([]); // boolean[] — enemy used their 1 reaction this round
  const [terrain, setTerrain] = useState([]); // terrain pieces: platforms + cover barriers
  const terrainRef = useRef([]);
  useEffect(() => { terrainRef.current = terrain; }, [terrain]);

  // Initiative system
  const [initiativeOrder, setInitiativeOrder] = useState([]); // Array of {type: 'party'|'enemy', index: number, initiative: number}
  const [currentTurn, setCurrentTurn] = useState(0); // Index in initiativeOrder

  // Always-current refs — prevent stale closures in setTimeout callbacks
  const enemyPinnedRef         = useRef([]);
  const partyReactionsUsedRef  = useRef([]);
  const enemyReactionsUsedRef  = useRef([]);
  // Keep refs in sync
  useEffect(() => { partyWoundsRef.current          = partyWounds;          }, [partyWounds]);
  useEffect(() => { enemyPinnedRef.current          = enemyPinned;          }, [enemyPinned]);
  useEffect(() => { partyReactionsUsedRef.current   = partyReactionsUsed;   }, [partyReactionsUsed]);
  useEffect(() => { enemyReactionsUsedRef.current   = enemyReactionsUsed;   }, [enemyReactionsUsed]);

  // Emit shot-mode to Phaser so it can draw the cone overlay while targeting
  useEffect(() => {
    if (shootingMode && initiativeOrder.length > 0) {
      const actor = initiativeOrder[currentTurn];
      if (actor?.type === 'party') {
        const char = party[actor.index];
        const aw = getActiveWeapon(char, actor.index, activeWeapons);
        const fromPos = gridPositions.party?.[actor.index];
        // Single-shot has no scatter cone; burst modes use the weapon's accuracy
        const accuracy = fireMode === 'single' ? 0 : (aw?.accuracy ?? 0);
        if (fromPos) eventBridge.emit('shot-mode', { active: true, fromPos, accuracy });
      }
    } else {
      eventBridge.emit('shot-mode', { active: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shootingMode, fireMode]);

  // Derived values for convenience
  const activeChar = party[currentPartyMember] || party[0] || null;
  const activeCharWounds = partyWounds[currentPartyMember] || 0;
  
  // Current turn actor
  const currentActor = (initiativeOrder || [])[currentTurn] || null;
  const isPlayerTurn = currentActor?.type === 'party';
  const currentPartyMemberFromInitiative = isPlayerTurn ? currentActor?.index : currentPartyMember;
  const currentActorIsDead = isPlayerTurn
    ? (partyWounds[currentActor?.index] || 0) >= (party[currentActor?.index]?.wounds || 10)
    : (enemyWounds[currentActor?.index] || 0) <= 0;

  // Movement highlight — computed when it's a player's movement phase
  const movementHighlight = (() => {
    if (phase !== 'combat' || !isPlayerTurn || combatAction !== 'movement') return null;
    const actorIdx = currentActor?.index;
    const actorPos = gridPositions.party[actorIdx];
    if (!actorPos) return null;
    const agi = party[actorIdx]?.stats?.agility || 20;
    const range = Math.floor(agi / 10) + 4;
    return { actorPos, range };
  })();

  // Phaser grid state — passed to PhaserGame which forwards to CombatScene
  const gridState = phase === 'combat' ? {
    gridPositions,
    partyWounds,
    enemyWounds,
    currentTurn,
    initiativeOrder,
    party,
    enemies: encounter?.enemies || [],
    movementHighlight,
    shootingMode,
    terrain,
  } : null;

  // ── PHASE: SELECT PARTY ──────────────────────────────────────
  if (phase === "select_character") {
    const saved = characters.filter(Boolean);
    const liveCharacters = saved.filter(c => !c.kia);
    const kiaCharacters = saved.filter(c => c.kia);
    
    const isInParty = (char) => party.some(p => p.name === char.name && p.origin === char.origin);
    
    return (
      <Screen onNavigate={onNavigate} title="Deploy Party" subtitle="Select 1-4 Acolytes for the mission">
        {saved.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontFamily: "'IM Fell English', serif", color: "#5a4020", fontSize: 14 }}>
            No Acolytes on file. Create a character first.
          </div>
        ) : (
          <>
            {/* Party Summary */}
            {party.length > 0 && (
              <div style={{ border: "1px solid #3a6a3a", background: "rgba(20,40,20,0.5)", padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, color: "#6ee7b7", marginBottom: 8, letterSpacing: 2 }}>PARTY ({party.length}/4)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {party.map((p, i) => (
                    <span key={i} style={{ border: "1px solid #4a7a4a", background: "rgba(40,80,40,0.3)", padding: "4px 10px", fontSize: 10, color: "#8ab080" }}>
                      {p.name}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                  <button onClick={() => setPhase("select_mission")} disabled={party.length === 0} style={{ borderColor: "#6a8060", color: party.length > 0 ? "#80c080" : "#4a4a4a", opacity: party.length > 0 ? 1 : 0.5 }}>
                    Continue to Mission
                  </button>
                  <button onClick={() => setParty([])} style={{ borderColor: "#5a3e1b", color: "#8a7050" }}>
                    Clear Party
                  </button>
                </div>
              </div>
            )}
            
            {liveCharacters.length === 0 && kiaCharacters.length > 0 && (
              <div style={{ textAlign: "center", padding: 20, fontFamily: "'IM Fell English', serif", color: "#5a4020", fontSize: 13, marginBottom: 20, border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)" }}>
                No living Acolytes available for deployment.
              </div>
            )}
            
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#6a5030", textTransform: "uppercase", marginBottom: 10, fontFamily: "Cinzel" }}>
              — Available Acolytes (click to add) —
            </div>
            
            {liveCharacters.map((char) => {
              const rank = getRank(char.xp || 0);
              const originalIdx = characters.findIndex(c => c && c.name === char.name && c.origin === char.origin);
              const inParty = isInParty(char);
              
              return (
                <div key={originalIdx} onClick={() => {
                  if (inParty) {
                    setParty(party.filter(p => !(p.name === char.name && p.origin === char.origin)));
                  } else if (party.length < 4) {
                    setParty([...party, { ...char, rosterIndex: originalIdx }]);
                  }
                }}
                  style={{ 
                    border: inParty ? "2px solid #4a7a4a" : "1px solid #3a2510", 
                    background: inParty ? "rgba(20,40,20,0.5)" : "rgba(15,10,4,0.85)", 
                    padding: "14px 18px", 
                    marginBottom: 10, 
                    cursor: party.length < 4 || inParty ? "pointer" : "not-allowed",
                    opacity: party.length >= 4 && !inParty ? 0.5 : 1,
                    transition: "border-color 0.2s" 
                  }}
                  onMouseEnter={e => { if (party.length < 4 || inParty) e.currentTarget.style.borderColor = "#c09040"; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = inParty ? "#4a7a4a" : "#3a2510"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 15, color: inParty ? "#6ee7b7" : "#d4a850" }}>
                        {inParty && "✓ "}{char.name}
                      </div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#8a7050", marginTop: 3 }}>
                        {char.class || char.career || 'Operative'}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge>{rank}</Badge>
                        <Badge>{char.xp || 0} XP</Badge>
                        <Badge>Wounds {char.wounds}</Badge>
                        <Badge>Fate {char.fate}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {kiaCharacters.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#5a2020", textTransform: "uppercase", marginBottom: 10, fontFamily: "Cinzel", borderBottom: "1px solid #2a1808", paddingBottom: 6 }}>
                  — KIA —
                </div>
                {kiaCharacters.map((char) => {
                  const rank = getRank(char.xp || 0);
                  const originalIdx = characters.findIndex(c => c && c.name === char.name && c.origin === char.origin);
                  return (
                    <div key={`kia-${originalIdx}`}
                      style={{ border: "1px solid #3a2510", background: "rgba(30,10,10,0.4)", padding: "14px 18px", marginBottom: 10, cursor: "not-allowed", opacity: 0.6 }}>
                      <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 15, color: "#704040" }}>{char.name}</div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#6a5040", marginTop: 3 }}>
                        {char.class || char.career || 'Operative'}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge>{rank}</Badge>
                        <Badge>{char.xp || 0} XP</Badge>
                        <Badge style={{ borderColor: "#5a2020", color: "#c05050" }}>KIA</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Screen>
    );
  }

  // ── PHASE: SELECT MISSION ────────────────────────────────────
  if (phase === "select_mission") {
    return (
      <Screen onNavigate={onNavigate} title="Select Mission" subtitle={`Deploying: ${party.map(p => p.name).join(", ")}`} onBack={() => { setPhase("select_character"); setEncounter(null); }}>
        {/* Party Summary */}
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030", letterSpacing: 2, marginBottom: 8 }}>PARTY MEMBERS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {party.map((p, i) => (
              <span key={i} style={{ border: "1px solid #4a3010", background: "rgba(90,62,27,0.2)", padding: "4px 10px", fontSize: 10, color: "#9a7840" }}>
                {p.name} (W{p.stats.willpower})
              </span>
            ))}
          </div>
        </div>
        
        {["Routine", "Dangerous", "Deadly"].map(tier => (
          <div key={tier} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: TIER_COLOR[tier], textTransform: "uppercase", marginBottom: 10, fontFamily: "Cinzel", borderBottom: "1px solid #2a1808", paddingBottom: 6 }}>
              — {tier} —
            </div>
            {MISSIONS.filter(m => m.tier === tier).map(mission => (
              <div key={mission.id} onClick={() => { setSelectedMission(mission); setPhase("briefing"); }}
                style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "14px 18px", marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = TIER_COLOR[tier]}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#3a2510"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#c8b89a", letterSpacing: 1 }}>{mission.name}</div>
                    <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "#6a5030", marginTop: 2 }}>{mission.type} · {mission.checks.length} checks</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#6a8060", fontFamily: "Cinzel" }}>{mission.xpSuccess} XP</div>
                    <div style={{ fontSize: 10, color: "#5a4020", fontFamily: "Cinzel" }}>fail: {mission.xpFailure} XP</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#7a6040", marginTop: 8, lineHeight: 1.5 }}>
                  {mission.flavor}
                </div>
              </div>
            ))}
          </div>
        ))}
      </Screen>
    );
  }

  // ── PHASE: BRIEFING ──────────────────────────────────────────
  if (phase === "briefing") {
    const activeChar = party[0]; // Lead character for display
    const environment = getEnvironmentFromMission(selectedMission);
    const rank = getRank(activeChar.xp || 0);
    const missionWithRank = { ...selectedMission, rank };
    
    if (!encounter) {
      const generatedEncounter = generateEncounter(missionWithRank, environment, rank);
      setEncounter(generatedEncounter);
      setEnemyWounds(generatedEncounter.enemies.map(e => e.wounds));
    }
    
    return (
      <Screen onNavigate={onNavigate} title={selectedMission.name} subtitle={`${selectedMission.type} · ${selectedMission.tier}`} onBack={() => { setPhase("select_mission"); setEncounter(null); }}>
        {/* Party Display */}
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030", letterSpacing: 2, marginBottom: 8 }}>DEPLOYED PARTY</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {party.map((p, i) => (
              <span key={i} style={{ border: i === 0 ? "1px solid #6a8060" : "1px solid #4a3010", background: i === 0 ? "rgba(40,80,40,0.2)" : "rgba(90,62,27,0.2)", padding: "4px 10px", fontSize: 10, color: i === 0 ? "#80c080" : "#9a7840" }}>
                {p.name} (W{p.wounds})
              </span>
            ))}
          </div>
        </div>
        
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: 14, color: "#b8a070", lineHeight: 1.6, marginBottom: 16 }}>
            {selectedMission.flavor}
          </div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#6a5030", textTransform: "uppercase", marginBottom: 10 }}>Anticipated Checks</div>
          {selectedMission.checks.map((check, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #2a1808", fontFamily: "'IM Fell English', serif", fontSize: 12 }}>
              <span style={{ color: "#a89070" }}>{check.label}</span>
              <span style={{ color: "#6a5030" }}>{check.stat} vs {check.difficulty}{check.isCombat ? " ⚔" : ""}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "Cinzel", color: "#6a5030" }}>
            <span>Success: <span style={{ color: "#6a8060" }}>{selectedMission.xpSuccess} XP</span></span>
            <span>Failure: <span style={{ color: "#a05030" }}>{selectedMission.xpFailure} XP</span></span>
          </div>
        </div>
        
        {/* ENCOUNTER PREVIEW */}
        {encounter && (
          <div style={{ border: "1px solid #5a2020", background: "rgba(40,15,15,0.6)", padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#c05050", textTransform: "uppercase", marginBottom: 10 }}>⚠ Hostiles Detected</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#8a5040", marginBottom: 12, letterSpacing: 1 }}>Environment: {environment}</div>
            {encounter.enemies.map((enemy, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "rgba(30,10,10,0.5)", marginBottom: 8, borderLeft: "2px solid #c05050" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#d4a050" }}>{enemy.name}</span>
                  <span style={{ fontSize: 10, color: "#a05050" }}>{enemy.wounds} Wounds</span>
                </div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "#7a5040", marginTop: 4, fontStyle: "italic" }}>
                  {enemy.description}
                </div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "#6a4030", marginTop: 6 }}>
                  MEL {enemy.stats.meleeSkill} | RNG {enemy.stats.rangeSkill} | STR {enemy.stats.strength} | TOU {enemy.stats.toughness} | Armor {enemy.armor}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid #3a1515", fontSize: 11, fontFamily: "Cinzel" }}>
              <span style={{ color: "#a05050" }}>Total Wounds: {encounter.totalWounds}</span>
              <span style={{ color: "#c09040" }}>XP Value: {encounter.totalXP}</span>
            </div>
          </div>
        )}
        
        <div style={{ textAlign: "center" }}>
          <button onClick={() => startMission()} style={{ padding: "12px 32px", fontSize: 13, letterSpacing: 3, borderColor: TIER_COLOR[selectedMission.tier], color: TIER_COLOR[selectedMission.tier] }}>
            ✦ Deploy Party ({party.length} Acolytes)
          </button>
        </div>
      </Screen>
    );
  }

  // ── PHASE: SKILL CHECK ───────────────────────────────────────
  if (phase === "skill_check") {
    const currentCheck = selectedMission.checks[currentCheckIndex];
    const char = activeChar;
    
    return (
      <Screen onNavigate={onNavigate} title="Skill Check" subtitle={`${currentCheck.label} - ${char.name}`} onBack={() => { setPhase("briefing"); setCurrentCheckIndex(0); }}>
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "20px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 14, color: "#c09040", marginBottom: 12, letterSpacing: 2 }}>
            {currentCheck.label}
          </div>
          <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#a89070", marginBottom: 16, fontStyle: "italic" }}>
            {currentCheck.flavor}
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#6a5030", marginBottom: 8 }}>
            {currentCheck.stat} vs Difficulty {currentCheck.difficulty}
          </div>
          <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#5a4020" }}>
            Your {currentCheck.stat}: {char.stats[currentCheck.stat] || 20}
          </div>
        </div>
        
        <div style={{ textAlign: "center" }}>
          <button onClick={() => resolveSkillCheck()} style={{ padding: "12px 32px", fontSize: 13, letterSpacing: 3, borderColor: "#6a8060", color: "#80c080" }}>
            ✦ Attempt Check
          </button>
        </div>
      </Screen>
    );
  }

  // ── PHASE: RESULTS ───────────────────────────────────────────
  if (phase === "results") {
    const allResults = checkResults.length > 0 ? checkResults : results;
    const passes = allResults.filter(r => r.passed).length;
    const fails  = allResults.filter(r => !r.passed).length;
    const success = passes > fails;

    return (
      <Screen onNavigate={onNavigate} title="Mission Report" subtitle={selectedMission.name}>

        {/* OUTCOME BANNER */}
        <div style={{ border: `1px solid ${success ? "#4a7a4a" : "#7a3a1a"}`, background: success ? "rgba(20,40,20,0.6)" : "rgba(40,15,10,0.6)", padding: "14px 20px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: success ? "#6ee7b7" : "#f87171", letterSpacing: 4 }}>
            {isDead ? "ACOLYTE LOST" : success ? "MISSION SUCCESS" : "MISSION FAILURE"}
          </div>
          {!isDead && (
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#8a7050", marginTop: 6 }}>
              {passes} passed · {fails} failed · {xpGained} XP earned
            </div>
          )}
        </div>

        {/* ENCOUNTER SUMMARY */}
        {encounter && (
          <div style={{ border: "1px solid #5a2020", background: "rgba(40,15,15,0.6)", padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#c05050", textTransform: "uppercase", marginBottom: 10 }}>— HOSTILES ENGAGED —</div>
            {encounter.enemies.map((enemy, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "rgba(30,10,10,0.5)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#d4a050" }}>{enemy.name}</span>
                <span style={{ fontSize: 10, color: "#a05050" }}>Defeated · {enemy.xpValue} XP</span>
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #3a1515", fontSize: 11, fontFamily: "Cinzel", color: "#c09040", textAlign: "center" }}>
              Total Enemy XP: {encounter.totalXP}
            </div>
          </div>
        )}

        {/* FATE PROMPT */}
        {/* Note: Fate mechanics are handled in combat phase for party missions */}

        {/* CHECK RESULTS */}
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", marginBottom: 16 }}>
          <div style={{ background: "linear-gradient(90deg,#2a1808,#1a1005,#2a1808)", borderBottom: "1px solid #3a2510", padding: "8px 16px", fontFamily: "'Cinzel Decorative', serif", fontSize: 10, color: "#a07030", letterSpacing: 3 }}>
            — CHECK BY CHECK —
          </div>
          {allResults.map((r, i) => (
            <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #1a1005", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#a89070" }}>{r.label} {r.isCombat ? "⚔" : ""}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: r.passed ? "#6ee7b7" : "#f87171", fontWeight: 600 }}>
                  {r.passed ? "PASS" : "FAIL"}
                </span>
              </div>
              <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "#5a4020", fontStyle: "italic" }}>{r.flavor}</div>
              {!r.isCombat && (
                <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "#6a5030" }}>
                  Rolled {r.roll} vs {r.stat} {r.statValue} (difficulty {r.difficulty}) · margin {r.margin}
                  {r.extreme && <span style={{ color: r.passed ? "#6ee7b7" : "#f87171" }}> · EXTREME</span>}
                </div>
              )}
              {r.injury && (
                <div style={{ background: "rgba(80,20,20,0.4)", border: "1px solid #5a2020", padding: "6px 10px", fontSize: 11, fontFamily: "'IM Fell English', serif", color: "#c07070" }}>
                  ⚠ Injury: {r.injury.name} — {r.injury.description} ({r.injury.stat} {r.injury.penalty})
                </div>
              )}
            </div>
          ))}
        </div>

        {/* INJURIES SUMMARY */}
        {injuries.length > 0 && !isDead && (
          <div style={{ border: "1px solid #5a2020", background: "rgba(30,10,10,0.6)", padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#a05030", textTransform: "uppercase", marginBottom: 8 }}>Permanent Injuries Sustained</div>
            {injuries.map((inj, i) => (
              <div key={i} style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#c07050", marginBottom: 4 }}>
                {inj.name} · {inj.stat} {inj.penalty} permanent
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        {!fatePrompt && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => { setPhase("select_mission"); resetMissionState(); }}>Deploy Again</button>
            <button onClick={() => { setPhase("select_character"); resetMissionState(); setResults([]); setInjuries([]); setDeathCheck(null); setMissionOutcome(null); setFatePrompt(false); setIsDead(false); }}>
              Change Acolyte
            </button>
            <button onClick={() => onNavigate("home")}>Return to Base</button>
          </div>
        )}
      </Screen>
    );
  }

  // ── COMBAT PHASE ─────────────────────────────────────────────
  if (phase === "combat") {
    const currentEnemyData = encounter?.enemies[currentEnemy];
    const activeChar = party[currentPartyMember];
    const activeCharWounds = partyWounds[currentPartyMember] || 0;
    const isDead = activeCharWounds >= (activeChar.wounds || 10);
    const allEnemiesDead = enemyWounds.every(w => w <= 0);
    // Check if all party members are dead
    const allPartyDead = party.every((p, i) => (partyWounds[i] || 0) >= (p.wounds || 10));
    
    return (
      <Screen onNavigate={onNavigate} title="Combat Encounter" subtitle={currentEnemyData?.name || "Battle"} onBack={() => { setPhase("briefing"); setCombatLog([]); setPartyWounds(party.map(() => 0)); setEnemyWounds(encounter?.enemies.map(e => e.wounds) || []); setIsPlayerTurn(true); }}>
        {/* ── Combined Status Row: Party (left) + Hostiles (right) ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>

          {/* Party Status */}
          <div style={{ flex: 1, border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "8px 10px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#6a5030", letterSpacing: 2, marginBottom: 6 }}>
              PARTY <span style={{ color: "#3a2808", fontFamily: "'IM Fell English', serif", letterSpacing: 0 }}>(click)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {party.map((p, i) => {
                const wounds = partyWounds[i] || 0;
                const maxW = p.wounds || 10;
                const alive = wounds < maxW;
                const hp = Math.max(0, maxW - wounds);
                const hpPct = hp / maxW;
                const isActiveTurn = initiativeOrder[currentTurn]?.type === 'party' && initiativeOrder[currentTurn]?.index === i;
                const barColor = hpPct > 0.5 ? '#6ee7b7' : hpPct > 0.25 ? '#f59e0b' : '#f87171';
                const aw = getActiveWeapon(p, i, activeWeapons);
                const wepIsRanged = aw && aw.type !== 'Melee';
                const initRank = initiativeOrder.findIndex(e => e.type === 'party' && e.index === i);
                const reactionUsed = partyReactionsUsed[i] || false;
                return (
                  <div key={i}
                    onClick={() => alive && setDetailPopup({ type: 'party', index: i })}
                    style={{ cursor: alive ? 'pointer' : 'default', padding: '4px 6px', border: isActiveTurn ? '1px solid #c09040' : '1px solid #2a1808', background: isActiveTurn ? 'rgba(60,45,10,0.2)' : 'rgba(10,8,4,0.4)', opacity: alive ? 1 : 0.5 }}
                    onMouseEnter={e => { if (alive) e.currentTarget.style.borderColor = '#6a5030'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isActiveTurn ? '#c09040' : '#2a1808'; }}>
                    {/* Row: name | bar+hp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: alive ? (isActiveTurn ? '#c09040' : '#a89070') : '#604040', flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {initRank >= 0 ? `${initRank + 1}. ` : ''}{isActiveTurn ? '▶ ' : ''}{p.name}
                      </span>
                      {alive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                          <div style={{ background: '#1a1a14', height: 4, borderRadius: 2, width: 44 }}>
                            <div style={{ background: barColor, width: `${hpPct * 100}%`, height: '100%', borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 8, color: '#6a7a5a', whiteSpace: 'nowrap' }}>{hp}/{maxW}</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 8, color: '#604040', flexShrink: 0 }}>FALLEN</span>
                      )}
                    </div>
                    {/* Weapon + reaction row */}
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 8, color: wepIsRanged ? '#4a8aaa' : '#906040' }}>
                        {wepIsRanged ? '🔫' : '⚔'} {(aw?.name || 'Fists').substring(0, 14)}
                      </span>
                      {alive && (
                        <span title={reactionUsed ? 'Reaction spent' : 'Reaction ready'} style={{ fontSize: 10, opacity: reactionUsed ? 0.5 : 1 }}>
                          {reactionUsed ? '🜄' : '🛡'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hostiles Status */}
          <div style={{ flex: 1, border: "1px solid #3a1a1a", background: "rgba(15,6,6,0.9)", padding: "8px 10px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#6a2020", letterSpacing: 2, marginBottom: 6 }}>
              HOSTILES <span style={{ color: "#3a1010", fontFamily: "'IM Fell English', serif", letterSpacing: 0 }}>(click)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {encounter?.enemies.map((enemy, i) => {
                const w = enemyWounds[i] || 0;
                const maxW = enemy.wounds || 10;
                const alive = w > 0;
                const wPct = w / maxW;
                const isActiveTurn = initiativeOrder[currentTurn]?.type === 'enemy' && initiativeOrder[currentTurn]?.index === i;
                const barColor = wPct > 0.6 ? '#f87171' : wPct > 0.3 ? '#f59e0b' : '#c04040';
                const eWep = (enemy.weapons || [])[0];
                const eWepIsRanged = eWep && eWep.type !== 'Melee';
                const initRank = initiativeOrder.findIndex(e => e.type === 'enemy' && e.index === i);
                const reactionUsed = enemyReactionsUsed[i] || false;
                return (
                  <div key={i}
                    onClick={() => alive && setDetailPopup({ type: 'enemy', index: i })}
                    style={{ cursor: alive ? 'pointer' : 'default', padding: '4px 6px', border: isActiveTurn ? '1px solid #c09040' : '1px solid #2a1010', background: isActiveTurn ? 'rgba(60,20,10,0.2)' : 'rgba(10,4,4,0.4)', opacity: alive ? 1 : 0.4 }}
                    onMouseEnter={e => { if (alive) e.currentTarget.style.borderColor = '#7a3030'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isActiveTurn ? '#c09040' : '#2a1010'; }}>
                    {/* Row: name | bar+hp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: alive ? (isActiveTurn ? '#c09040' : '#c05050') : '#504030', flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {initRank >= 0 ? `${initRank + 1}. ` : ''}{isActiveTurn ? '▶ ' : ''}{enemy.name}{!alive ? ' ✝' : ''}{alive && enemyPinned[i] ? ' 📌' : ''}
                      </span>
                      {alive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                          <div style={{ background: '#1a1414', height: 4, borderRadius: 2, width: 44 }}>
                            <div style={{ background: barColor, width: `${wPct * 100}%`, height: '100%', borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 8, color: '#8a4040', whiteSpace: 'nowrap' }}>{w}/{maxW}</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 8, color: '#504030', flexShrink: 0 }}>KIA</span>
                      )}
                    </div>
                    {/* Weapon + reaction row */}
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {eWep && (
                        <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 8, color: eWepIsRanged ? '#4a6a8a' : '#7a3030' }}>
                          {eWepIsRanged ? '🔫' : '⚔'} {eWep.name.substring(0, 14)}
                        </span>
                      )}
                      {alive && (
                        <span title={reactionUsed ? 'Reaction spent' : 'Reaction ready'} style={{ fontSize: 10, opacity: reactionUsed ? 0.5 : 1 }}>
                          {reactionUsed ? '🜄' : '🛡'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
        
        
        {/* ── Phaser Combat Grid ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030", letterSpacing: 2, marginBottom: 8 }}>
            BATTLEFIELD
          </div>
          <PhaserGame
            gridState={gridState}
            onGridClick={handleGridClick}
          />
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10, color: "#6a5030" }}>
            <span><span style={{ color: "#5aba5a" }}>■</span> Party</span>
            <span><span style={{ color: "#fa5a5a" }}>■</span> Enemies</span>
            <span style={{ color: "#4a3a20" }}>Click to move · Active unit pulses</span>
          </div>
        </div>

        {/* Turn Indicator */}
        <div style={{ 
          textAlign: "center", 
          padding: "10px 16px", 
          marginBottom: 12, 
          background: isPlayerTurn ? "rgba(40,80,40,0.3)" : "rgba(80,30,30,0.3)",
          border: `1px solid ${isPlayerTurn ? "#4a7a4a" : "#7a3a1a"}`,
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          letterSpacing: 2,
          color: isPlayerTurn ? "#6ee7b7" : "#f87171"
        }}>
          {currentActor ? (
            currentActor.type === 'party' 
              ? isPlayerTurn 
                ? `▶ ${currentActor.name}'S TURN - ${combatAction === 'movement' ? 'MOVE' : 'ATTACK'}`
                : `⏳ ${currentActor.name}'S TURN...`
              : `⏳ ${currentActor.name}'S TURN...`
          ) : "Combat Starting..."}
        </div>
        
        {/* Combat Log */}
        <div ref={combatLogRef} style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", marginBottom: 16, maxHeight: 250, overflowY: "auto" }}>
          <div style={{ background: "linear-gradient(90deg,#2a1808,#1a1005,#2a1808)", borderBottom: "1px solid #3a2510", padding: "8px 16px", fontFamily: "'Cinzel Decorative', serif", fontSize: 10, color: "#a07030", letterSpacing: 3 }}>
            — COMBAT LOG —
          </div>
          {combatLog.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#6a5030", fontStyle: "italic" }}>
              Combat begins! Choose your action.
            </div>
          ) : (
            combatLog.map((log, i) => (
              <div key={i} style={{ 
                padding: "8px 16px", 
                borderBottom: "1px solid #1a1005", 
                fontFamily: "'IM Fell English', serif", 
                fontSize: 12,
                background: log.type === "player" ? "rgba(40,80,40,0.2)" : log.type === "enemy" ? "rgba(80,30,30,0.2)" : "transparent",
                color: log.type === "player" ? "#6ee7b7" : log.type === "enemy" ? "#f87171" : "#a89070",
                borderLeft: log.type === "player" ? "3px solid #6ee7b7" : log.type === "enemy" ? "3px solid #f87171" : "3px solid #5a3e1b"
              }}>
                <span style={{ fontWeight: "bold", marginRight: 8 }}>
                  {log.type === "player" ? "▶ YOU" : log.type === "enemy" ? "▶ ENEMY" : "◆"}
                </span>
                {log.text}
              </div>
            ))
          )}
        </div>
        
        {/* Combat Actions - only show when no pending fate */}
        {pendingFateIndex === null && !allEnemiesDead && isPlayerTurn && (
          <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "12px 16px", marginBottom: 16 }}>
            {combatAction === 'movement' && (() => {
              const actIdx = currentActor?.index;
              const actorChar = party[actIdx] || {};
              const aw = getActiveWeapon(actorChar, actIdx, activeWeapons);
              const isRanged = aw && aw.type !== 'Melee';
              const agi = actorChar?.stats?.agility || 20;
              const moveRange = Math.floor(agi / 10) + 4;
              const weapons = getCharWeapons(actorChar);
              return (
                <>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#6a8060", marginBottom: 4 }}>
                    MOVEMENT PHASE — Click grid to move
                  </div>
                  <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "#5a4020", marginBottom: 8 }}>
                    Range: {moveRange} sq · Readied: {isRanged ? '🔫' : '⚔'} <span style={{ color: isRanged ? '#60aadd' : '#c09050' }}>{aw?.name || 'Fists'}</span>
                  </div>

                  {/* Weapon swap */}
                  {weapons.length > 1 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, color: "#5a4a30", marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Swap Weapon (costs move action):</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {weapons.map(w => {
                          const isActive = w.id === (activeWeapons[actIdx] ?? weapons[0]?.id);
                          const wRanged = w.type !== 'Melee';
                          return (
                            <button key={w.id}
                              disabled={isActive}
                              onClick={() => {
                                setActiveWeapons(prev => ({ ...prev, [actIdx]: w.id }));
                                setCombatLog(prev => [...prev, { type: "player", text: `${actorChar?.name} readies ${w.name}.` }]);
                                setRemainingAction('half');
                                setCombatAction('attack');
                              }}
                              style={{
                                borderColor: isActive ? '#4a3a18' : (wRanged ? '#2a5a8a' : '#6a4820'),
                                color: isActive ? '#5a4a28' : (wRanged ? '#60aadd' : '#c09040'),
                                padding: "5px 10px", fontSize: 10,
                                opacity: isActive ? 0.55 : 1,
                                cursor: isActive ? 'not-allowed' : 'pointer',
                              }}>
                              {isActive ? '✓ ' : ''}{wRanged ? '🔫' : '⚔'} {w.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => { setRemainingAction('full'); setCombatAction('attack'); }}
                      style={{ borderColor: "#a07030", color: "#c09040", padding: "8px 16px", fontSize: 11 }}>
                      Skip Movement
                    </button>
                    {isRanged && (
                      <button
                        onClick={() => { setAiming(true); setRemainingAction('half'); setCombatAction('attack'); }}
                        style={{ borderColor: "#3a6a9a", color: "#60aadd", padding: "8px 16px", fontSize: 11 }}>
                        🎯 AIM (+20 to hit)
                      </button>
                    )}
                  </div>
                </>
              );
            })()}

            {combatAction === 'attack' && (() => {
              const actIdx = currentActor?.index;
              const actorChar = party[actIdx] || {};
              const aw = getActiveWeapon(actorChar, actIdx, activeWeapons);
              const isRanged = aw && aw.type !== 'Melee';

              if (shootingMode) {
                const modeDisplay = fireMode === 'semi' ? '💥 SEMI-AUTO BURST'
                  : fireMode === 'full' ? '🔥 FULL AUTO'
                  : aiming ? '🎯 AIMED SHOT' : `🔫 SHOOTING`;
                return (
                  <>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#ff8830", marginBottom: 4 }}>
                      {modeDisplay} — {aw?.name}
                    </div>
                    <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "#aa6030", marginBottom: 8 }}>
                      Click an orange enemy tile on the grid to fire
                      {fireMode === 'semi' ? ' (+0 to hit, +1 hit/2 DoS)' : fireMode === 'full' ? ' (−10 to hit, +1 hit/DoS, jam 94–100)' : aiming ? ' (+20 to hit)' : ''}
                    </div>
                    <button
                      onClick={() => { setShootingMode(false); setFireMode('single'); }}
                      style={{ borderColor: "#5a3e1b", color: "#8a7050", padding: "6px 14px", fontSize: 10 }}>
                      Cancel
                    </button>
                  </>
                );
              }

              if (isRanged) {
                const rof = parseRoF(aw?.rateOfFire);
                const canFullAction = remainingAction === 'full';
                return (
                  <>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: aiming ? "#60aadd" : "#6a8060", marginBottom: 4 }}>
                      {aiming ? "🎯 AIMED — " : "ATTACK PHASE — "}{aw?.name}
                      {!canFullAction && <span style={{ color: "#5a4020", fontSize: 9, marginLeft: 8 }}>(Half action used — Single Shot only)</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Single Shot — always available (half action) */}
                      <button
                        onClick={() => { setFireMode('single'); setShootingMode(true); }}
                        style={{ borderColor: aiming ? "#2a5a9a" : "#3a7aaa", color: aiming ? "#60aadd" : "#80c0dd", padding: "8px 14px", fontSize: 10 }}>
                        {aiming ? "🎯 Aimed Single (+20)" : "🔫 Single Shot"}
                      </button>
                      {/* Semi-Auto — full action only */}
                      {canFullAction && rof.semiAuto > 0 && (
                        <button
                          onClick={() => { setFireMode('semi'); setShootingMode(true); }}
                          style={{ borderColor: "#5a7a30", color: "#90cc50", padding: "8px 14px", fontSize: 10 }}>
                          💥 Semi-Auto ×{rof.semiAuto}
                        </button>
                      )}
                      {/* Full Auto — full action only */}
                      {canFullAction && rof.fullAuto > 0 && (
                        <button
                          onClick={() => { setFireMode('full'); setShootingMode(true); }}
                          style={{ borderColor: "#8a4a20", color: "#e08040", padding: "8px 14px", fontSize: 10 }}>
                          🔥 Full Auto ×{rof.fullAuto}
                        </button>
                      )}
                      {/* Suppressive Fire — full action, only if weapon has auto */}
                      {canFullAction && (rof.fullAuto > 0 || rof.semiAuto > 0) && (
                        <button
                          onClick={() => playerSuppressiveFire()}
                          style={{ borderColor: "#6a2a6a", color: "#cc80cc", padding: "8px 14px", fontSize: 10 }}>
                          🌀 Suppressive Fire
                        </button>
                      )}
                      {/* Improvised melee */}
                      <button
                        onClick={() => playerAttack('improvised')}
                        style={{ borderColor: "#7a5020", color: "#a07040", padding: "8px 14px", fontSize: 10 }}>
                        ⚔ Improvised Strike
                      </button>
                      {/* Skip */}
                      <button
                        onClick={() => {
                          setCombatLog(prev => [...prev, { type: "player", text: `${actorChar?.name} holds position.` }]);
                          setAiming(false);
                          setFireMode('single');
                          setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 500);
                        }}
                        style={{ borderColor: "#5a3e1b", color: "#8a7050", padding: "8px 14px", fontSize: 10 }}>
                        Skip Attack
                      </button>
                    </div>
                  </>
                );
              }

              // Melee weapon active — compute adjacent enemies for target chooser
              const attackerPos = gridPositions.party[actIdx];
              const adjacentEnemiesUI = [];
              if (attackerPos) {
                enemyWounds.forEach((w, idx) => {
                  if (w > 0) {
                    const ep = gridPositions.enemies[idx];
                    if (ep && Math.max(Math.abs(ep.x - attackerPos.x), Math.abs(ep.y - attackerPos.y)) <= 1) {
                      adjacentEnemiesUI.push({ index: idx, enemy: encounter?.enemies[idx] });
                    }
                  }
                });
              }

              return (
                <>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#6a8060", marginBottom: 4 }}>
                    ATTACK PHASE — {aw?.name}
                  </div>
                  <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "#5a4020", marginBottom: 8 }}>
                    ⚔ Melee · Standard (+0) · All-Out (+20 to hit, enemy cannot react)
                  </div>

                  {adjacentEnemiesUI.length === 0 ? (
                    <>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "#7a5030", marginBottom: 8 }}>
                        No enemy in reach — move closer to attack.
                      </div>
                      <button
                        onClick={() => {
                          setCombatLog(prev => [...prev, { type: "player", text: `${actorChar?.name} holds position.` }]);
                          setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 500);
                        }}
                        style={{ borderColor: "#5a3e1b", color: "#8a7050", padding: "10px 18px" }}>
                        Skip Attack
                      </button>
                    </>
                  ) : adjacentEnemiesUI.length === 1 ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => playerAttack('standard')}
                        style={{ borderColor: "#6a8060", color: "#80c080", padding: "10px 18px" }}>
                        ⚔ Standard Attack
                      </button>
                      <button
                        onClick={() => playerAttack('allout')}
                        style={{ borderColor: "#c04040", color: "#e06060", padding: "10px 18px" }}>
                        ⚔⚔ All-Out Attack
                      </button>
                      <button
                        onClick={() => {
                          setCombatLog(prev => [...prev, { type: "player", text: `${actorChar?.name} holds position.` }]);
                          setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 500);
                        }}
                        style={{ borderColor: "#5a3e1b", color: "#8a7050", padding: "10px 18px" }}>
                        Skip Attack
                      </button>
                    </div>
                  ) : (
                    // 2+ adjacent enemies — show per-target rows
                    <>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 9, color: "#806040", marginBottom: 6 }}>
                        Choose target:
                      </div>
                      {adjacentEnemiesUI.map(ae => (
                        <div key={ae.index} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#c07050", minWidth: 80 }}>
                            {ae.enemy?.name}
                          </span>
                          <button
                            onClick={() => playerAttack('standard', ae.index)}
                            style={{ borderColor: "#6a8060", color: "#80c080", padding: "6px 12px", fontSize: 10 }}>
                            ⚔ Standard
                          </button>
                          <button
                            onClick={() => playerAttack('allout', ae.index)}
                            style={{ borderColor: "#c04040", color: "#e06060", padding: "6px 12px", fontSize: 10 }}>
                            ⚔⚔ All-Out
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setCombatLog(prev => [...prev, { type: "player", text: `${actorChar?.name} holds position.` }]);
                          setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 500);
                        }}
                        style={{ borderColor: "#5a3e1b", color: "#8a7050", padding: "6px 14px", fontSize: 10, marginTop: 4 }}>
                        Skip Attack
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
        
        {/* Combat End States - Fate Resolution */}
        {pendingFateIndex !== null && (
          <div style={{ border: "1px solid #7a1a1a", background: "rgba(60,10,10,0.8)", padding: 20, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: "#f87171", letterSpacing: 4, marginBottom: 8 }}>{party[pendingFateIndex]?.name} HAS FALLEN</div>
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#b87070", marginBottom: 16 }}>
              {party[pendingFateIndex]?.name} has been slain in combat.
            </div>
            <div>
              <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#c09040", marginBottom: 12 }}>
                The Emperor provides... Spend a Fate Point to survive at 1 HP?
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => spendFateToSurvive(pendingFateIndex)} style={{ borderColor: "#6a8060", color: "#80c080", padding: "10px 20px" }}>
                  ✦ Spend Fate ({party[pendingFateIndex]?.fate} remaining)
                </button>
                  <button onClick={() => confirmPartyMemberDeath(pendingFateIndex)} style={{ borderColor: "#7a3a1b", color: "#c07050", padding: "10px 20px" }}>
                    Accept Death
                  </button>
                </div>
              </div>
            </div>
          )}
        
        {allEnemiesDead && (
          <div style={{ border: "1px solid #3a6a3a", background: "rgba(20,40,20,0.8)", padding: 20, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: "#6ee7b7", letterSpacing: 4, marginBottom: 8 }}>VICTORY</div>
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#80b080", marginBottom: 16 }}>
              All enemies defeated! Preparing mission completion...
            </div>
            <button onClick={() => completeMission(true)} style={{ borderColor: "#6a8060", color: "#80c080" }}>
              Continue Mission
            </button>
          </div>
        )}

        {/* Detail Popup */}
        {detailPopup && (
          <CharacterDetailPopup
            char={detailPopup.type === 'party' ? party[detailPopup.index] : null}
            enemy={detailPopup.type === 'enemy' ? encounter?.enemies[detailPopup.index] : null}
            bodyWounds={detailPopup.type === 'party'
              ? (partyBodyWounds[detailPopup.index] || {})
              : (enemyBodyWounds[detailPopup.index] || {})}
            maxWounds={detailPopup.type === 'party'
              ? (party[detailPopup.index]?.wounds || 10)
              : (encounter?.enemies[detailPopup.index]?.wounds || 10)}
            onClose={() => setDetailPopup(null)}
          />
        )}
      </Screen>
    );
  }

  // ── MISSION FLOW FUNCTIONS ───────────────────────────────────
  function startMission() {
    // Point currentCheckIndex at the first combat check (skip any leading skill checks)
    const firstCombatIdx = selectedMission.checks.findIndex(c => c.isCombat);
    setCurrentCheckIndex(firstCombatIdx >= 0 ? firstCombatIdx : 0);
    setCheckResults([]);
    setPartyWounds(party.map(() => 0));
    setCurrentPartyMember(0);
    setEncounter(null);
    setFateSpentInMission(party.map(() => false));
    setSelectedMovementTarget(null);
    setCurrentTurn(0);

    const environment = getEnvironmentFromMission(selectedMission);
    const rank = getRank(party[0].xp || 0);
    const missionWithRank = { ...selectedMission, rank };
    const generatedEncounter = generateEncounter(missionWithRank, environment, rank);
    setEncounter(generatedEncounter);
    setEnemyWounds(generatedEncounter.enemies.map(e => e.wounds));
    setCurrentEnemy(0);
    
    // Initialize grid positions
    const partyPositions = party.map((p, i) => ({
      x: 1 + (i % 2) * 2,
      y: 5 + i * 3,
    }));
    
    const enemyPositions = generatedEncounter.enemies.map((e, i) => ({
      x: 18 - (i % 2) * 2,
      y: 5 + i * 3,
    }));
    
    const generatedTerrain = generateTerrain();
    setTerrain(generatedTerrain);
    terrainRef.current = generatedTerrain;
    setGridPositions({ party: partyPositions, enemies: enemyPositions });
    setPartyBodyWounds(party.map(() => emptyBodyWounds()));
    setEnemyBodyWounds(generatedEncounter.enemies.map(() => emptyBodyWounds()));

    // Each party member starts with their first equipped weapon readied
    const initActiveWeapons = {};
    party.forEach((p, i) => {
      const ws = getCharWeapons(p);
      if (ws.length > 0) initActiveWeapons[i] = ws[0].id;
    });
    setActiveWeapons(initActiveWeapons);
    setEnemyPinned(generatedEncounter.enemies.map(() => false));
    setPartyReactionsUsed(party.map(() => false));
    setEnemyReactionsUsed(generatedEncounter.enemies.map(() => false));
    setRemainingAction('full');
    setFireMode('single');

    // Calculate initiative
    const initiative = [];
    
    party.forEach((p, i) => {
      const agi = p.stats.agility || 20;
      const per = p.stats.perception || 20;
      const stat = Math.max(agi, per);
      const roll = d100();
      const total = roll + stat;
      initiative.push({
        type: 'party',
        index: i,
        name: p.name,
        roll,
        stat,
        total,
      });
    });

    generatedEncounter.enemies.forEach((e, i) => {
      const agi = e.stats.agility || 20;
      const per = e.stats.perception || 20;
      const stat = Math.max(agi, per);
      const roll = d100();
      const total = roll + stat;
      initiative.push({
        type: 'enemy',
        index: i,
        name: e.name,
        roll,
        stat,
        total,
      });
    });
    
    initiative.sort((a, b) => b.total - a.total);
    
    console.log("Generated encounter enemies:", generatedEncounter.enemies);
    console.log("Party count:", party.length);
    console.log("Initiative array:", initiative);
    
    setInitiativeOrder(initiative);
    console.log("Initiative set:", initiative);
    setCurrentTurn(0);
    
    // Log initiative results
    const logEntries = initiative.map((entry, idx) => 
      `${idx + 1}. ${entry.name} (${entry.type === 'party' ? 'Party' : 'Enemy'}): ${entry.roll} + ${entry.stat} = ${entry.total}`
    );
    setCombatLog([{ type: "system", text: "=== INITIATIVE ===" }, ...logEntries.map(t => ({ type: "system", text: t })), { type: "system", text: `Combat begins with ${generatedEncounter.enemies.length} enemy/enemies!` }]);
    setCombatAction('movement');
    setPhase("combat");
    
    // Trigger first actor's turn after a short delay
    const partyPos = partyPositions;
    const enemyPos = enemyPositions;
    setTimeout(() => {
      const firstActor = initiative[0];
      if (firstActor?.type === 'enemy') {
        enemyTurn(0, initiative, partyPos, enemyPos);
      }
    }, 500);
  }

  function resolveSkillCheck() {
    const currentCheck = selectedMission.checks[currentCheckIndex];
    // Use current party member for the skill check
    const char = party[currentPartyMember];
    const statValue = char.stats[currentCheck.stat] || 20;
    const roll = d100();
    const passed = roll <= statValue;
    const margin = passed ? statValue - roll : roll - statValue;
    const extreme = margin >= 30;
    
    const result = {
      label: `${currentCheck.label} (${char.name})`,
      flavor: currentCheck.flavor,
      stat: currentCheck.stat,
      statValue,
      difficulty: currentCheck.difficulty,
      roll,
      passed,
      margin,
      extreme,
      isCombat: false,
      character: char.name,
    };
    
    const newResults = [...checkResults, result];
    setCheckResults(newResults);
    
    // Move to next party member
    const nextPartyMember = (currentPartyMember + 1) % party.length;
    setCurrentPartyMember(nextPartyMember);
    
    // Check if there are more checks
    const nextIndex = currentCheckIndex + 1;
    
    if (nextIndex < selectedMission.checks.length) {
      // More checks to go
      const nextCheck = selectedMission.checks[nextIndex];
      setCurrentCheckIndex(nextIndex);
      
      if (nextCheck.isCombat) {
        // Generate encounter for next combat check
        const environment = getEnvironmentFromMission(selectedMission);
        const rank = getRank(party[0].xp || 0);
        const missionWithRank = { ...selectedMission, rank };
        const generatedEncounter = generateEncounter(missionWithRank, environment, rank);
        setEncounter(generatedEncounter);
        setEnemyWounds(generatedEncounter.enemies.map(e => e.wounds));
        setCurrentEnemy(0);
        setCombatLog([{ type: "system", text: `Combat begins with ${generatedEncounter.enemies.length} enemy/enemies!` }]);
        setPhase("combat");
      } else {
        setPhase("skill_check");
      }
    } else {
      // All checks done, show results
      finishMission(newResults);
    }
  }

  function finishMission(results) {
    const passes = results.filter(r => r.passed).length;
    const fails = results.filter(r => !r.passed).length;
    const success = passes > fails;
    
    // Calculate XP
    const totalMargin = results.filter(r => r.passed).reduce((sum, r) => sum + r.margin, 0);
    const bonusXP = Math.floor(totalMargin / 10) * 10;
    const baseXP = success ? selectedMission.xpSuccess : selectedMission.xpFailure;
    const totalXP = success ? baseXP + bonusXP : baseXP;
    
    // Distribute XP among party members (each gets full XP)
    // Update all party members
    party.forEach((p, i) => {
      const wounds = partyWounds[i] || 0;
      const rosterIdx = p.rosterIndex;
      const currentRoster = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
      const existingChar = currentRoster[rosterIdx];
      if (existingChar) {
        const updatedChar = {
          ...existingChar,
          xp: (existingChar.xp || 0) + totalXP,
          wounds: Math.max(1, (p.wounds || 10) - wounds),
        };
        currentRoster[rosterIdx] = updatedChar;
      }
    });
    localStorage.setItem("dhgen_roster", JSON.stringify(JSON.parse(localStorage.getItem("dhgen_roster") || "[]")));
    
    setResults(results);
    setXpGained(totalXP);
    setPhase("results");
  }

  // ── GRID FUNCTIONS ─────────────────────────────────────────────
  function handleGridClick(x, y) {
    // Shooting mode: player is picking a target
    if (shootingMode) {
      playerRangedShot(x, y);
      return;
    }

    // Only handle if it's a player's turn in movement mode
    if (combatAction !== 'movement') return;
    
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;
    
    const actorIdx = actor.index;
    const currentPos = gridPositions.party[actorIdx];
    const agi = party[actorIdx].stats.agility || 20;
    const moveRange = Math.floor(agi / 10) + 4;
    
    // Calculate Manhattan distance
    const distance = Math.abs(x - currentPos.x) + Math.abs(y - currentPos.y);
    
    // Check if move is valid (within range and not occupied)
    if (distance > moveRange) {
      console.log(`Too far! Distance: ${distance}, Range: ${moveRange}`);
      setCombatLog(prev => [...prev, { type: "system", text: `Too far! Movement range: ${moveRange}` }]);
      return;
    }
    
    // Check if position is occupied by another party member
    const occupied = gridPositions.party.some((p, i) => i !== actorIdx && p.x === x && p.y === y);
    if (occupied) {
      setCombatLog(prev => [...prev, { type: "system", text: "Position occupied by another party member!" }]);
      return;
    }
    
    // Check if position is occupied by an enemy
    const enemyOccupied = gridPositions.enemies.some(e => e.x === x && e.y === y);
    if (enemyOccupied) {
      setCombatLog(prev => [...prev, { type: "system", text: "Cannot move into enemy space!" }]);
      return;
    }

    // Check if position is a cover barrier (impassable)
    if (isCoverTile(x, y, terrain)) {
      setCombatLog(prev => [...prev, { type: "system", text: "That tile is blocked by a barrier!" }]);
      return;
    }
    
    // Valid move - update position
    const newPartyPositions = [...gridPositions.party];
    newPartyPositions[actorIdx] = { x, y };
    setGridPositions(prev => ({ ...prev, party: newPartyPositions }));
    
    setCombatLog(prev => [...prev, { type: "player", text: `${party[actorIdx].name} moves ${distance} squares.` }]);
    setRemainingAction('half'); // Moving costs the half action
    // After moving, switch to attack phase
    setCombatAction('attack');
  }
  
  // ── RANGED SHOT (grid-click targeting) ──────────────────────────
  function playerRangedShot(targetX, targetY) {
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;

    const char = party[actor.index];
    const attackerPos = gridPositions.party[actor.index];
    const activeWep = getActiveWeapon(char, actor.index, activeWeapons);

    if (!activeWep || activeWep.type === 'Melee') {
      setCombatLog(prev => [...prev, { type: "system", text: `${char.name} has no ranged weapon readied!` }]);
      setShootingMode(false);
      return;
    }

    // Find enemy at exact position first, then nearest within 2 squares
    let targetIdx = -1;
    enemyWounds.forEach((w, idx) => {
      if (w > 0 && gridPositions.enemies[idx]?.x === targetX && gridPositions.enemies[idx]?.y === targetY) {
        targetIdx = idx;
      }
    });
    if (targetIdx === -1) {
      let nearestDist = Infinity;
      enemyWounds.forEach((w, idx) => {
        if (w > 0) {
          const ep = gridPositions.enemies[idx];
          const dist = Math.abs(ep.x - targetX) + Math.abs(ep.y - targetY);
          if (dist < nearestDist && dist <= 2) { nearestDist = dist; targetIdx = idx; }
        }
      });
    }
    if (targetIdx === -1) {
      setCombatLog(prev => [...prev, { type: "system", text: "No enemy at that position — click an orange tile." }]);
      return; // keep shooting mode active
    }

    // ── Range check (before committing — keeps shooting mode active on fail) ──
    const target = encounter.enemies[targetIdx];
    const weaponRangeM = parseRangeMeters(activeWep.range);
    const targetEnemyPos = gridPositions.enemies[targetIdx];
    const distTiles = Math.abs(targetEnemyPos.x - attackerPos.x) + Math.abs(targetEnemyPos.y - attackerPos.y);
    const { modifier: rangeMod, band: rangeBand } = getRangeBand(distTiles, weaponRangeM);

    if (rangeMod === null) {
      setCombatLog(prev => [...prev, { type: "system", text: `Out of range! ${target.name} is ${distTiles * 3}m away — max Extreme range is ${weaponRangeM * 3}m.` }]);
      return; // keep shooting mode active so player can pick a closer target
    }

    // LoS check — platforms block shots
    if (!hasLineOfSight(attackerPos, targetEnemyPos, terrain)) {
      setCombatLog(prev => [...prev, { type: "system", text: `No line of sight to ${target.name} — a platform is blocking the shot!` }]);
      return; // keep shooting mode active
    }

    setShootingMode(false);
    const per = char.stats.perception || 20;
    const rof = parseRoF(activeWep.rateOfFire);
    const mode = fireMode; // 'single' | 'semi' | 'full' — captured from state closure

    // To-hit modifier: range band (base) + aim bonus (single only) + full-auto penalty + elevation
    let hitMod = rangeMod;
    if (aiming && mode === 'single') hitMod += 20;
    if (mode === 'full') hitMod -= 10;
    const shooterElevated = isOnPlatform(attackerPos, terrain);
    const targetElevated  = isOnPlatform(targetEnemyPos, terrain);
    if (shooterElevated && !targetElevated) hitMod += 20;
    const targetNum = Math.min(100, Math.max(5, per + hitMod));
    const roll = d100();
    const hit = roll <= targetNum;
    // Degrees of Success: every full 10 below the target = 1 DoS → 1 extra hit
    const dos = hit ? Math.floor((targetNum - roll) / 10) : 0;

    const modeLabel = mode === 'semi' ? 'Semi-Auto Burst' : mode === 'full' ? 'Full Auto' : (aiming ? 'Aimed Shot' : 'Single Shot');

    // Build a readable modifier breakdown so each component is visible
    const modParts = [];
    const fmt = n => n > 0 ? `+${n}` : `${n}`;
    if (rangeMod !== 0) modParts.push(`${fmt(rangeMod)} ${rangeBand}`);
    if (aiming && mode === 'single') modParts.push('+20 Aim');
    if (mode === 'full') modParts.push('−10 FA');
    if (shooterElevated && !targetElevated) modParts.push('+20 Elevation');
    const modBreakdown = modParts.length ? ` [${modParts.join(', ')}]` : '';
    const netStr = hitMod > 0 ? `+${hitMod}` : hitMod < 0 ? `${hitMod}` : '±0';

    // Full Auto jam: 94–100 = weapon jam, turn lost (show 2 misfiring rounds)
    if (mode === 'full' && roll >= 94) {
      setCombatLog(prev => [...prev, {
        type: "system",
        text: `${char.name} fires ${activeWep.name} [Full Auto] — WEAPON JAM! (rolled ${roll}) — turn lost!`,
      }]);
      eventBridge.emit('combat-shot', { fromPos: attackerPos, toPos: targetEnemyPos, count: 2, isHit: false, weaponClass: activeWep.class });
      setAiming(false);
      setFireMode('single');
      setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 1000);
      return;
    }

    let log = [];

    // ── Animation: always fire the full RoF count so LMG shows 10 tracers ──
    const animCount = mode === 'semi' ? (rof.semiAuto || 1)
                    : mode === 'full' ? (rof.fullAuto || 1)
                    : 1;
    eventBridge.emit('combat-shot', {
      fromPos: attackerPos,
      toPos: targetEnemyPos,
      count: animCount,
      isHit: hit,
      weaponClass: activeWep.class,
    });

    // ── Per-round hit resolution (recoil −5/round, scatter on miss) ──────
    const weaponAccuracy = activeWep.accuracy ?? 0;
    const rounds = mode === 'single' ? 1
                 : mode === 'semi'   ? (rof.semiAuto || 3)
                 :                     (rof.fullAuto  || 10);

    if (mode === 'single') {
      log.push({ type: "player", text: `${char.name} [${modeLabel}] at ${target.name} — ${rangeBand} (${distTiles * 3}m)${modBreakdown} · PER ${per} = ${targetNum} (net ${netStr}): rolled ${roll}... ${hit ? 'HIT!' : 'MISS!'}` });
    } else {
      log.push({ type: "player", text: `${char.name} [${modeLabel} ×${rounds}] at ${target.name} — ${rangeBand} (${distTiles * 3}m)${modBreakdown} · PER ${per} = ${targetNum} (−5 recoil/round)` });
    }

    const newEnemyWounds = [...enemyWounds];
    let totalHitsOnTarget = 0;
    let firstHitRoll      = null;
    let scatterHits       = 0;
    let allDefeated       = false;

    for (let r = 0; r < rounds; r++) {
      const recoilPenalty = r * 5;
      const roundTarget   = Math.max(5, targetNum - recoilPenalty);
      const roundRoll     = r === 0 ? roll : d100(); // reuse initial roll for round 0 (jam-safe)
      const roundHit      = roundRoll <= roundTarget;

      if (mode !== 'single') {
        log.push({ type: "player", text: `  Rnd ${r + 1}: target ${roundTarget}${recoilPenalty ? ` (−${recoilPenalty} recoil)` : ''} → rolled ${roundRoll}... ${roundHit ? 'HIT' : 'miss'}` });
      }

      if (roundHit) {
        totalHitsOnTarget++;
        if (firstHitRoll === null) firstHitRoll = roundRoll;
      } else if (mode !== 'single' && weaponAccuracy > 0) {
        // Scatter: any living non-target enemy within the cone gets a stray-round chance
        enemyWounds.forEach((w, eIdx) => {
          if (eIdx === targetIdx || newEnemyWounds[eIdx] <= 0) return;
          const ep       = gridPositions.enemies[eIdx];
          const perpDist = perpDistToRay(ep.x, ep.y, attackerPos.x, attackerPos.y, targetEnemyPos.x, targetEnemyPos.y);
          if (perpDist > weaponAccuracy) return;
          // Linear falloff: 30% at centre → 0% at the cone edge (perpDist == weaponAccuracy)
          const hitChance = Math.max(0, Math.round(30 * (1 - perpDist / weaponAccuracy)));
          if (d100() <= hitChance) {
            scatterHits++;
            const scatEnemy = encounter.enemies[eIdx];
            // ── Scatter dodge check (uses reaction, same rules as direct fire) ──
            let scatDodged = false;
            if (enemyReactionsUsedRef.current[eIdx]) {
              log.push({ type: "enemy", text: `  ↳ ${scatEnemy.name} has no reactions left — can't dodge scatter!` });
            } else {
              const scatDodgeRoll   = d100();
              const { target: scatDodgeTgt, label: scatDodgeLbl } = getEnemyDodgeTarget(scatEnemy);
              scatDodged = scatDodgeRoll <= scatDodgeTgt;
              const nr = [...enemyReactionsUsedRef.current];
              nr[eIdx] = true;
              enemyReactionsUsedRef.current = nr;
              setEnemyReactionsUsed(nr);
              if (scatDodged) {
                log.push({ type: "enemy", text: `  ↳ ${scatEnemy.name} dodges scatter! (${scatDodgeLbl} ${scatDodgeTgt}: rolled ${scatDodgeRoll})` });
              } else {
                log.push({ type: "enemy", text: `  ↳ ${scatEnemy.name} fails to dodge scatter (${scatDodgeRoll}/${scatDodgeTgt})` });
              }
            }
            if (!scatDodged) {
              const scatDmg   = rollDamageDice(activeWep.damage, char.stats.psyRating || 0);
              const scatArmor = Math.max(0, (scatEnemy.armor || 0) - (activeWep.pen || 0));
              const scatTb    = Math.floor((scatEnemy.stats?.toughness || 0) / 10);
              const scatNet   = Math.max(1, scatDmg - scatArmor - scatTb);
              log.push({ type: "player", text: `  ↳ Rnd ${r + 1} scatter → ${scatEnemy.name}: ${scatDmg} − Armor ${scatArmor}${scatTb ? ` − TB${scatTb}` : ''} = ${scatNet} dmg` });
              newEnemyWounds[eIdx] = Math.max(0, newEnemyWounds[eIdx] - scatNet);
              if (newEnemyWounds[eIdx] <= 0) {
                eventBridge.emit('combat-death', { targetType: 'enemy', targetIndex: eIdx });
                log.push({ type: "player", text: `  ↳ ${scatEnemy.name} is DEFEATED by scatter fire!` });
                if (newEnemyWounds.every(w2 => w2 <= 0)) allDefeated = true;
              }
            }
          }
        });
      }
    }

    // ── Burst summary ─────────────────────────────────────────────
    if (mode !== 'single') {
      const missCount = rounds - totalHitsOnTarget;
      log.push({ type: "player", text: `[Burst: ${totalHitsOnTarget} hit / ${missCount} miss${scatterHits > 0 ? `, ${scatterHits} scatter` : ''}]` });
    }

    // ── Reaction gate: enemy can dodge/parry the entire burst once ────────
    if (totalHitsOnTarget > 0 && !allDefeated) {
      let dodged = false;
      if (enemyReactionsUsedRef.current[targetIdx]) {
        log.push({ type: "enemy", text: `${target.name} has no reactions left — cannot dodge!` });
      } else {
        const dodgeRoll    = d100();
        const { target: dodgeTarget2, label: dodgeLbl2 } = getEnemyDodgeTarget(target);
        dodged = dodgeRoll <= dodgeTarget2;
        if (dodged) {
          log.push({ type: "enemy", text: `${target.name} DODGES the burst! (${dodgeLbl2} ${dodgeTarget2}: rolled ${dodgeRoll})` });
        } else {
          log.push({ type: "enemy", text: `${target.name} fails to dodge (rolled ${dodgeRoll}/${dodgeTarget2})` });
        }
        // Reaction spent regardless of success/failure
        setEnemyReactionsUsed(prev => { const n = [...prev]; n[targetIdx] = true; return n; });
        enemyReactionsUsedRef.current[targetIdx] = true;
      }

      if (!dodged) {
        const firstLoc = hitLocation(firstHitRoll ?? roll);
        for (let h = 0; h < totalHitsOnTarget; h++) {
          if (newEnemyWounds[targetIdx] <= 0) break;
          const loc     = subsequentHitLoc(firstLoc, h);
          const hitLabel = totalHitsOnTarget > 1 ? `Hit ${h + 1}: ` : '';
          // Cover save: lower-body hits stopped by partial cover
          if (COVERED_LOCS.has(loc) && hasCoverVsShooter(targetEnemyPos, attackerPos, terrain)) {
            log.push({ type: "system", text: `${hitLabel}${loc} — absorbed by cover! The barrier blocks the shot.` });
            continue;
          }
          const rawDmg  = rollDamageDice(activeWep.damage, char.stats.psyRating || 0);
          eventBridge.emit('combat-hit', { targetType: 'enemy', targetIndex: targetIdx });
          const effectiveArmor = Math.max(0, (target.armor || 0) - (activeWep.pen || 0));
          const tb       = Math.floor((target.stats?.toughness || 0) / 10);
          const finalDmg = Math.max(1, rawDmg - effectiveArmor - tb);
          log.push({ type: "player", text: `${hitLabel}${loc}! ${rawDmg} dmg − Armor ${effectiveArmor}${tb ? ` − TB${tb}` : ''} = ${finalDmg}` });
          newEnemyWounds[targetIdx] = Math.max(0, newEnemyWounds[targetIdx] - finalDmg);
          setEnemyBodyWounds(prev => {
            const upd = prev.map(bw => ({ ...bw }));
            if (upd[targetIdx]) upd[targetIdx] = { ...upd[targetIdx], [loc]: (upd[targetIdx][loc] || 0) + finalDmg };
            return upd;
          });
          if (newEnemyWounds[targetIdx] <= 0) {
            eventBridge.emit('combat-death', { targetType: 'enemy', targetIndex: targetIdx });
            log.push({ type: "player", text: `The ${target.name} is DEFEATED!` });
            if (newEnemyWounds.every(w => w <= 0)) allDefeated = true;
            break;
          }
        }
        if (newEnemyWounds[targetIdx] > 0) {
          log.push({ type: "player", text: `${target.name}: ${newEnemyWounds[targetIdx]}/${target.wounds} wounds remaining.` });
        }
      }
    }

    setEnemyWounds(newEnemyWounds);
    setCombatLog(prevLog => [...prevLog, ...log]);
    setAiming(false);
    setFireMode('single');
    if (!allDefeated) {
      setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, newEnemyWounds), 1000);
    }
  }

  // ── SUPPRESSIVE FIRE ───────────────────────────────────────────
  function playerSuppressiveFire() {
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;

    const char = party[actor.index];
    const attackerPos = gridPositions.party[actor.index];
    const activeWep = getActiveWeapon(char, actor.index, activeWeapons);

    if (!activeWep || activeWep.type === 'Melee') {
      setCombatLog(prev => [...prev, { type: "system", text: `${char.name} has no ranged weapon for suppressive fire!` }]);
      return;
    }

    const per = char.stats.perception || 20;
    const targetNum = Math.max(5, per - 20); // −20 penalty
    const roll = d100();
    const hit = roll <= targetNum;
    const dos = hit ? Math.floor((targetNum - roll) / 10) : 0;

    let log = [{ type: "player", text: `${char.name} lays down suppressive fire [${activeWep.name}] (PER ${per} −20 = ${targetNum}): rolled ${roll}... ${hit ? `Effective! (${dos} DoS)` : 'Suppressing!'}` }];

    // All living enemies must make a Willpower Pinning Test
    const newPinned = [...enemyPinned];
    encounter.enemies.forEach((enemy, i) => {
      if ((enemyWounds[i] || 0) <= 0) return;
      const wp = enemy.stats.willpower || 20;
      const pinRoll = d100();
      const pinFails = pinRoll > wp; // fail WP test = pinned
      if (pinFails) {
        newPinned[i] = true;
        log.push({ type: "player", text: `${enemy.name} is PINNED! (WP ${wp}: rolled ${pinRoll}) — −20 on next attack.` });
      } else {
        log.push({ type: "enemy", text: `${enemy.name} holds position (WP ${wp}: rolled ${pinRoll}).` });
      }
    });
    setEnemyPinned(newPinned);

    const newEnemyWounds = [...enemyWounds];
    // One random hit if attack roll succeeded
    if (hit) {
      const livingIdxs = encounter.enemies.map((_, i) => i).filter(i => (newEnemyWounds[i] || 0) > 0);
      if (livingIdxs.length > 0) {
        const randomIdx = livingIdxs[Math.floor(Math.random() * livingIdxs.length)];
        const randTarget = encounter.enemies[randomIdx];
        const loc = hitLocation(roll);
        const rawDmg = rollDamageDice(activeWep.damage, char.stats.psyRating || 0);
        const effectiveArmor = Math.max(0, (randTarget.armor || 0) - (activeWep.pen || 0));
        const tb       = Math.floor((randTarget.stats?.toughness || 0) / 10);
        const finalDmg = Math.max(1, rawDmg - effectiveArmor - tb);
        log.push({ type: "player", text: `Suppressive hit on ${randTarget.name}! ${loc}: ${rawDmg} dmg − Armor ${effectiveArmor}${tb ? ` − TB${tb}` : ''} = ${finalDmg}` });
        newEnemyWounds[randomIdx] = Math.max(0, newEnemyWounds[randomIdx] - finalDmg);
        setEnemyBodyWounds(prev => {
          const upd = prev.map(bw => ({ ...bw }));
          if (upd[randomIdx]) upd[randomIdx] = { ...upd[randomIdx], [loc]: (upd[randomIdx][loc] || 0) + finalDmg };
          return upd;
        });
        if (newEnemyWounds[randomIdx] <= 0) {
          eventBridge.emit('combat-death', { targetType: 'enemy', targetIndex: randomIdx });
          log.push({ type: "player", text: `The ${randTarget.name} is DEFEATED!` });
        }
      }
    }
    setEnemyWounds(newEnemyWounds);

    // Suppressive shot animation — full RoF count of tracers (always the full magazine burst)
    const suppRof = parseRoF(activeWep.rateOfFire);
    const suppAnimCount = suppRof.fullAuto || suppRof.semiAuto || 4;
    const suppToPos = gridPositions.enemies.find((_, i) => (newEnemyWounds[i] || 0) > 0) || gridPositions.enemies[0];
    eventBridge.emit('combat-shot', {
      fromPos: attackerPos, toPos: suppToPos, count: suppAnimCount, isHit: hit, weaponClass: activeWep.class, suppressive: true,
    });

    setCombatLog(prevLog => [...prevLog, ...log]);
    setAiming(false);
    setFireMode('single');
    const allDefeated = newEnemyWounds.every(w => w <= 0);
    if (!allDefeated) {
      setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, newEnemyWounds), 1000);
    }
  }

  function advanceInitiative(turnIndex, initiativeArray, partyPositions, enemyPositions, currentEnemyWounds) {
    const currentTurnIndex = turnIndex !== undefined ? turnIndex : currentTurn;
    const init = initiativeArray || initiativeOrder;
    const partyPos = partyPositions || gridPositions.party;
    const enemyPos = enemyPositions || gridPositions.enemies;
    const eWounds = currentEnemyWounds !== undefined ? currentEnemyWounds : enemyWounds;
    let nextTurn = currentTurnIndex + 1;
    
    // Skip dead combatants
    while (nextTurn < init.length) {
      const entry = init[nextTurn];
      const isDead = entry.type === 'party'
        ? (partyWoundsRef.current[entry.index] || 0) >= (party[entry.index]?.wounds || 10)
        : (eWounds[entry.index] || 0) <= 0;

      console.log("Dead check: entry", nextTurn, "=", entry.name, "type:", entry.type, "index:", entry.index, "isDead:", isDead, "wounds:", entry.type === 'party' ? partyWoundsRef.current[entry.index] : enemyWounds[entry.index]);

      if (!isDead) break;
      nextTurn++;
    }

    // If we've gone through all combatants, loop back (new round)
    if (nextTurn >= init.length) {
      nextTurn = 0;
      // Skip dead at start of new round too
      while (nextTurn < init.length) {
        const entry = init[nextTurn];
        const isDead = entry.type === 'party'
          ? (partyWoundsRef.current[entry.index] || 0) >= (party[entry.index]?.wounds || 10)
          : (eWounds[entry.index] || 0) <= 0;
        
        if (!isDead) break;
        nextTurn++;
      }
    }
    
    console.log("advanceInitiative: currentTurn =", currentTurnIndex, "nextTurn =", nextTurn, "init.length =", init.length);

    // Refresh the incoming actor's reaction for this turn
    const incomingActor = init[nextTurn];
    if (incomingActor?.type === 'party') {
      setPartyReactionsUsed(prev => { const n = [...prev]; n[incomingActor.index] = false; return n; });
    } else if (incomingActor?.type === 'enemy') {
      setEnemyReactionsUsed(prev => { const n = [...prev]; n[incomingActor.index] = false; return n; });
    }

    setCurrentTurn(nextTurn);
    setCombatAction('movement'); // Reset to movement phase for next actor
    setAiming(false);            // Clear any aim bonus from previous turn
    setShootingMode(false);      // Cancel any pending targeting
    setRemainingAction('full');  // Each new turn starts with a full action available
    setFireMode('single');       // Reset fire mode to single
    
    // Check if all enemies are dead
    const allEnemyDead = eWounds.every(w => w <= 0);
    if (allEnemyDead) {
      console.log("advanceInitiative: all enemies dead, not scheduling enemy turn");
      return;
    }
    
    // If it's an enemy's turn, schedule their action
    const nextActor = init[nextTurn];
    console.log("advanceInitiative: nextActor =", nextActor);
    if (nextActor?.type === 'enemy') {
      console.log("Scheduling enemy turn for index:", nextTurn);
      setTimeout(() => {
        console.log("Calling enemyTurn with currentTurn:", nextTurn);
        enemyTurn(nextTurn, init, partyPos, enemyPos);
      }, 1000);
    }
  }
  
  // ── COMBAT FUNCTIONS ───────────────────────────────────────────
  // Not used anymore - startMission goes straight to combat
  function startCombat() {
    // This function is kept for compatibility but startMission now handles everything
    startMission();
  }

  function playerAttack(attackType = 'standard', targetIdx = null) {
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;

    const char = party[actor.index];
    const attackerPos = gridPositions.party[actor.index];

    // ── IMPROVISED (ranged weapon used as a club) ────────────────
    if (attackType === 'improvised') {
      const impWeapon = getActiveWeapon(char, actor.index, activeWeapons);

      const adjacentEnemiesImp = [];
      enemyWounds.forEach((wounds, idx) => {
        if (wounds > 0) {
          const ep = gridPositions.enemies[idx];
          if (Math.max(Math.abs(ep.x - attackerPos.x), Math.abs(ep.y - attackerPos.y)) <= 1)
            adjacentEnemiesImp.push({ index: idx, enemy: encounter.enemies[idx] });
        }
      });
      if (adjacentEnemiesImp.length === 0) {
        setCombatLog(prev => [...prev, { type: "player", text: "No enemy in reach! Move closer to improvise." }]);
        return;
      }
      const { index: impIdx, enemy: impEnemy } = adjacentEnemiesImp[0];
      const impTargetNum = Math.min(100, char.stats.meleeSkill || 20);
      const impRoll = d100();
      const impHit  = impRoll <= impTargetNum;
      const impDos  = impHit ? Math.floor((impTargetNum - impRoll) / 10) : 0;

      let log = [{ type: "player", text: `${char.name} swings ${impWeapon?.name} as a club at ${impEnemy.name} (MEL ${char.stats.meleeSkill || 20} = ${impTargetNum}): rolled ${impRoll}... ${impHit ? `HIT! (${impDos} DoS)` : 'MISS!'}` }];

      if (impHit) {
        const loc = hitLocation(impRoll);
        const sb = getStrBonus(char.stats.strength || 20);
        const rawDmg = rollDamageDice('1d5', 0) + sb; // blunt improvised — 1d5+SB, pen 0

        let reactionBlocked = false;
        if (enemyReactionsUsedRef.current[impIdx]) {
          log.push({ type: "enemy", text: `${impEnemy.name} has no reactions left — cannot dodge!` });
        } else {
          const dodgeRoll = d100();
          const { target: dodgeTarget, label: dodgeLbl } = getEnemyDodgeTarget(impEnemy);
          setEnemyReactionsUsed(prev => { const n = [...prev]; n[impIdx] = true; return n; });
          enemyReactionsUsedRef.current[impIdx] = true;
          if (dodgeRoll <= dodgeTarget) {
            log.push({ type: "enemy", text: `${impEnemy.name} DODGES! (${dodgeLbl} ${dodgeTarget}: rolled ${dodgeRoll})` });
            reactionBlocked = true;
          } else {
            const canParry = (impEnemy.weapons || []).some(w => w.type === 'Melee');
            if (canParry) {
              const parryRoll = d100();
              const parryTarget = impEnemy.stats.meleeSkill || 20;
              if (parryRoll <= parryTarget) {
                log.push({ type: "enemy", text: `${impEnemy.name} PARRIES! (MEL ${parryTarget}: rolled ${parryRoll})` });
                reactionBlocked = true;
              } else {
                log.push({ type: "enemy", text: `${impEnemy.name} failed to react (dodge ${dodgeRoll}/${dodgeTarget}, parry ${parryRoll}/${parryTarget})` });
              }
            } else {
              log.push({ type: "enemy", text: `${impEnemy.name} failed to dodge (rolled ${dodgeRoll}/${dodgeTarget})` });
            }
          }
        }
        if (!reactionBlocked) {
          eventBridge.emit('combat-hit', { targetType: 'enemy', targetIndex: impIdx });
          const effectiveArmor = Math.max(0, impEnemy.armor || 0); // pen 0 for improvised
          const tb       = Math.floor((impEnemy.stats?.toughness || 0) / 10);
          const finalDmg = Math.max(1, rawDmg - effectiveArmor - tb);
          log.push({ type: "player", text: `Hit ${loc}! ${rawDmg} dmg (1d5+SB${sb}) − Armor ${effectiveArmor}${tb ? ` − TB${tb}` : ''} = ${finalDmg}` });

          const newEnemyWounds = [...enemyWounds];
          newEnemyWounds[impIdx] = Math.max(0, newEnemyWounds[impIdx] - finalDmg);
          setEnemyWounds(newEnemyWounds);
          setEnemyBodyWounds(prev => {
            const upd = prev.map(bw => ({ ...bw }));
            if (upd[impIdx]) upd[impIdx] = { ...upd[impIdx], [loc]: (upd[impIdx][loc] || 0) + finalDmg };
            return upd;
          });
          log.push({ type: "player", text: `${impEnemy.name}: ${Math.max(0, newEnemyWounds[impIdx])}/${impEnemy.wounds} wounds remaining.` });
          if (newEnemyWounds[impIdx] <= 0) {
            eventBridge.emit('combat-death', { targetType: 'enemy', targetIndex: impIdx });
            log.push({ type: "player", text: `The ${impEnemy.name} is DEFEATED!` });
            if (newEnemyWounds.every(w => w <= 0)) { setCombatLog(prev => [...prev, ...log]); return; }
          }
        }
      }
      setCombatLog(prevLog => [...prevLog, ...log]);
      setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 1000);
      return;
    }

    // ── MELEE ATTACK (standard / allout) ─────────────────────────
    // Find adjacent enemies (Chebyshev distance = 1)
    const adjacentEnemies = [];
    enemyWounds.forEach((wounds, idx) => {
      if (wounds > 0) {
        const ep = gridPositions.enemies[idx];
        const dx = Math.abs(ep.x - attackerPos.x);
        const dy = Math.abs(ep.y - attackerPos.y);
        if (Math.max(dx, dy) <= 1) adjacentEnemies.push({ index: idx, enemy: encounter.enemies[idx] });
      }
    });

    if (adjacentEnemies.length === 0) {
      setCombatLog(prev => [...prev, { type: "player", text: "No enemy in melee range! Move closer to attack." }]);
      return;
    }

    const chosenTarget = targetIdx !== null
      ? (adjacentEnemies.find(e => e.index === targetIdx) ?? adjacentEnemies[0])
      : adjacentEnemies[0];
    const { index: enemyIdx, enemy } = chosenTarget;
    // Use the readied weapon; fall back to first melee weapon if active is somehow ranged
    const activeWep = getActiveWeapon(char, actor.index, activeWeapons);
    const weapon = (activeWep?.type === 'Melee') ? activeWep : getCharMeleeWeapon(char);

    // 1. Determine Target Number
    const attackMod  = attackType === 'allout' ? 20 : 0;
    // Ganging Up: count OTHER living party members adjacent to this enemy
    const gangCount = gridPositions.party.filter((pos, idx) => {
      if (idx === actor.index) return false;
      if ((partyWounds[idx] || 0) >= (party[idx]?.wounds || 10)) return false;
      const ep = gridPositions.enemies[enemyIdx];
      return Math.max(Math.abs(pos.x - ep.x), Math.abs(pos.y - ep.y)) <= 1;
    }).length;
    const gangBonus  = gangCount >= 2 ? 20 : gangCount >= 1 ? 10 : 0;
    const targetNum  = Math.min(100, (char.stats.meleeSkill || 20) + attackMod + gangBonus);

    // 2. Attack Roll
    const roll = d100();
    const hit  = roll <= targetNum;
    const dos  = hit ? Math.floor((targetNum - roll) / 10) : 0;

    const modParts = [];
    if (attackMod)  modParts.push(`${attackType === 'allout' ? 'All-Out' : ''}+${attackMod}`);
    if (gangBonus)  modParts.push(`Gang+${gangBonus}`);
    const modLabel = modParts.length ? ` [${modParts.join(', ')}]` : '';

    let log = [{ type: "player", text: `${char.name} attacks ${enemy.name} with ${weapon.name} (MEL ${char.stats.meleeSkill || 20}${modLabel} = ${targetNum}): rolled ${roll}... ${hit ? `HIT! (${dos} DoS)` : 'MISS!'}` }];

    if (hit) {
      // 3. Hit Location (reverse the roll digits)
      const loc = hitLocation(roll);

      // 4. Damage = weapon dice + Strength Bonus
      const sb     = getStrBonus(char.stats.strength || 20);
      const rawDmg = rollDamageDice(weapon.damage, char.stats.psyRating || 0) + sb;

      // 5. Enemy Reaction: Dodge or Parry (skipped on All-Out Attack or reaction used)
      let reactionBlocked = false;
      if (attackType === 'allout') {
        log.push({ type: "player", text: `All-Out Attack — enemy cannot react!` });
      } else if (enemyReactionsUsedRef.current[enemyIdx]) {
        log.push({ type: "enemy", text: `${enemy.name} has no reactions left — cannot dodge!` });
      } else {
        const dodgeRoll   = d100();
        const { target: dodgeTarget, label: dodgeLbl } = getEnemyDodgeTarget(enemy);
        // Reaction spent regardless of success/failure
        setEnemyReactionsUsed(prev => { const n = [...prev]; n[enemyIdx] = true; return n; });
        enemyReactionsUsedRef.current[enemyIdx] = true;
        if (dodgeRoll <= dodgeTarget) {
          log.push({ type: "enemy", text: `${enemy.name} DODGES! (${dodgeLbl} ${dodgeTarget}: rolled ${dodgeRoll})` });
          reactionBlocked = true;
        } else {
          const canParry = (enemy.weapons || []).some(w => w.type === 'Melee');
          if (canParry) {
            const parryRoll   = d100();
            const parryTarget = enemy.stats.meleeSkill || 20;
            if (parryRoll <= parryTarget) {
              log.push({ type: "enemy", text: `${enemy.name} PARRIES! (MEL ${parryTarget}: rolled ${parryRoll})` });
              reactionBlocked = true;
            } else {
              log.push({ type: "enemy", text: `${enemy.name} failed to react (dodge ${dodgeRoll}/${dodgeTarget}, parry ${parryRoll}/${parryTarget})` });
            }
          } else {
            log.push({ type: "enemy", text: `${enemy.name} failed to dodge (rolled ${dodgeRoll}/${dodgeTarget})` });
          }
        }
      }

      if (!reactionBlocked) {
        eventBridge.emit('combat-hit', { targetType: 'enemy', targetIndex: enemyIdx });

        // Apply Penetration vs Armor and Toughness Bonus
        const effectiveArmor = Math.max(0, (enemy.armor || 0) - (weapon.pen || 0));
        const tb             = Math.floor((enemy.stats?.toughness || 0) / 10);
        const finalDmg       = Math.max(1, rawDmg - effectiveArmor - tb);

        log.push({ type: "player", text: `Hit ${loc}! ${rawDmg} dmg (${weapon.damage}+SB${sb}) − Armor ${effectiveArmor}${tb ? ` − TB${tb}` : ''} = ${finalDmg}` });

        const newEnemyWounds = [...enemyWounds];
        newEnemyWounds[enemyIdx] = Math.max(0, newEnemyWounds[enemyIdx] - finalDmg);
        setEnemyWounds(newEnemyWounds);
        setEnemyBodyWounds(prev => {
          const upd = prev.map(bw => ({ ...bw }));
          if (upd[enemyIdx]) upd[enemyIdx] = { ...upd[enemyIdx], [loc]: (upd[enemyIdx][loc] || 0) + finalDmg };
          return upd;
        });
        log.push({ type: "player", text: `${enemy.name}: ${Math.max(0, newEnemyWounds[enemyIdx])}/${enemy.wounds} wounds remaining.` });

        if (newEnemyWounds[enemyIdx] <= 0) {
          eventBridge.emit('combat-death', { targetType: 'enemy', targetIndex: enemyIdx });
          log.push({ type: "player", text: `The ${enemy.name} is DEFEATED!` });
          if (newEnemyWounds.every(w => w <= 0)) {
            setCombatLog(prevLog => [...prevLog, ...log]);
            return; // Victory — don't advance initiative
          }
        }
      }
    }

    setCombatLog(prevLog => [...prevLog, ...log]);
    setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 1000);
  }

  // Shared ranged-attack resolver used by both ranged-style and melee-fallback AI paths.
  // Returns true if an attack was fired (including jams), false if out of range.
  function enemyRangedAttack(enemy, weapon, fromPos, targetPos, nearestIdx, target, isPinned, log) {
    const weaponRangeM = parseRangeMeters(weapon.range);
    const manhattan    = Math.abs(targetPos.x - fromPos.x) + Math.abs(targetPos.y - fromPos.y);
    const { modifier: rangeMod, band: rangeBand } = getRangeBand(manhattan, weaponRangeM);
    if (rangeMod === null) return false;

    // LoS check — platforms block shots
    const currentTerrain = terrainRef.current;
    if (!hasLineOfSight(fromPos, targetPos, currentTerrain)) {
      log.push({ type: "enemy", text: `${enemy.name} has no line of sight — platform blocking the shot.` });
      return false;
    }

    const rof       = parseRoF(weapon.rateOfFire);
    const mode      = rof.fullAuto > 0 ? 'full' : rof.semiAuto > 0 ? 'semi' : 'single';
    const rns       = enemy.stats.rangeSkill || 20;
    const elevBonus = (isOnPlatform(fromPos, currentTerrain) && !isOnPlatform(targetPos, currentTerrain)) ? 20 : 0;
    const hitMod    = rangeMod + (isPinned ? -20 : 0) + (mode === 'full' ? -10 : 0) + elevBonus;
    const targetNum = Math.max(5, Math.min(100, rns + hitMod));
    const roll      = d100();
    const hit       = roll <= targetNum;
    const modeLabel = mode === 'full' ? 'Full Auto' : mode === 'semi' ? 'Semi-Auto' : 'Single Shot';
    const rounds    = mode === 'full' ? (rof.fullAuto || 10) : mode === 'semi' ? (rof.semiAuto || 3) : 1;
    const animCount = mode === 'full' ? (rof.fullAuto || 1)  : mode === 'semi' ? (rof.semiAuto || 1)  : 1;
    const modParts2 = [];
    if (rangeMod  !== 0)    modParts2.push(`${rangeMod > 0 ? '+' : ''}${rangeMod} ${rangeBand}`);
    if (isPinned)           modParts2.push('−20 Pinned');
    if (mode === 'full')    modParts2.push('−10 FA');
    if (elevBonus)          modParts2.push(`+${elevBonus} Elevation`);
    const modLabel  = modParts2.length ? ` [${modParts2.join(', ')}]` : '';

    eventBridge.emit('combat-shot', {
      fromPos, toPos: targetPos, count: animCount,
      isHit: hit, weaponClass: weapon.class || 'Solid Projectile',
    });

    if (mode === 'full' && roll >= 94) {
      log.push({ type: "enemy", text: `${enemy.name} fires ${weapon.name} [Full Auto] — WEAPON JAM! (rolled ${roll}) — turn lost!` });
      return true;
    }

    const dos = hit ? Math.floor((targetNum - roll) / 10) : 0;
    log.push({ type: "enemy", text: `${enemy.name} [${modeLabel}${rounds > 1 ? ` ×${rounds}` : ''}] fires ${weapon.name} at ${target.name} — ${rangeBand} (${manhattan * 3}m) · RNG ${rns}${modLabel} = ${targetNum}: rolled ${roll}... ${hit ? `HIT! (${dos} DoS)` : 'MISS!'}` });

    const newPartyWounds = [...partyWoundsRef.current];
    for (let r = 0; r < rounds; r++) {
      const recoilPenalty = r * 5;
      const roundTarget   = Math.max(5, targetNum - recoilPenalty);
      const roundRoll     = r === 0 ? roll : d100();
      const roundHit      = roundRoll <= roundTarget;
      if (mode !== 'single') {
        log.push({ type: "enemy", text: `  Rnd ${r + 1}: target ${roundTarget}${recoilPenalty ? ` (−${recoilPenalty} recoil)` : ''} → rolled ${roundRoll}... ${roundHit ? 'HIT' : 'miss'}` });
      }
      if (roundHit) {
        const loc    = hitLocation(roundRoll);
        // Cover save: lower-body hits stopped by partial cover
        if (COVERED_LOCS.has(loc) && hasCoverVsShooter(targetPos, fromPos, currentTerrain)) {
          log.push({ type: "player", text: `${target.name}'s ${loc} is protected by cover — shot stopped by barrier!` });
          continue;
        }
        const rawDmg = rollDamageDice(weapon.damage);
        let reactionBlocked = false;
        if (partyReactionsUsedRef.current[nearestIdx]) {
          log.push({ type: "player", text: `${target.name} has no reactions left — cannot dodge!` });
        } else {
          const dodgeRoll   = d100();
          const { target: dodgeTarget, label: dodgeLbl } = getCharDodgeTarget(target);
          const nr = [...partyReactionsUsedRef.current];
          nr[nearestIdx] = true;
          partyReactionsUsedRef.current = nr;
          setPartyReactionsUsed(nr);
          if (dodgeRoll <= dodgeTarget) {
            log.push({ type: "player", text: `${target.name} DODGES! (${dodgeLbl} ${dodgeTarget}: rolled ${dodgeRoll})` });
            reactionBlocked = true;
          } else {
            log.push({ type: "player", text: `${target.name} failed to dodge (rolled ${dodgeRoll}/${dodgeTarget})` });
          }
        }
        if (!reactionBlocked) {
          eventBridge.emit('combat-hit', { targetType: 'party', targetIndex: nearestIdx });
          const charArmor      = getCharArmor(target);
          const effectiveArmor = Math.max(0, charArmor - (weapon.pen || 0));
          const tb             = Math.floor((target.stats?.toughness || 0) / 10);
          const finalDmg       = Math.max(1, rawDmg - effectiveArmor - tb);
          log.push({ type: "enemy", text: `Hit ${loc}! ${rawDmg} dmg (${weapon.damage}) − Armor ${effectiveArmor}${tb ? ` − TB${tb}` : ''} = ${finalDmg} to ${target.name}` });
          newPartyWounds[nearestIdx] = (newPartyWounds[nearestIdx] || 0) + finalDmg;
          setPartyWounds([...newPartyWounds]);
          setPartyBodyWounds(prev => {
            const upd = prev.map(bw => ({ ...bw }));
            if (upd[nearestIdx]) upd[nearestIdx] = { ...upd[nearestIdx], [loc]: (upd[nearestIdx][loc] || 0) + finalDmg };
            return upd;
          });
          log.push({ type: "enemy", text: `${target.name}: ${Math.max(0, (target.wounds || 10) - newPartyWounds[nearestIdx])}/${target.wounds || 10} wounds remaining.` });
          if (newPartyWounds[nearestIdx] >= (target.wounds || 10)) {
            eventBridge.emit('combat-death', { targetType: 'party', targetIndex: nearestIdx });
            log.push({ type: "enemy", text: `${target.name} has fallen!` });
            const deadChar = party[nearestIdx];
            const hasFate  = (deadChar.fate || 0) > 0;
            const fateNotSpent = !fateSpentInMission || !fateSpentInMission[nearestIdx];
            if (hasFate && fateNotSpent) {
              setCombatLog(prevLog => [...prevLog, ...log]);
              setPendingFateIndex(nearestIdx);
              return true; // signal caller to also return
            }
            break;
          }
        }
      }
    }
    return true;
  }

  function enemyTurn(turnIndex, initiativeArray, partyPositions, enemyPositions) {
    console.log(">>> enemyTurn START, turnIndex =", turnIndex);
    // Use provided data or fall back to state
    const actorIndex = turnIndex !== undefined ? turnIndex : currentTurn;
    const init = initiativeArray || initiativeOrder;
    const partyPos = partyPositions || gridPositions.party;
    const enemyPosList = enemyPositions || gridPositions.enemies;
    const actor = init[actorIndex];
    console.log("enemyTurn: actorIndex =", actorIndex, "actor =", actor);
    if (!actor || actor.type !== 'enemy') {
      console.log("enemyTurn: returning early, not an enemy turn");
      return;
    }
    
    // Check if enemy is already dead
    const enemyWoundsCurrent = enemyWounds[actor.index] || 0;
    if (enemyWoundsCurrent <= 0) {
      console.log("enemyTurn: enemy is dead, skipping turn");
      setTimeout(() => advanceInitiative(actorIndex, init, partyPos, enemyPosList, enemyWounds), 100);
      return;
    }
    
    const enemy = encounter.enemies[actor.index];
    const enemyPos = enemyPosList[actor.index];
    if (!enemyPos) {
      console.log("enemyTurn: enemy position not found");
      return;
    }
    
    // Find nearest living party member
    let nearestIdx = -1;
    let nearestDist = Infinity;
    
    party.forEach((p, i) => {
      const wounds = partyWoundsRef.current[i] || 0;
      if (wounds < (p.wounds || 10)) {
        const pPos = partyPos[i];
        if (!pPos) return;
        const dist = Math.abs(pPos.x - enemyPos.x) + Math.abs(pPos.y - enemyPos.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
    });
    
    if (nearestIdx === -1) {
      // No living targets
      setCombatLog(prevLog => [...prevLog, { type: "enemy", text: `${enemy.name} has no targets!` }]);
      setTimeout(() => advanceInitiative(actorIndex, init, partyPos, enemyPosList, enemyWounds), 500);
      return;
    }
    
    const target = party[nearestIdx];
    const targetPos = partyPos[nearestIdx];
    const agi = enemy.stats.agility || 20;
    const moveRange = Math.floor(agi / 10) + 4;
    
    let log = [];
    let newEnemyPositions = [...enemyPosList];
    let currentEnemyPos = { ...enemyPos };
    let moved = false;
    
    // ── Weapon & style ────────────────────────────────────────────
    const rangedWeapon = (enemy.weapons || []).find(
      w => w.type !== 'Melee' && w.rateOfFire && w.rateOfFire !== '-'
    );
    const combatStyle = enemy.combatStyle || (rangedWeapon ? 'ranged' : 'melee');

    console.log(`[ENEMY TURN] ${enemy.name} | style=${combatStyle} | weapons=`, enemy.weapons?.map(w => w.name));
    console.log(`[ENEMY TURN] rangedWeapon=`, rangedWeapon ? `${rangedWeapon.name} RoF:${rangedWeapon.rateOfFire} range:${rangedWeapon.range}` : 'none');
    console.log(`[ENEMY TURN] pos=${JSON.stringify(currentEnemyPos)} targetPos=${JSON.stringify(targetPos)}`);

    const dx = Math.abs(targetPos.x - currentEnemyPos.x);
    const dy = Math.abs(targetPos.y - currentEnemyPos.y);
    const distToTarget  = Math.max(dx, dy); // Chebyshev — melee adjacency
    const manhattanDist = dx + dy;

    // Ranged: close only until in weapon range. Melee: close until adjacent.
    const rangedRangeM  = rangedWeapon ? parseRangeMeters(rangedWeapon.range) : 0;
    const alreadyInRange = rangedWeapon
      ? getRangeBand(manhattanDist, rangedRangeM).modifier !== null
      : false;
    const needsToClose = combatStyle === 'ranged' ? !alreadyInRange : distToTarget > 1;

    console.log(`[ENEMY TURN] manhattan=${manhattanDist} chebyshev=${distToTarget} | rangedRangeM=${rangedRangeM} alreadyInRange=${alreadyInRange} needsToClose=${needsToClose}`);

    if (needsToClose) {
      // Calculate best move towards target
      let bestMove = null;
      let bestDist = Infinity;
      
      // Try all positions within movement range
      for (let mx = -moveRange; mx <= moveRange; mx++) {
        for (let my = -moveRange; my <= moveRange; my++) {
          const newX = currentEnemyPos.x + mx;
          const newY = currentEnemyPos.y + my;
          
          // Check if within movement range (Manhattan)
          const moveDist = Math.abs(mx) + Math.abs(my);
          if (moveDist > 0 && moveDist <= moveRange && newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            // Check if occupied by another enemy
            const occupiedByEnemy = newEnemyPositions.some((e, i) => i !== actor.index && e.x === newX && e.y === newY);
            // Check if occupied by party member
            const occupiedByParty = partyPos.some(p => p.x === newX && p.y === newY);
            // Check if blocked by cover terrain
            const blockedByCover  = isCoverTile(newX, newY, terrainRef.current);

            if (!occupiedByEnemy && !occupiedByParty && !blockedByCover) {
              // Calculate distance to target from this position
              const newDist = Math.abs(newX - targetPos.x) + Math.abs(newY - targetPos.y);
              if (newDist < bestDist) {
                bestDist = newDist;
                bestMove = { x: newX, y: newY, dist: moveDist };
              }
            }
          }
        }
      }
      
      if (bestMove) {
        newEnemyPositions[actor.index] = { x: bestMove.x, y: bestMove.y };
        setGridPositions(prev => ({ ...prev, enemies: newEnemyPositions }));
        currentEnemyPos = { x: bestMove.x, y: bestMove.y };
        moved = true;
        log.push({ type: "enemy", text: `${enemy.name} moves ${bestMove.dist} squares toward ${target.name}.` });
      }
    }
    
    // Post-move distances
    const postDx = Math.abs(targetPos.x - currentEnemyPos.x);
    const postDy = Math.abs(targetPos.y - currentEnemyPos.y);
    const postChebyshev  = Math.max(postDx, postDy);
    const postManhattan  = postDx + postDy;

    console.log(`[ENEMY TURN] post-move pos=${JSON.stringify(currentEnemyPos)} | postManhattan=${postManhattan} postChebyshev=${postChebyshev}`);

    const isPinned = enemyPinnedRef.current[actor.index] || false;
    // Consume pinned regardless of attack type
    if (isPinned) {
      setEnemyPinned(prev => { const next = [...prev]; next[actor.index] = false; return next; });
    }

    let didAttack = false;

    // ── RANGED ATTACK ─────────────────────────────────────────────
    console.log(`[ENEMY ATTACK] checking ranged: combatStyle=${combatStyle} hasRangedWeapon=${!!rangedWeapon}`);
    if (combatStyle === 'ranged' && rangedWeapon) {
      console.log(`[ENEMY ATTACK] ranged: postManhattan=${postManhattan} weaponRange=${rangedWeapon.range}`);
      didAttack = enemyRangedAttack(enemy, rangedWeapon, currentEnemyPos, targetPos, nearestIdx, target, isPinned, log);
    }

    // ── MELEE FALLBACK: fire sidearm if can't reach ────────────────
    // Melee-style enemies with a ranged weapon shoot if they couldn't close to melee range
    if (!didAttack && combatStyle === 'melee' && rangedWeapon && postChebyshev > 1) {
      console.log(`[ENEMY ATTACK] melee fallback ranged: postManhattan=${postManhattan} weaponRange=${rangedWeapon.range}`);
      didAttack = enemyRangedAttack(enemy, rangedWeapon, currentEnemyPos, targetPos, nearestIdx, target, isPinned, log);
    }

    // ── MELEE ATTACK ──────────────────────────────────────────────
    console.log(`[ENEMY ATTACK] checking melee: didAttack=${didAttack} postChebyshev=${postChebyshev}`);
    if (!didAttack && postChebyshev <= 1) {
      const eWeapon = (enemy.weapons || []).find(w => w.type === 'Melee')
        || { name: 'Fists', damage: '1d5', pen: 0, type: 'Melee' };

      const ems          = enemy.stats.meleeSkill || 20;
      const effectiveEms = Math.max(5, ems + (isPinned ? -20 : 0));
      const roll = d100();
      const hit  = roll <= effectiveEms;
      const dos  = hit ? Math.floor((effectiveEms - roll) / 10) : 0;

      log.push({ type: "enemy", text: `${enemy.name}${isPinned ? ' [PINNED −20]' : ''} attacks ${target.name} with ${eWeapon.name} (MEL ${effectiveEms}): rolled ${roll}... ${hit ? `HIT! (${dos} DoS)` : 'MISS!'}` });

      if (hit) {
        const loc    = hitLocation(roll);
        const sb     = getStrBonus(enemy.stats.strength || 20);
        const rawDmg = rollDamageDice(eWeapon.damage) + sb;

        let reactionBlocked = false;
        if (partyReactionsUsedRef.current[nearestIdx]) {
          log.push({ type: "player", text: `${target.name} has no reactions left — cannot dodge!` });
        } else {
          const dodgeRoll   = d100();
          const { target: dodgeTarget, label: dodgeLbl } = getCharDodgeTarget(target);
          const nr = [...partyReactionsUsedRef.current];
          nr[nearestIdx] = true;
          partyReactionsUsedRef.current = nr;
          setPartyReactionsUsed(nr);
          if (dodgeRoll <= dodgeTarget) {
            log.push({ type: "player", text: `${target.name} DODGES! (${dodgeLbl} ${dodgeTarget}: rolled ${dodgeRoll})` });
            reactionBlocked = true;
          } else {
            const hasMelee = (target.equipment || []).some(item => { const w = getWeaponById(itemId(item)); return w && w.type === 'Melee'; });
            if (hasMelee) {
              const parryBonus  = (target.equipment || []).some(item => itemId(item) === 'shield_arm') ? 10 : 0;
              const parryRoll   = d100();
              const parryTarget = Math.min(100, (target.stats.meleeSkill || 20) + parryBonus);
              if (parryRoll <= parryTarget) {
                log.push({ type: "player", text: `${target.name} PARRIES! (MEL ${parryTarget}${parryBonus ? ` [Shield+${parryBonus}]` : ''}: rolled ${parryRoll})` });
                reactionBlocked = true;
              } else {
                log.push({ type: "player", text: `${target.name} failed to react (dodge ${dodgeRoll}/${dodgeTarget}, parry ${parryRoll}/${parryTarget})` });
              }
            } else {
              log.push({ type: "player", text: `${target.name} failed to dodge (rolled ${dodgeRoll}/${dodgeTarget})` });
            }
          }
        }

        if (!reactionBlocked) {
          eventBridge.emit('combat-hit', { targetType: 'party', targetIndex: nearestIdx });
          const charArmor      = getCharArmor(target);
          const effectiveArmor = Math.max(0, charArmor - (eWeapon.pen || 0));
          const tb             = Math.floor((target.stats?.toughness || 0) / 10);
          const finalDmg       = Math.max(1, rawDmg - effectiveArmor - tb);
          log.push({ type: "enemy", text: `Hit ${loc}! ${rawDmg} dmg (${eWeapon.damage}+SB${sb}) − Armor ${effectiveArmor}${tb ? ` − TB${tb}` : ''} = ${finalDmg} to ${target.name}` });

          const newPartyWounds = [...partyWoundsRef.current];
          newPartyWounds[nearestIdx] = (newPartyWounds[nearestIdx] || 0) + finalDmg;
          setPartyWounds(newPartyWounds);
          setPartyBodyWounds(prev => {
            const upd = prev.map(bw => ({ ...bw }));
            if (upd[nearestIdx]) upd[nearestIdx] = { ...upd[nearestIdx], [loc]: (upd[nearestIdx][loc] || 0) + finalDmg };
            return upd;
          });
          log.push({ type: "enemy", text: `${target.name}: ${Math.max(0, (target.wounds || 10) - newPartyWounds[nearestIdx])}/${target.wounds || 10} wounds remaining.` });

          if (newPartyWounds[nearestIdx] >= (target.wounds || 10)) {
            eventBridge.emit('combat-death', { targetType: 'party', targetIndex: nearestIdx });
            log.push({ type: "enemy", text: `${target.name} has fallen!` });
            const deadChar = party[nearestIdx];
            const hasFate  = (deadChar.fate || 0) > 0;
            const fateNotSpent = !fateSpentInMission || !fateSpentInMission[nearestIdx];
            if (hasFate && fateNotSpent) {
              setCombatLog(prevLog => [...prevLog, ...log]);
              setPendingFateIndex(nearestIdx);
              return;
            }
          }
        }
      }
    }
    
    setCombatLog(prevLog => [...prevLog, ...log]);
    
    // Check if all enemies are dead
    const allEnemiesDead = enemyWounds.every(w => w <= 0);
    if (allEnemiesDead) {
      console.log("enemyTurn END: all enemies dead, not advancing");
      return;
    }
    
    console.log(">>> enemyTurn END, calling advanceInitiative with", actorIndex);
    // Advance initiative with updated positions
    setTimeout(() => advanceInitiative(actorIndex, init, partyPos, newEnemyPositions, enemyWounds), 1000);
  }

  function completeMission(victory) {
    const char = selectedChar;
    const currentCheck = selectedMission.checks[currentCheckIndex];
    
    // Record combat result
    const combatResult = {
      label: currentCheck.label,
      flavor: victory ? "All enemies defeated" : "Escaped from combat",
      stat: "meleeSkill",
      statValue: char?.stats?.meleeSkill || 20,
      difficulty: currentCheck.difficulty,
      roll: 0,
      passed: victory,
      margin: 0,
      extreme: false,
      isCombat: true,
    };
    
    const newResults = [...checkResults, combatResult];
    setCheckResults(newResults);
    
    // Check if there are more checks after this combat
    const nextIndex = currentCheckIndex + 1;
    
    if (nextIndex < selectedMission.checks.length && victory) {
      // More checks to go after combat victory
      const nextCheck = selectedMission.checks[nextIndex];
      setCurrentCheckIndex(nextIndex);
      
      if (nextCheck.isCombat) {
        // Generate next combat encounter
        const environment = getEnvironmentFromMission(selectedMission);
        const rank = getRank(party[0]?.xp || 0);
        const missionWithRank = { ...selectedMission, rank };
        const generatedEncounter = generateEncounter(missionWithRank, environment, rank);
        setEncounter(generatedEncounter);
        setEnemyWounds(generatedEncounter.enemies.map(e => e.wounds));
        setCurrentEnemy(0);
        setCombatLog([{ type: "system", text: `Combat begins with ${generatedEncounter.enemies.length} enemy/enemies!` }]);
        setPhase("combat");
      } else {
        setPhase("skill_check");
      }
    } else {
      // All checks done, finish mission
      finishMission(newResults);
    }
  }

  function resetMissionState() {
    setEncounter(null);
    setCombatLog([]);
    setPartyWounds([]);
    setEnemyWounds([]);
    setPartyBodyWounds([]);
    setEnemyBodyWounds([]);
    setDetailPopup(null);
    setAiming(false);
    setShootingMode(false);
    setActiveWeapons({});
    setEnemyPinned([]);
    setPartyReactionsUsed([]);
    setEnemyReactionsUsed([]);
    setRemainingAction('full');
    setFireMode('single');
    setCurrentEnemy(0);
    setFateSpentInMission([]);
    setCurrentCheckIndex(0);
    setCheckResults([]);
    setResults([]);
    setInjuries([]);
    setCurrentPartyMember(0);
  }

  // ── MISSION RESOLUTION LOGIC ─────────────────────────────────
  function runMission() {
    const char   = selectedChar;
    const mission = selectedMission;
    const checkResults = [];
    const injuriesList = [];
    let currentWounds = char.wounds;
    let extremeFails  = 0;

    for (const check of mission.checks) {
      const statValue = char.stats[check.stat] || 20;
      const result    = resolveCheck(statValue, check.difficulty);

      let injury = null;

      if (!result.passed && result.extreme && check.isCombat) {
        const dmgMin = mission.woundDamageRange[0];
        const dmgMax = mission.woundDamageRange[1];
        const dmg    = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin + 1));
        currentWounds -= dmg;

        if (currentWounds < char.wounds * 0.25) {
          injury = INJURY_TABLE[Math.floor(Math.random() * INJURY_TABLE.length)];
          injuriesList.push(injury);
        }

        extremeFails++;
      }

      checkResults.push({
        label:     check.label,
        flavor:    check.flavor,
        stat:      check.stat,
        statValue,
        difficulty: check.difficulty,
        roll:      result.roll,
        passed:    result.passed,
        margin:    result.margin,
        extreme:   result.extreme,
        isCombat:  check.isCombat,
        injury,
      });
    }

    const passes  = checkResults.filter(r => r.passed).length;
    const fails   = checkResults.filter(r => !r.passed).length;
    const success = passes > fails;

    const totalMargin = checkResults.filter(r => r.passed).reduce((sum, r) => sum + r.margin, 0);
    const bonusXP     = Math.floor(totalMargin / 10) * 10;
    const baseXP      = success ? mission.xpSuccess : mission.xpFailure;
    const totalXP     = success ? baseXP + bonusXP : baseXP;

    setResults(checkResults);
    setInjuries(injuriesList);
    setXpGained(totalXP);

    let updatedStats = { ...char.stats };
    for (const inj of injuriesList) {
      if (updatedStats[inj.stat] !== undefined) {
        updatedStats[inj.stat] = Math.max(1, updatedStats[inj.stat] + inj.penalty);
      }
    }

    if (extremeFails >= 3) {
      const toughness  = char.stats.toughness || 20;
      const deathRoll  = d100();
      const survived   = deathRoll <= toughness;

      if (!survived) {
        setFatePrompt(true);
        setDeathCheck({ deathRoll, toughness });
        updateCharacter(selectedCharIdx, {
          ...char,
          stats:    updatedStats,
          wounds:   Math.max(0, currentWounds),
          injuries: [...(char.injuries || []), ...injuriesList.map(i => i.name)],
        });
        setPhase("results");
        return;
      }
    }

    const newXP   = (char.xp || 0) + totalXP;
    updateCharacter(selectedCharIdx, {
      ...char,
      stats:    updatedStats,
      wounds:   Math.max(1, currentWounds),
      xp:       newXP,
      injuries: [...(char.injuries || []), ...injuriesList.map(i => i.name)],
    });

    setPhase("results");
  }

  function spendFate() {
    if (selectedChar.fate <= 0) { confirmDeath(); return; }
    const newFate   = selectedChar.fate - 1;
    const toughness = selectedChar.stats.toughness || 20;
    const reroll    = d100();
    if (reroll <= toughness) {
      // Survived with fate
      const newXP = (selectedChar.xp || 0) + xpGained;
      const updated = { ...selectedChar, fate: newFate, xp: newXP };
      updateCharacter(selectedCharIdx, updated);
      setSelectedChar(updated);
      setFatePrompt(false);
    } else {
      // Even fate couldn't save them
      if (newFate > 0) {
        const updated = { ...selectedChar, fate: newFate };
        setSelectedChar(updated);
        updateCharacter(selectedCharIdx, updated);
        // Let them try again if they have more fate
        setSelectedChar(prev => ({ ...prev, fate: newFate }));
      } else {
        confirmDeath();
      }
    }
  }

  function confirmDeath() {
    // Mark as KIA
    const updated = { ...selectedChar, kia: true, xp: selectedChar.xp || 0 };
    updateCharacter(selectedCharIdx, updated);
    setFatePrompt(false);
    setIsDead(true);
  }

  function spendFateToSurvive(charIndex) {
    const char = party[charIndex];
    if ((char.fate || 0) <= 0) return;
    
    const newFate = char.fate - 1;
    
    // Update fate spent tracking
    const newFateSpent = [...(fateSpentInMission || [])];
    newFateSpent[charIndex] = true;
    setFateSpentInMission(newFateSpent);
    
    // Survive at 1 HP (set wounds to max - 1)
    const newPartyWounds = [...partyWounds];
    newPartyWounds[charIndex] = (char.wounds || 10) - 1;
    setPartyWounds(newPartyWounds);
    
    // Clear pending fate
    setPendingFateIndex(null);
    
    // Add to combat log
    setCombatLog(prevLog => [...prevLog, { type: "system", text: `FATE POINT SPENT! ${char.name} survives at 1 HP!` }]);
    
    // Advance initiative
    setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 500);
  }

  function confirmPartyMemberDeath(charIndex) {
    // Mark this party member as dead (their wounds = max)
    const char = party[charIndex];
    const newPartyWounds = [...partyWounds];
    newPartyWounds[charIndex] = char.wounds || 10;
    setPartyWounds(newPartyWounds);
    
    // Clear pending fate
    setPendingFateIndex(null);
    
    // Advance initiative
    setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies, enemyWounds), 500);
  }

  function handleNextPartyMember() {
    // Find next living party member
    let nextIdx = currentPartyMember + 1;
    while (nextIdx < party.length) {
      const nextChar = party[nextIdx];
      const nextWounds = partyWounds[nextIdx] || 0;
      if (nextWounds < (nextChar.wounds || 10)) {
        // Found a living member
        setCurrentPartyMember(nextIdx);
        setIsDead(false);
        setCombatLog(prevLog => [...prevLog, { type: "system", text: `${nextChar.name} steps forward to continue the fight!` }]);
        return;
      }
      nextIdx++;
    }
    
    // All party members dead or mission complete - handle accordingly
    const allEnemiesDead = enemyWounds.every(w => w <= 0);
    if (allEnemiesDead) {
      completeMission(true);
    } else {
      completeMission(false);
    }
  }

  function updateCharacter(index, updatedChar) {
    const roster = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    roster[index] = updatedChar;
    localStorage.setItem("dhgen_roster", JSON.stringify(roster));
    setCharacters(roster);
    setSelectedChar(updatedChar);
  }
}

// ── CHARACTER DETAIL POPUP ───────────────────────────────────
const ARMOR_DISPLAY = {
  flak_vest:        { name: 'Flak Armor Vest',  armorValue: 3 },
  tech_shield_vest: { name: 'Tech Shield Vest', armorValue: 5 },
  robes:            { name: 'Order Robes',       armorValue: 0 },
};

function bodyPartFill(wounds, maxWounds) {
  if (!wounds || wounds === 0) return '#1e2a1e';
  const r = wounds / (maxWounds * 0.35); // scale: heavy wound = 35% of max wounds
  if (r >= 1)   return '#6a1212'; // critical — deep red
  if (r >= 0.6) return '#7a3a10'; // heavy — orange-red
  if (r >= 0.2) return '#5a5210'; // moderate — yellow
  return '#2a4a2a';               // light — green tint
}

function bodyPartBarColor(wounds, maxWounds) {
  const r = wounds / (maxWounds * 0.35);
  if (r >= 1)   return '#f87171';
  if (r >= 0.6) return '#f59e0b';
  return '#d4a850';
}

function CharacterDetailPopup({ char, enemy, bodyWounds, maxWounds, onClose }) {
  const PARTS = [
    { key: 'Head',      range: '01–10' },
    { key: 'Right Arm', range: '11–20' },
    { key: 'Left Arm',  range: '21–30' },
    { key: 'Body',      range: '31–70' },
    { key: 'Right Leg', range: '71–85' },
    { key: 'Left Leg',  range: '86–00' },
  ];
  const bw   = bodyWounds || {};
  const name = char?.name || enemy?.name || '???';
  const sub  = char ? (char.class || 'Operative') : (enemy?.type || 'Hostile');
  const mw   = maxWounds || 10;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0f0a04', border: '1px solid #6a5030', padding: 22, maxWidth: 470, width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 16, color: char ? '#d4a850' : '#c05050', letterSpacing: 1 }}>{name}</div>
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#7a6040', marginTop: 2 }}>{sub}</div>
          </div>
          <button onClick={onClose} style={{ padding: '4px 10px', fontSize: 13 }}>✕</button>
        </div>

        {/* Humanoid + wound breakdown */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 16, alignItems: 'flex-start' }}>
          {/* SVG humanoid silhouette */}
          <svg width="94" height="172" viewBox="0 0 94 172" style={{ flexShrink: 0 }}>
            {/* Head */}
            <circle cx="47" cy="16" r="14" fill={bodyPartFill(bw['Head'], mw)} stroke="#5a4020" strokeWidth="1.5" />
            <text x="47" y="20" textAnchor="middle" fill="#c8b89a" fontSize="7" fontFamily="Cinzel">HEAD</text>
            {/* Neck */}
            <rect x="42" y="30" width="10" height="6" fill="#161008" />
            {/* Torso */}
            <rect x="24" y="36" width="46" height="50" rx="3" fill={bodyPartFill(bw['Body'], mw)} stroke="#5a4020" strokeWidth="1.5" />
            <text x="47" y="64" textAnchor="middle" fill="#c8b89a" fontSize="7.5" fontFamily="Cinzel">BODY</text>
            {/* Right Arm (viewer's left) */}
            <rect x="5"  y="36" width="17" height="46" rx="3" fill={bodyPartFill(bw['Right Arm'], mw)} stroke="#5a4020" strokeWidth="1.5" />
            <text x="13.5" y="54" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">R</text>
            <text x="13.5" y="63" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">ARM</text>
            {/* Left Arm (viewer's right) */}
            <rect x="72" y="36" width="17" height="46" rx="3" fill={bodyPartFill(bw['Left Arm'], mw)} stroke="#5a4020" strokeWidth="1.5" />
            <text x="80.5" y="54" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">L</text>
            <text x="80.5" y="63" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">ARM</text>
            {/* Right Leg */}
            <rect x="24" y="90" width="21" height="62" rx="3" fill={bodyPartFill(bw['Right Leg'], mw)} stroke="#5a4020" strokeWidth="1.5" />
            <text x="34.5" y="122" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">R</text>
            <text x="34.5" y="131" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">LEG</text>
            {/* Left Leg */}
            <rect x="49" y="90" width="21" height="62" rx="3" fill={bodyPartFill(bw['Left Leg'], mw)} stroke="#5a4020" strokeWidth="1.5" />
            <text x="59.5" y="122" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">L</text>
            <text x="59.5" y="131" textAnchor="middle" fill="#c8b89a" fontSize="6" fontFamily="Cinzel">LEG</text>
          </svg>

          {/* Per-location wound list */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#6a5030', letterSpacing: 2, marginBottom: 8 }}>WOUND LOCATIONS</div>
            {PARTS.map(({ key, range }) => {
              const w = bw[key] || 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#a89070', width: 58, flexShrink: 0 }}>{key}</span>
                  <div style={{ flex: 1, background: '#1a1a14', height: 5, borderRadius: 2, overflow: 'hidden' }}>
                    {w > 0 && (
                      <div style={{ background: bodyPartBarColor(w, mw), width: `${Math.min(100, (w / (mw * 0.35)) * 100)}%`, height: '100%', borderRadius: 2 }} />
                    )}
                  </div>
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: w > 0 ? '#f87171' : '#3a3028', width: 22, textAlign: 'right', flexShrink: 0 }}>
                    {w > 0 ? w : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #2a1808', marginBottom: 12 }} />

        {/* Party member gear */}
        {char && (
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#6a5030', letterSpacing: 2, marginBottom: 8 }}>EQUIPPED GEAR</div>
            {(char.equipment || []).map(id => {
              const armorItem = ARMOR_DISPLAY[id];
              if (armorItem) return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#c8b89a' }}>{armorItem.name}</span>
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#6a8060' }}>Armor {armorItem.armorValue}</span>
                </div>
              );
              const w = getWeaponById(id);
              if (!w) return null;
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#c8b89a' }}>{w.name}</span>
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#6a5030' }}>{w.damage} · Pen {w.pen}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Enemy armament */}
        {enemy && (
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#6a2020', letterSpacing: 2, marginBottom: 8 }}>ARMAMENT</div>
            {(enemy.weapons || []).map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#c8b89a' }}>{w.name}</span>
                <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#6a5030' }}>{w.damage} · Pen {w.pen || 0}</span>
              </div>
            ))}
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: '#9a8060', marginTop: 8 }}>
              Armor Rating: <span style={{ color: '#c8b89a' }}>{enemy.armor || 0}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, textAlign: 'center', fontFamily: "'IM Fell English', serif", fontSize: 10, color: '#3a2810', fontStyle: 'italic' }}>
          Click outside or ✕ to close
        </div>
      </div>
    </div>
  );
}

// ── SHARED UI COMPONENTS ─────────────────────────────────────
function Screen({ children, onNavigate, title, subtitle, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0804", color: "#c8b89a", fontFamily: "'Cinzel', serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(139,90,43,0.03) 40px,rgba(139,90,43,0.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(139,90,43,0.03) 40px,rgba(139,90,43,0.03) 41px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%,rgba(180,120,40,0.08) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English&display=swap');
        * { box-sizing: border-box; }
        button { background: linear-gradient(180deg,#3a2510 0%,#1e1208 100%); color: #c8b89a; border: 1px solid #5a3e1b; padding: 6px 14px; font-family: 'Cinzel',serif; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; border-radius: 0; }
        button:hover { border-color: #c09040; color: #f0d890; background: linear-gradient(180deg,#5a3510 0%,#2e1e08 100%); }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          {onBack
            ? <button onClick={onBack}>← Back</button>
            : <button onClick={() => onNavigate("home")}>← Main Menu</button>
          }
        </div>
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: "1px solid #3a2510", paddingBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 22, color: "#c09040", letterSpacing: 5 }}>{title}</div>
          {subtitle && <div style={{ fontFamily: "'IM Fell English',serif", fontSize: 13, color: "#6a5030", letterSpacing: 2, marginTop: 4 }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span style={{ border: "1px solid #4a3010", background: "rgba(90,62,27,0.2)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#9a7840", display: "inline-block" }}>
      {children}
    </span>
  );
}