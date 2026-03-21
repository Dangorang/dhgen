import { useState, useCallback } from "react";
import {
  ORIGINS, ALL_ROLES, getAvailableRoles, generateFullCharacter,
  generateStats, applyPrefectPromotion, generateName, generatePhysiology,
  generatePersonality, generateLoadout, generateDetails, calcWounds, calcFate,
  STAT_META,
} from "./generation/characterGenerator";

// ─────────────────────────────────────────────────────────────
// CharacterCreator — Prefect (Squad Leader) generation
// Layered: Origin → Role → Stats → Physiology → Name → Review
// ─────────────────────────────────────────────────────────────

const ORIGIN_KEYS = Object.keys(ORIGINS);

function originColor(origin) {
  const map = {
    "Hive-born": "#7a8a6a", "Void-born": "#6a7aaa", "Frontier-born": "#9a8a5a",
    "Schola-born": "#8a7a9a", "Noble-born": "#c8a84a", "Militarum-born": "#6a9a7a",
    "Outcast": "#aa6a5a",
  };
  return map[origin] || "#8ab4d4";
}

export default function CharacterCreator({ onNavigate, onComplete }) {
  const [step, setStep]     = useState("origin"); // origin | role | review | done
  const [char, setChar]     = useState(null);
  const [origin, setOrigin] = useState(null);

  // ── Generate full character from origin+role ────────────────────
  const buildCharacter = useCallback((o, r) => {
    const c = generateFullCharacter({ origin: o, role: r, isPrefect: true });
    setChar(c);
    setStep("review");
  }, []);

  // ── Reroll stats only ──────────────────────────────────────────
  const rerollStats = useCallback(() => {
    if (!char) return;
    let stats = generateStats(char.origin, char.role);
    stats = applyPrefectPromotion(stats);
    const wounds = calcWounds(stats);
    const physiology = generatePhysiology(char.origin, stats);
    setChar(c => ({ ...c, stats, wounds, physiology }));
  }, [char]);

  // ── Reroll name ────────────────────────────────────────────────
  const rerollName = useCallback(() => {
    if (!char) return;
    setChar(c => ({ ...c, name: generateName(c.origin) }));
  }, [char]);

  // ── Reroll personality ─────────────────────────────────────────
  const rerollPersonality = useCallback(() => {
    if (!char) return;
    setChar(c => ({ ...c, personality: generatePersonality(c.role, c.origin, true) }));
  }, [char]);

  // ── Reroll details ─────────────────────────────────────────────
  const rerollDetails = useCallback(() => {
    if (!char) return;
    setChar(c => ({ ...c, details: generateDetails(c.origin) }));
  }, [char]);

  // ── Confirm and proceed ────────────────────────────────────────
  const confirmPrefect = useCallback(() => {
    if (!char) return;
    // Save to campaign roster slot 0 = prefect
    const roster = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    // Replace any existing roster — new campaign starts fresh
    localStorage.setItem("dhgen_roster", JSON.stringify([char]));
    setStep("done");
    // If a callback was provided (campaign flow), call it
    if (onComplete) {
      setTimeout(() => onComplete(char), 300);
    }
  }, [char, onComplete]);

  const availableRoles = origin ? getAvailableRoles(origin) : ALL_ROLES;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#06080f", color: "#8ab4d4", fontFamily: "'Cinzel',serif", position: "relative", overflowX: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(30,80,140,0.06) 40px,rgba(30,80,140,0.06) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(30,80,140,0.06) 40px,rgba(30,80,140,0.06) 41px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(20,80,180,0.10) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        *{box-sizing:border-box;}
        .cc-btn{background:linear-gradient(180deg,#0c1a2e 0%,#080f1c 100%);color:#8ab4d4;border:1px solid #1e3d5c;border-left:2px solid #1e4a7a;padding:8px 18px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;border-radius:0;}
        .cc-btn:hover{border-color:#c8a84a;border-left-color:#c8a84a;color:#e8d090;background:linear-gradient(180deg,#101e30 0%,#0c1624 100%);}
        .cc-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .cc-btn-green{border-color:#1e5a3a;border-left-color:#2a7a50;color:#6ee7b7;}
        .cc-btn-green:hover{border-color:#2a8a5a;border-left-color:#3aaa70;color:#90ffb0;background:linear-gradient(180deg,#0a1e14 0%,#060f0a 100%);}
        .cc-card{border:1px solid #1e3d5c;background:rgba(8,15,28,0.9);position:relative;margin-bottom:16px;}
        .cc-card::before{content:'';position:absolute;inset:3px;border:1px solid rgba(30,74,122,0.2);pointer-events:none;}
        .stat-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #0c1824;}
        .stat-row:last-child{border-bottom:none;}
        .stat-label{font-size:9px;letter-spacing:2px;color:#2e5a82;text-transform:uppercase;}
        .stat-val{font-size:16px;font-weight:600;font-family:'Cinzel',serif;}
        .equip-item{padding:8px 12px;border-left:2px solid #1e4a7a;margin-bottom:8px;background:rgba(10,20,40,0.4);}
        input[type=text]{background:#060d18;border:1px solid #1e3d5c;color:#8ab4d4;padding:8px 12px;font-family:'Cinzel',serif;font-size:13px;width:100%;outline:none;letter-spacing:1px;}
        input[type=text]:focus{border-color:#c8a84a;}
        .origin-card{border:1px solid #1e3d5c;background:rgba(8,15,28,0.85);padding:16px 20px;cursor:pointer;transition:border-color 0.2s,background 0.2s;margin-bottom:10px;border-left:3px solid #1e4a7a;}
        .origin-card:hover{border-color:#c8a84a;border-left-color:#c8a84a;background:rgba(12,20,36,0.95);}
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <button className="cc-btn" onClick={() => onNavigate("home")}>← Command</button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: "1px solid #1e3d5c", paddingBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 22, color: "#c8a84a", letterSpacing: 5 }}>PREFECT DESIGNATION</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#2e5a82", letterSpacing: 3, marginTop: 6 }}>
            {step === "origin" ? "Select Squad Leader Origin" : step === "role" ? "Select Base Role" : step === "review" ? "Review & Confirm" : "Prefect Registered"}
          </div>
        </div>

        {/* ── STEP 1: ORIGIN SELECTION ── */}
        {step === "origin" && (
          <>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#2e5a82", marginBottom: 20, lineHeight: 1.6, textAlign: "center" }}>
              Your Prefect&apos;s origin shapes their stats, appearance, name conventions, and available roles.
            </div>
            {ORIGIN_KEYS.map(key => {
              const o = ORIGINS[key];
              const mods = Object.entries(o.statMods).map(([k, v]) => `${k.slice(0,3).toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(", ");
              return (
                <div key={key} className="origin-card" onClick={() => { setOrigin(key); setStep("role"); }}
                  style={{ borderLeftColor: originColor(key) }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: originColor(key), letterSpacing: 2, marginBottom: 4 }}>
                    {key.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a7a9a", marginBottom: 6, lineHeight: 1.5 }}>
                    Roles: {[...o.roles, ...o.rareRoles.map(r => r + " (rare)")].join(", ")}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2e5a82" }}>
                    Modifiers: {mods}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── STEP 2: ROLE SELECTION ── */}
        {step === "role" && origin && (
          <>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#2e5a82", marginBottom: 20, lineHeight: 1.6, textAlign: "center" }}>
              Select the Prefect&apos;s base role. Prefect promotion adds +5 WIL, +10 LDR on top.
            </div>
            <div style={{ marginBottom: 16 }}>
              <button className="cc-btn" onClick={() => setStep("origin")}>← Change Origin ({origin})</button>
            </div>
            {availableRoles.map(role => {
              const isRare = ORIGINS[origin].rareRoles.includes(role);
              return (
                <div key={role} className="origin-card" onClick={() => buildCharacter(origin, role)}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: "#c8a84a", letterSpacing: 2, marginBottom: 4 }}>
                    {role.toUpperCase()}{isRare ? " (RARE)" : ""}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2e5a82" }}>
                    Click to generate Prefect ({origin} {role})
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === "review" && char && (
          <>
            {/* Name */}
            <div className="cc-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Share Tech Mono',monospace" }}>Prefect Designation</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="text" value={char.name} onChange={e => setChar(c => ({ ...c, name: e.target.value }))} placeholder="Enter name..." style={{ flex: 1 }} />
                <button className="cc-btn" onClick={rerollName}>↺ Name</button>
              </div>
              <div style={{ marginTop: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a8aaa" }}>
                {char.origin} · {char.class} · {char.personality}
              </div>
            </div>

            {/* Stats */}
            <div className="cc-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace" }}>Characteristics</div>
                <button className="cc-btn" onClick={rerollStats}>↺ Reroll Stats</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                {STAT_META.map(({ key, label, desc }) => {
                  if (key === "psyRating" && char.role !== "Sanctioned") return null;
                  const val = char.stats[key];
                  const color = val >= 40 ? "#6ee7b7" : val >= 30 ? "#8ab4d4" : val <= 22 ? "#f87171" : "#a8c8e0";
                  return (
                    <div key={key} className="stat-row">
                      <div>
                        <div className="stat-label">{label}</div>
                        <div style={{ fontSize: 9, color: "#1e3d5c", letterSpacing: 1 }}>{desc}</div>
                      </div>
                      <div className="stat-val" style={{ color }}>{val}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #0c1824" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Share Tech Mono',monospace" }}>Derived</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[["Wounds", char.wounds], ["Fate Pts", char.fate], ["Insanity", 0], ["Corruption", 0]].map(([k, v]) => (
                    <span key={k} style={{ border: "1px solid #1e4a7a", background: "rgba(30,74,122,0.15)", padding: "4px 10px", fontSize: 10, color: "#4a8aaa", fontFamily: "'Share Tech Mono',monospace" }}>
                      {k}: {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Physiology */}
            <div className="cc-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Share Tech Mono',monospace" }}>Physiology</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  ["Age", char.physiology.age],
                  ["Height", `${char.physiology.height}cm`],
                  ["Weight", `${char.physiology.weight}kg`],
                  ["Build", char.physiology.build],
                  ["Skin", char.physiology.skinTone],
                  ["Hair", char.physiology.hairColor],
                  ["Eyes", char.physiology.eyeColor],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(10,20,40,0.5)", padding: "6px 10px", borderLeft: "2px solid #1e4a7a" }}>
                    <div style={{ fontSize: 8, color: "#2e5a82", letterSpacing: 2 }}>{k}</div>
                    <div style={{ fontSize: 11, color: "#8ab4d4", fontFamily: "'Share Tech Mono',monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personality & Details */}
            <div className="cc-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace" }}>Character</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="cc-btn" onClick={rerollPersonality}>↺ Personality</button>
                  <button className="cc-btn" onClick={rerollDetails}>↺ Details</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#1e4a7a", letterSpacing: 1, marginBottom: 4 }}>PERSONALITY</div>
                  <div style={{ fontSize: 13, color: "#c8a84a", fontFamily: "'Cinzel',serif" }}>{char.personality}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#1e4a7a", letterSpacing: 1, marginBottom: 4 }}>QUIRK</div>
                  <div style={{ fontSize: 10, color: "#4a8aaa", fontFamily: "'Share Tech Mono',monospace" }}>{char.details.quirk}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#1e4a7a", letterSpacing: 1, marginBottom: 4 }}>VISUAL TRAITS</div>
                  <div style={{ fontSize: 10, color: "#4a8aaa", fontFamily: "'Share Tech Mono',monospace" }}>{char.details.visualTraits.join(", ")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#1e4a7a", letterSpacing: 1, marginBottom: 4 }}>CHARM</div>
                  <div style={{ fontSize: 10, color: "#4a8aaa", fontFamily: "'Share Tech Mono',monospace" }}>{char.details.charm}</div>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="cc-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Share Tech Mono',monospace" }}>Loadout</div>
              {char.equipment.map((item, i) => (
                <div key={item.id + i} className="equip-item">
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: "#8ab4d4", marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2e5a82" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="cc-btn cc-btn-green" onClick={confirmPrefect}>
                ⬡ Confirm Prefect
              </button>
              <button className="cc-btn" onClick={() => buildCharacter(char.origin, char.role)}>
                ↺ Reroll Everything
              </button>
              <button className="cc-btn" onClick={() => { setStep("origin"); setChar(null); }}>
                ← Change Origin
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: DONE ── */}
        {step === "done" && char && (
          <div style={{ border: "1px solid #1e5a3a", background: "rgba(8,20,14,0.7)", padding: 28, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 20, color: "#6ee7b7", letterSpacing: 4, marginBottom: 10 }}>
              PREFECT REGISTERED
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 14, color: "#6aaa8a", marginBottom: 8 }}>
              {char.name}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#2e5a82", marginBottom: 24 }}>
              {char.origin} · {char.class} · {char.wounds} Wounds · {char.personality}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {!onComplete && (
                <>
                  <button className="cc-btn" onClick={() => onNavigate("roster")}>View Roster</button>
                  <button className="cc-btn" onClick={() => onNavigate("home")}>Command</button>
                </>
              )}
              {onComplete && (
                <button className="cc-btn cc-btn-green" onClick={() => onComplete(char)}>
                  Proceed to Agent Recruitment →
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "24px 0 8px", fontSize: 9, color: "#1e3d5c", letterSpacing: 3, fontFamily: "'Share Tech Mono',monospace" }}>
          ⬡ IN SERVICE TO THE COUNCIL ⬡
        </div>
      </div>
    </div>
  );
}
