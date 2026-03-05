import { useState, useRef, useEffect } from "react";
import { MISSIONS, INJURY_TABLE, getRank } from "./missionData";
import { generateEncounter, getEnvironmentFromMission } from "./enemyData";

const TIER_COLOR = {
  Routine:   "#6a8060",
  Dangerous: "#a07030",
  Deadly:    "#a03030",
};

const TIER_ORDER = { Routine: 0, Dangerous: 1, Deadly: 2 };

function d100() { return Math.floor(Math.random() * 100) + 1; }
function d6()   { return Math.floor(Math.random() * 6) + 1; }

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
  
  // Initiative system
  const [initiativeOrder, setInitiativeOrder] = useState([]); // Array of {type: 'party'|'enemy', index: number, initiative: number}
  const [currentTurn, setCurrentTurn] = useState(0); // Index in initiativeOrder
  
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
                        {char.gender} · {char.origin} · {char.career}
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
                        {char.gender} · {char.origin} · {char.career}
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
                {p.name} (W{p.stats.WP})
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
                  WS {enemy.stats.WS} | BS {enemy.stats.BS} | S {enemy.stats.S} | T {enemy.stats.T} | Armor {enemy.armor}
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
        {/* Initiative Order Display */}
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030", letterSpacing: 2, marginBottom: 6 }}>INITIATIVE ORDER</div>
          {(!initiativeOrder || initiativeOrder.length === 0) ? (
            <div style={{ fontSize: 10, color: "#5a4020" }}>Calculating...</div>
          ) : (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {initiativeOrder.map((entry, idx) => {
                const isCurrentTurn = idx === currentTurn;
                const isDead = entry.type === 'party' 
                  ? (partyWounds[entry.index] || 0) >= (party[entry.index]?.wounds || 10)
                  : (enemyWounds[entry.index] || 0) <= 0;
                
                return (
                  <span key={idx} style={{ 
                    border: isCurrentTurn ? "1px solid #c09040" : "1px solid #3a2510", 
                    background: isCurrentTurn ? "rgba(60,45,10,0.5)" : "rgba(15,10,4,0.85)", 
                    padding: "4px 8px", 
                    fontSize: 10, 
                    color: isDead ? "#504030" : (entry.type === 'party' ? "#6a9a6a" : "#9a5a5a"),
                    opacity: isDead ? 0.5 : 1,
                  }}>
                    {idx + 1}. {entry.name} ({entry.total})
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Party Status Bar */}
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030", letterSpacing: 2, marginBottom: 6 }}>PARTY STATUS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {party.map((p, i) => {
              const wounds = partyWounds[i] || 0;
              const maxWounds = p.wounds || 10;
              const alive = wounds < maxWounds;
              const isActive = i === currentPartyMember;
              return (
                <span key={i} style={{ 
                  border: isActive ? "1px solid #6a8060" : "1px solid #4a3010", 
                  background: isActive ? "rgba(40,80,40,0.3)" : "rgba(90,62,27,0.2)", 
                  padding: "4px 8px", 
                  fontSize: 10, 
                  color: alive ? (isActive ? "#80c080" : "#9a7840") : "#c05050" 
                }}>
                  {p.name}: {Math.max(0, maxWounds - wounds)}/{maxWounds}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Enemy Status (current target) */}
        <div style={{ border: "1px solid #6a3a3a", background: "rgba(40,20,20,0.6)", padding: 12, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, color: "#f87171", marginBottom: 8 }}>{currentEnemyData?.name || "Enemy"}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9a8a8a", marginBottom: 4 }}>
            <span>Wounds</span>
            <span style={{ color: enemyWounds[currentEnemy] > (currentEnemyData?.wounds || 10) * 0.5 ? "#f87171" : "#f87171" }}>
              {Math.max(0, enemyWounds[currentEnemy])} / {currentEnemyData?.wounds || 10}
            </span>
          </div>
          <div style={{ background: "#1a1a1a", height: 8, borderRadius: 4 }}>
            <div style={{ 
              background: "#f87171", 
              height: "100%", 
              width: `${Math.max(0, (enemyWounds[currentEnemy] / (currentEnemyData?.wounds || 10)) * 100)}%`,
              borderRadius: 4,
              transition: "width 0.3s"
            }} />
          </div>
        </div>
        
        {/* Combat Grid */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030", letterSpacing: 2, marginBottom: 8 }}>BATTLEFIELD</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, 16px)`, gap: 1, background: "#1a1510", padding: 4, border: "1px solid #3a2510" }}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);
              
              // Check what's on this cell
              const partyIdx = gridPositions.party.findIndex(p => p.x === x && p.y === y);
              const enemyIdx = gridPositions.enemies.findIndex(e => e.x === x && e.y === y);
               
              let cellContent = null;
              let cellColor = "#0f0a04";
              let cellBorder = "#1a1510";
              
              // Get initiative order numbers
              const getPartyInitNumber = (idx) => {
                const initEntry = initiativeOrder.find(e => e.type === 'party' && e.index === idx);
                return initEntry ? initiativeOrder.indexOf(initEntry) + 1 : idx + 1;
              };
              const getEnemyInitNumber = (idx) => {
                const initEntry = initiativeOrder.find(e => e.type === 'enemy' && e.index === idx);
                return initEntry ? initiativeOrder.indexOf(initEntry) + 1 : idx + 1;
              };
              
              if (partyIdx !== -1) {
                // Check if this party member is active in initiative
                const initEntry = initiativeOrder.find(e => e.type === 'party' && e.index === partyIdx);
                const isActive = initEntry && initiativeOrder.indexOf(initEntry) === currentTurn;
                const wounds = partyWounds[partyIdx] || 0;
                const maxWounds = party[partyIdx]?.wounds || 10;
                const isDead = wounds >= maxWounds;
                const initNum = getPartyInitNumber(partyIdx);
                cellColor = isActive ? "#2a5a2a" : isDead ? "#1a1a1a" : "#1a3a1a";
                cellBorder = isActive ? "#4a8a4a" : isDead ? "#3a2020" : "#2a4a2a";
                cellContent = (
                  <span style={{ color: isDead ? "#ff4040" : (isActive ? "#8afa8a" : "#5aba5a"), fontSize: 8, fontWeight: "bold" }}>
                    {initNum}
                  </span>
                );
              } else if (enemyIdx !== -1) {
                // Check if this enemy is active in initiative
                const initEntry = initiativeOrder.find(e => e.type === 'enemy' && e.index === enemyIdx);
                const isActive = initEntry && initiativeOrder.indexOf(initEntry) === currentTurn;
                const isDead = (enemyWounds[enemyIdx] || 0) <= 0;
                const initNum = getEnemyInitNumber(enemyIdx);
                cellColor = isActive ? "#5a2a2a" : isDead ? "#1a0a0a" : "#3a1a1a";
                cellBorder = isActive ? "#8a4a4a" : isDead ? "#2a1515" : "#4a2a2a";
                cellContent = <span style={{ color: "#fa5a5a", fontSize: 8, fontWeight: "bold" }}>{initNum}</span>;
              }
              
              return (
                <div
                  key={idx}
                  onClick={() => handleGridClick(x, y)}
                  style={{
                    width: 16,
                    height: 16,
                    background: cellColor,
                    border: `1px solid ${cellBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: partyIdx !== -1 ? "pointer" : "default",
                  }}
                >
                  {cellContent}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10, color: "#6a5030" }}>
            <span><span style={{ color: "#5aba5a" }}>■</span> Party ({initiativeOrder.filter(e => e.type === 'party').map((e, i) => {
              const wounds = partyWounds[e.index] || 0;
              const isDead = wounds >= (party[e.index]?.wounds || 10);
              return isDead ? `${i + 1}*` : i + 1;
            }).join(", ")})</span>
            <span><span style={{ color: "#fa5a5a" }}>■</span> Enemies ({initiativeOrder.filter(e => e.type === 'enemy').map((e, i) => {
              const isDead = (enemyWounds[e.index] || 0) <= 0;
              return isDead ? `${i + 1}*` : i + 1;
            }).join(", ")})</span>
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
            {combatAction === 'movement' && (
              <>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#6a8060", marginBottom: 8 }}>
                  MOVEMENT PHASE - Click on grid to move
                </div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "#5a4020", marginBottom: 8 }}>
                  Range: {Math.floor((party[currentTurn]?.stats.Ag || 20) / 10) + 4} squares (Manhattan distance)
                </div>
                <button 
                  onClick={() => setCombatAction('attack')}
                  style={{ 
                    borderColor: "#a07030", 
                    color: "#c09040", 
                    padding: "8px 16px",
                    fontSize: 11
                  }}>
                  Skip Movement
                </button>
              </>
            )}
            {combatAction === 'attack' && (
              <>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#6a8060", marginBottom: 8 }}>
                  ATTACK PHASE
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button 
                    onClick={() => playerAttack()} 
                    style={{ 
                      borderColor: "#6a8060", 
                      color: "#80c080", 
                      padding: "10px 20px"
                    }}>
                    ⚔ Attack
                  </button>
                  <button 
                    onClick={() => {
                      setCombatLog(prev => [...prev, { type: "player", text: `${party[currentPartyMember]?.name} holds position.` }]);
                      setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies), 500);
                    }} 
                    style={{ 
                      borderColor: "#5a3e1b", 
                      color: "#8a7050", 
                      padding: "10px 20px"
                    }}>
                    Skip Attack
                  </button>
                  <button 
                    onClick={() => tryEscape()} 
                    style={{ 
                      borderColor: "#a07030", 
                      color: "#c09040", 
                      padding: "10px 20px"
                    }}>
                    🏃 Escape
                  </button>
                </div>
              </>
            )}
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
      </Screen>
    );
  }

  // ── MISSION FLOW FUNCTIONS ───────────────────────────────────
  function startMission() {
    setCurrentCheckIndex(0);
    setCheckResults([]);
    setPartyWounds(party.map(() => 0));
    setCurrentPartyMember(0);
    setEncounter(null);
    setFateSpentInMission(party.map(() => false));
    setSelectedMovementTarget(null);
    setCurrentTurn(0);
    
    // Skip skill checks for now - go straight to combat
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
    
    setGridPositions({ party: partyPositions, enemies: enemyPositions });
    
    // Calculate initiative
    const initiative = [];
    
    party.forEach((p, i) => {
      const agi = p.stats.Ag || 20;
      const per = p.stats.Per || 20;
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
      const agi = e.stats.Ag || 20;
      const per = e.stats.Per || 20;
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
    // Only handle if it's a player's turn in movement mode
    if (combatAction !== 'movement') return;
    
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;
    
    const actorIdx = actor.index;
    const currentPos = gridPositions.party[actorIdx];
    const agi = party[actorIdx].stats.Ag || 20;
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
    
    // Valid move - update position
    const newPartyPositions = [...gridPositions.party];
    newPartyPositions[actorIdx] = { x, y };
    setGridPositions({ ...gridPositions, party: newPartyPositions });
    
    setCombatLog(prev => [...prev, { type: "player", text: `${party[actorIdx].name} moves ${distance} squares.` }]);
    
    // After moving, switch to attack phase
    setCombatAction('attack');
  }
  
  function advanceInitiative(turnIndex, initiativeArray, partyPositions, enemyPositions) {
    const currentTurnIndex = turnIndex !== undefined ? turnIndex : currentTurn;
    const init = initiativeArray || initiativeOrder;
    const partyPos = partyPositions || gridPositions.party;
    const enemyPos = enemyPositions || gridPositions.enemies;
    let nextTurn = currentTurnIndex + 1;
    
    // Skip dead combatants
    while (nextTurn < init.length) {
      const entry = init[nextTurn];
      const isDead = entry.type === 'party' 
        ? (partyWounds[entry.index] || 0) >= (party[entry.index]?.wounds || 10)
        : (enemyWounds[entry.index] || 0) <= 0;
      
      console.log("Dead check: entry", nextTurn, "=", entry.name, "type:", entry.type, "index:", entry.index, "isDead:", isDead, "wounds:", entry.type === 'party' ? partyWounds[entry.index] : enemyWounds[entry.index]);
      
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
          ? (partyWounds[entry.index] || 0) >= (party[entry.index]?.wounds || 10)
          : (enemyWounds[entry.index] || 0) <= 0;
        
        if (!isDead) break;
        nextTurn++;
      }
    }
    
    console.log("advanceInitiative: currentTurn =", currentTurnIndex, "nextTurn =", nextTurn, "init.length =", init.length);
    setCurrentTurn(nextTurn);
    setCombatAction('movement'); // Reset to movement phase for next actor
    
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

  function playerAttack() {
    // Get current actor from initiative
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;
    
    const char = party[actor.index];
    const attackerPos = gridPositions.party[actor.index];
    
    // Find adjacent enemies (including diagonals - distance of 1)
    const adjacentEnemies = [];
    enemyWounds.forEach((wounds, idx) => {
      if (wounds > 0) { // Only living enemies
        const enemyPos = gridPositions.enemies[idx];
        const dx = Math.abs(enemyPos.x - attackerPos.x);
        const dy = Math.abs(enemyPos.y - attackerPos.y);
        const distance = Math.max(dx, dy); // Chebyshev distance (including diagonals)
        
        if (distance === 1) {
          adjacentEnemies.push({
            index: idx,
            enemy: encounter.enemies[idx],
            distance
          });
        }
      }
    });
    
    if (adjacentEnemies.length === 0) {
      setCombatLog(prev => [...prev, { type: "player", text: "No enemy in melee range! Move closer to attack." }]);
      return;
    }
    
    // Attack the first adjacent enemy (closest)
    const target = adjacentEnemies[0];
    const enemy = target.enemy;
    const enemyIdx = target.index;
    const ws = char.stats.WS || 20;
    const roll = d100();
    const hit = roll <= ws;
    
    let log = [{ type: "player", text: `${char.name} attacks ${enemy.name} (WS ${ws}): rolled ${roll} vs ${ws}... ${hit ? "HIT!" : "MISS!"}` }];
    
    if (hit) {
      const dmg = d6() + 3;
      const newEnemyWounds = [...enemyWounds];
      newEnemyWounds[enemyIdx] = Math.max(0, newEnemyWounds[enemyIdx] - dmg);
      setEnemyWounds(newEnemyWounds);
      log.push({ type: "player", text: `Dealt ${dmg} damage! Enemy: ${Math.max(0, newEnemyWounds[enemyIdx])}/${enemy.wounds} wounds.` });
      
      if (newEnemyWounds[enemyIdx] <= 0) {
        log.push({ type: "player", text: `The ${enemy.name} is DEFEATED!` });
      }
    }
    
    setCombatLog(prevLog => [...prevLog, ...log]);
    
    // Advance initiative
    setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies), 1000);
  }

  function tryEscape() {
    const actor = initiativeOrder[currentTurn];
    if (!actor || actor.type !== 'party') return;
    
    const char = party[actor.index];
    const ag = char.stats.Ag || 20;
    const roll = d100();
    const success = roll <= ag;
    
    const log = [{ type: "player", text: `${char.name} escape attempt (Ag ${ag}): rolled ${roll}. ${success ? "SUCCESS!" : "FAILED!"}` }];
    setCombatLog(prevLog => [...prevLog, ...log]);
    
    if (success) {
      setTimeout(() => completeMission(false), 1500);
    } else {
      setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies), 1000);
    }
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
      setTimeout(() => advanceInitiative(actorIndex, init, partyPos, enemyPosList), 100);
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
      const wounds = partyWounds[i] || 0;
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
      setTimeout(() => advanceInitiative(), 500);
      return;
    }
    
    const target = party[nearestIdx];
    const targetPos = partyPos[nearestIdx];
    const agi = enemy.stats.Ag || 20;
    const moveRange = Math.floor(agi / 10) + 4;
    
    let log = [];
    let newEnemyPositions = [...enemyPosList];
    let currentEnemyPos = { ...enemyPos };
    let moved = false;
    
    // Check if already adjacent (Chebyshev distance = 1)
    const dx = Math.abs(targetPos.x - currentEnemyPos.x);
    const dy = Math.abs(targetPos.y - currentEnemyPos.y);
    const distToTarget = Math.max(dx, dy);
    
    // If not in attack range, try to move
    if (distToTarget > 1) {
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
            
            if (!occupiedByEnemy && !occupiedByParty) {
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
        setGridPositions({ ...gridPositions, enemies: newEnemyPositions });
        currentEnemyPos = { x: bestMove.x, y: bestMove.y };
        moved = true;
        log.push({ type: "enemy", text: `${enemy.name} moves ${bestMove.dist} squares toward ${target.name}.` });
      }
    }
    
    // Now attack if in range (Chebyshev distance = 1)
    const attackDx = Math.abs(targetPos.x - currentEnemyPos.x);
    const attackDy = Math.abs(targetPos.y - currentEnemyPos.y);
    const attackRange = Math.max(attackDx, attackDy);
    
    if (attackRange <= 1) {
      const ews = enemy.stats.WS || 20;
      const roll = d100();
      const hit = roll <= ews;
      
      log.push({ type: "enemy", text: `${enemy.name} attacks ${target.name} (WS ${ews}): rolled ${roll} vs ${ews}... ${hit ? "HIT!" : "MISS!"}` });
      
      if (hit) {
        const dmg = d6() + Math.floor((enemy.stats.S || 20) / 10);
        const newPartyWounds = [...partyWounds];
        newPartyWounds[nearestIdx] = (newPartyWounds[nearestIdx] || 0) + dmg;
        setPartyWounds(newPartyWounds);
        log.push({ type: "enemy", text: `Enemy deals ${dmg} damage! ${target.name}: ${Math.max(0, (target.wounds || 10) - newPartyWounds[nearestIdx])}/${target.wounds || 10} wounds.` });
        
        if (newPartyWounds[nearestIdx] >= (target.wounds || 10)) {
          log.push({ type: "enemy", text: `${target.name} has fallen!` });
          
          // Check if this party member has fate available
          const deadChar = party[nearestIdx];
          const hasFate = (deadChar.fate || 0) > 0;
          const fateNotSpent = !fateSpentInMission || !fateSpentInMission[nearestIdx];
          
          if (hasFate && fateNotSpent) {
            // Pause and show fate prompt for THIS character
            setCombatLog(prevLog => [...prevLog, ...log]);
            setPendingFateIndex(nearestIdx);
            return;
          }
        }
      }
    }
    
    setCombatLog(prevLog => [...prevLog, ...log]);
    
    console.log(">>> enemyTurn END, calling advanceInitiative with", actorIndex);
    // Advance initiative with updated positions
    setTimeout(() => advanceInitiative(actorIndex, init, partyPos, newEnemyPositions), 1000);
  }

  function completeMission(victory) {
    const char = selectedChar;
    const currentCheck = selectedMission.checks[currentCheckIndex];
    
    // Record combat result
    const combatResult = {
      label: currentCheck.label,
      flavor: victory ? "All enemies defeated" : "Escaped from combat",
      stat: "WS",
      statValue: char.stats.WS || 20,
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
        const rank = getRank(selectedChar.xp || 0);
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
    setCurrentEnemy(0);
    setIsPlayerTurn(true);
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
      const toughness  = char.stats.T || 20;
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
    const toughness = selectedChar.stats.T || 20;
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
    setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies), 500);
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
    setTimeout(() => advanceInitiative(currentTurn, initiativeOrder, gridPositions.party, gridPositions.enemies), 500);
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