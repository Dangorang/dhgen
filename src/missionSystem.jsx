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
  const [selectedChar, setSelectedChar] = useState(null);

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
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [fateSpentInMission, setFateSpentInMission] = useState(false);
  const combatLogRef = useRef(null);

  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLog]);
  const [playerWounds, setPlayerWounds]  = useState(0);
  const [enemyWounds, setEnemyWounds]   = useState([]);
  const [currentEnemy, setCurrentEnemy] = useState(0);

  // ── PHASE: SELECT CHARACTER ──────────────────────────────────
  if (phase === "select_character") {
    const saved = characters.filter(Boolean);
    const liveCharacters = saved.filter(c => !c.kia);
    const kiaCharacters = saved.filter(c => c.kia);
    
    return (
      <Screen onNavigate={onNavigate} title="Deploy Acolyte" subtitle="Select a character to send on a mission">
        {saved.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontFamily: "'IM Fell English', serif", color: "#5a4020", fontSize: 14 }}>
            No Acolytes on file. Create a character first.
          </div>
        ) : (
          <>
            {liveCharacters.length === 0 && kiaCharacters.length > 0 && (
              <div style={{ textAlign: "center", padding: 20, fontFamily: "'IM Fell English', serif", color: "#5a4020", fontSize: 13, marginBottom: 20, border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)" }}>
                No living Acolytes available for deployment.
              </div>
            )}
            {liveCharacters.map((char, i) => {
              const rank = getRank(char.xp || 0);
              return (
                <div key={i} onClick={() => { setSelectedChar(char); setSelectedCharIdx(i); setPhase("select_mission"); }}
                  style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", padding: "14px 18px", marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#c09040"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#3a2510"}>
                  <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 15, color: "#d4a850" }}>{char.name}</div>
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
              );
            })}
            
            {kiaCharacters.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#5a2020", textTransform: "uppercase", marginBottom: 10, fontFamily: "Cinzel", borderBottom: "1px solid #2a1808", paddingBottom: 6 }}>
                  — KIA —
                </div>
                {kiaCharacters.map((char, i) => {
                  const rank = getRank(char.xp || 0);
                  return (
                    <div key={`kia-${i}`}
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
      <Screen onNavigate={onNavigate} title="Select Mission" subtitle={`Deploying: ${selectedChar.name}`} onBack={() => { setPhase("select_character"); setEncounter(null); }}>
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
    const environment = getEnvironmentFromMission(selectedMission);
    const rank = getRank(selectedChar.xp || 0);
    const missionWithRank = { ...selectedMission, rank };
    
    if (!encounter) {
      const generatedEncounter = generateEncounter(missionWithRank, environment, rank);
      setEncounter(generatedEncounter);
      setEnemyWounds(generatedEncounter.enemies.map(e => e.wounds));
    }
    
    return (
      <Screen onNavigate={onNavigate} title={selectedMission.name} subtitle={`${selectedMission.type} · ${selectedMission.tier}`} onBack={() => { setPhase("select_mission"); setEncounter(null); }}>
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
          <button onClick={() => startCombat()} style={{ padding: "12px 32px", fontSize: 13, letterSpacing: 3, borderColor: TIER_COLOR[selectedMission.tier], color: TIER_COLOR[selectedMission.tier] }}>
            ✦ Deploy {selectedChar.name}
          </button>
        </div>
      </Screen>
    );
  }

  // ── PHASE: RESULTS ───────────────────────────────────────────
  if (phase === "results") {
    const passes = results.filter(r => r.passed).length;
    const fails  = results.filter(r => !r.passed).length;
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
        {fatePrompt && !isDead && (
          <div style={{ border: "1px solid #a07030", background: "rgba(40,25,5,0.9)", padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, color: "#c09040", letterSpacing: 2, marginBottom: 8 }}>— DEATH CHECK FAILED —</div>
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#b8a070", lineHeight: 1.6, marginBottom: 14 }}>
              {selectedChar.name} has fallen. The Emperor may yet have a purpose for this one.
              Spend a Fate Point to cheat death? <span style={{ color: "#a07030" }}>({selectedChar.fate} remaining)</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => spendFate()} style={{ borderColor: "#6a8060", color: "#80c080" }}>
                ✦ Spend Fate Point
              </button>
              <button onClick={() => confirmDeath()} style={{ borderColor: "#7a3a1b", color: "#c07050" }}>
                Accept Death
              </button>
            </div>
          </div>
        )}

        {/* CHECK RESULTS */}
        <div style={{ border: "1px solid #3a2510", background: "rgba(15,10,4,0.85)", marginBottom: 16 }}>
          <div style={{ background: "linear-gradient(90deg,#2a1808,#1a1005,#2a1808)", borderBottom: "1px solid #3a2510", padding: "8px 16px", fontFamily: "'Cinzel Decorative', serif", fontSize: 10, color: "#a07030", letterSpacing: 3 }}>
            — CHECK BY CHECK —
          </div>
          {results.map((r, i) => (
            <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #1a1005", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#a89070" }}>{r.label}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: r.passed ? "#6ee7b7" : "#f87171", fontWeight: 600 }}>
                  {r.passed ? "PASS" : "FAIL"}
                </span>
              </div>
              <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "#5a4020", fontStyle: "italic" }}>{r.flavor}</div>
              <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "#6a5030" }}>
                Rolled {r.roll} vs {r.stat} {r.statValue} (difficulty {r.difficulty}) · margin {r.margin}
                {r.extreme && <span style={{ color: r.passed ? "#6ee7b7" : "#f87171" }}> · EXTREME</span>}
              </div>
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
    const isDead = playerWounds >= (selectedChar.wounds || 10);
    const allEnemiesDead = enemyWounds.every(w => w <= 0);
    
    return (
      <Screen onNavigate={onNavigate} title="Combat Encounter" subtitle={currentEnemyData?.name || "Battle"} onBack={() => { setPhase("briefing"); setCombatLog([]); setPlayerWounds(0); setEnemyWounds(encounter?.enemies.map(e => e.wounds) || []); setIsPlayerTurn(true); }}>
        {/* Combat Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Player Status */}
          <div style={{ border: "1px solid #3a6a3a", background: "rgba(20,40,20,0.6)", padding: 12 }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, color: "#6ee7b7", marginBottom: 8 }}>{selectedChar.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8a9a8a", marginBottom: 4 }}>
              <span>Wounds</span>
              <span style={{ color: playerWounds > (selectedChar.wounds || 10) * 0.5 ? "#f87171" : "#6ee7b7" }}>
                {(selectedChar.wounds || 10) - playerWounds} / {selectedChar.wounds || 10}
              </span>
            </div>
            <div style={{ background: "#1a1a1a", height: 8, borderRadius: 4 }}>
              <div style={{ 
                background: playerWounds > (selectedChar.wounds || 10) * 0.5 ? "#6ee7b7" : "#f87171", 
                height: "100%", 
                width: `${Math.max(0, ((selectedChar.wounds || 10) - playerWounds) / (selectedChar.wounds || 10) * 100)}%`,
                borderRadius: 4,
                transition: "width 0.3s"
              }} />
            </div>
          </div>
          
          {/* Enemy Status */}
          <div style={{ border: "1px solid #6a3a3a", background: "rgba(40,20,20,0.6)", padding: 12 }}>
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
          {isPlayerTurn ? "▶ YOUR TURN - CHOOSE AN ACTION" : "⏳ ENEMY TURN..."}
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
        
        {/* Combat Actions */}
        {!isDead && !allEnemiesDead && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button 
              onClick={() => playerAttack()} 
              disabled={!isPlayerTurn}
              style={{ 
                borderColor: isPlayerTurn ? "#6a8060" : "#3a3a3a", 
                color: isPlayerTurn ? "#80c080" : "#4a4a4a", 
                padding: "10px 20px",
                opacity: isPlayerTurn ? 1 : 0.5,
                cursor: isPlayerTurn ? "pointer" : "not-allowed"
              }}>
              ⚔ Attack
            </button>
            <button 
              onClick={() => tryEscape()} 
              disabled={!isPlayerTurn}
              style={{ 
                borderColor: isPlayerTurn ? "#a07030" : "#3a3a3a", 
                color: isPlayerTurn ? "#c09040" : "#4a4a4a", 
                padding: "10px 20px",
                opacity: isPlayerTurn ? 1 : 0.5,
                cursor: isPlayerTurn ? "pointer" : "not-allowed"
              }}>
              🏃 Escape (Ag)
            </button>
          </div>
        )}
        
        {/* Combat End States */}
        {isDead && (
          <div style={{ border: "1px solid #7a1a1a", background: "rgba(60,10,10,0.8)", padding: 20, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: "#f87171", letterSpacing: 4, marginBottom: 8 }}>YOU HAVE FALLEN</div>
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#b87070", marginBottom: 16 }}>
              {selectedChar.name} has been slain in combat.
            </div>
            {!fateSpentInMission && (selectedChar.fate || 0) > 0 ? (
              <div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 12, color: "#c09040", marginBottom: 12 }}>
                  The Emperor provides... Spend a Fate Point to survive at 1 HP?
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button onClick={() => spendFateToSurvive()} style={{ borderColor: "#6a8060", color: "#80c080", padding: "10px 20px" }}>
                    ✦ Spend Fate ({selectedChar.fate} remaining)
                  </button>
                  <button onClick={() => confirmDeath()} style={{ borderColor: "#7a3a1b", color: "#c07050", padding: "10px 20px" }}>
                    Accept Death
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { confirmDeath(); setPhase("select_character"); resetMissionState(); }}>Return to Base</button>
            )}
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

  // ── COMBAT FUNCTIONS ───────────────────────────────────────────
  function startCombat() {
    setCombatLog([{ type: "system", text: `Combat begins with ${encounter.enemies.length} enemy/enemies!` }]);
    setPlayerWounds(0);
    setEnemyWounds(encounter.enemies.map(e => e.wounds));
    setCurrentEnemy(0);
    setIsPlayerTurn(true);
    setPhase("combat");
  }

  function playerAttack() {
    setIsPlayerTurn(false);
    const char = selectedChar;
    const enemy = encounter.enemies[currentEnemy];
    const ws = char.stats.WS || 20;
    const roll = d100();
    const hit = roll <= ws;
    
    let log = [{ type: "player", text: `Attack with WS ${ws}: rolled ${roll} vs ${ws}... ${hit ? "HIT!" : "MISS!"}` }];
    
    let enemyDead = false;
    let nextEnemyIndex = currentEnemy;
    
    if (hit) {
      const dmg = d6() + 3;
      const newEnemyWounds = [...enemyWounds];
      newEnemyWounds[currentEnemy] = Math.max(0, newEnemyWounds[currentEnemy] - dmg);
      setEnemyWounds(newEnemyWounds);
      log.push({ type: "player", text: `Dealt ${dmg} damage! Enemy: ${Math.max(0, newEnemyWounds[currentEnemy])}/${enemy.wounds} wounds.` });
      
      if (newEnemyWounds[currentEnemy] <= 0) {
        log.push({ type: "player", text: `The ${enemy.name} is DEFEATED!` });
        enemyDead = true;
        nextEnemyIndex = currentEnemy + 1;
        if (nextEnemyIndex < encounter.enemies.length) {
          setCurrentEnemy(nextEnemyIndex);
          log.push({ type: "system", text: `Next: ${encounter.enemies[nextEnemyIndex].name} approaches!` });
        }
      }
    }
    
    // Log player's action FIRST
    setCombatLog(prevLog => [...prevLog, ...log]);
    
    // Schedule enemy turn AFTER player log is shown
    const enemyStillAlive = enemyWounds[currentEnemy] > 0 || currentEnemy < encounter.enemies.length - 1;
    
    if (enemyStillAlive && !enemyDead) {
      setTimeout(() => {
        setIsPlayerTurn(true);
        enemyTurn();
      }, 1500);
    } else if (enemyDead && nextEnemyIndex < encounter.enemies.length) {
      setTimeout(() => {
        setIsPlayerTurn(true);
      }, 1500);
    } else {
      setIsPlayerTurn(true);
    }
  }

  function tryEscape() {
    setIsPlayerTurn(false);
    const char = selectedChar;
    const ag = char.stats.Ag || 20;
    const difficulty = 30;
    const roll = d100();
    const success = roll <= ag;
    
    const log = [{ type: "player", text: `Escape attempt (Ag ${ag}): rolled ${roll}. ${success ? "SUCCESS!" : "FAILED!"}` }];
    setCombatLog(prevLog => [...prevLog, ...log]);
    
    if (success) {
      setTimeout(() => completeMission(false), 1500);
    } else {
      setTimeout(() => {
        setIsPlayerTurn(true);
        enemyTurn();
      }, 1500);
    }
  }

  function enemyTurn() {
    const char = selectedChar;
    const enemy = encounter.enemies[currentEnemy];
    const ews = enemy.stats.WS || 20;
    const roll = d100();
    const hit = roll <= ews;
    
    let log = [{ type: "enemy", text: `${enemy.name} attacks (WS ${ews}): rolled ${roll} vs ${ews}... ${hit ? "HIT!" : "MISS!"}` }];
    
    if (hit) {
      const dmg = d6() + Math.floor((enemy.stats.S || 20) / 10);
      const newPlayerWounds = playerWounds + dmg;
      setPlayerWounds(newPlayerWounds);
      log.push({ type: "enemy", text: `Enemy deals ${dmg} damage! You: ${(char.wounds || 10) - newPlayerWounds}/${char.wounds || 10} wounds.` });
    }
    
    // Append enemy log using functional update to avoid stale closure
    setCombatLog(prevLog => [...prevLog, ...log]);
    setIsPlayerTurn(true);
  }

  function completeMission(victory) {
    const char = selectedChar;
    const mission = selectedMission;
    const injuriesList = [];
    
    const totalXP = victory ? encounter.totalXP + mission.xpSuccess : mission.xpFailure;
    
    setResults([{ label: "Combat", flavor: victory ? "All enemies defeated" : "Escaped from combat", stat: "WS", statValue: char.stats.WS || 20, difficulty: 0, roll: 0, passed: victory, margin: 0, extreme: false, isCombat: true }]);
    setInjuries([]);
    setXpGained(totalXP);
    
    let updatedStats = { ...char.stats };
    
    const newXP = (char.xp || 0) + totalXP;
    updateCharacter(selectedCharIdx, {
      ...char,
      stats: updatedStats,
      wounds: Math.max(1, (char.wounds || 10) - playerWounds),
      xp: newXP,
      injuries: [...(char.injuries || []), ...injuriesList.map(i => i.name)],
    });

    setPhase("results");
  }

  function resetMissionState() {
    setEncounter(null);
    setCombatLog([]);
    setPlayerWounds(0);
    setEnemyWounds([]);
    setCurrentEnemy(0);
    setIsPlayerTurn(true);
    setFateSpentInMission(false);
    setResults([]);
    setInjuries([]);
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

  function spendFateToSurvive() {
    if ((selectedChar.fate || 0) <= 0) return;
    
    const newFate = selectedChar.fate - 1;
    setFateSpentInMission(true);
    
    // Survive at 1 HP
    const newPlayerWounds = (selectedChar.wounds || 10) - 1;
    setPlayerWounds(newPlayerWounds);
    setIsDead(false);
    
    // Update character with reduced fate
    const updated = { ...selectedChar, fate: newFate };
    updateCharacter(selectedCharIdx, updated);
    
    // Add to combat log
    setCombatLog(prevLog => [...prevLog, { type: "system", text: "FATE POINT SPENT! You survive at 1 HP!" }]);
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