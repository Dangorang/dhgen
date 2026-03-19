import { useState } from "react";
import {getRank} from "./missionData";
export default function CharacterRoster({ onNavigate }) {
  const [characters, setCharacters] = useState([]);

  useState(() => {
    const saved = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    setCharacters(saved);
  });

  function deleteCharacter(index) {
    const updated = characters.filter((_, i) => i !== index);
    localStorage.setItem("dhgen_roster", JSON.stringify(updated));
    setCharacters(updated);
  }

  const STAT_NAMES = {
    meleeSkill:   "MEL", rangeSkill:   "RNG", strength:   "STR",
    toughness:    "TOU", agility:      "AGI", perception: "PER",
    intelligence: "INT", willpower:    "WP",  fellowship: "FEL",
    psyRating:    "PSY",
    // Legacy keys (old characters)
    WS: "MEL", BS: "RNG", S: "STR", T: "TOU", Ag: "AGI",
    Int: "INT", Per: "PER", WP: "WP", Fel: "FEL",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06080f", color: "#8ab4d4", fontFamily: "'Cinzel', serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(30,80,140,0.06) 40px, rgba(30,80,140,0.06) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(30,80,140,0.06) 40px, rgba(30,80,140,0.06) 41px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(20,80,180,0.10) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; }
        button { background: linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%); color: #8ab4d4; border: 1px solid #1e3d5c; border-left: 2px solid #1e4a7a; padding: 6px 14px; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; border-radius: 0; }
        button:hover { border-color: #c8a84a; border-left-color: #c8a84a; color: #e8d090; background: linear-gradient(180deg, #101e30 0%, #0c1624 100%); }
        .char-card { border: 1px solid #1e3d5c; background: rgba(8,15,28,0.9); margin-bottom: 20px; position: relative; }
        .char-card::before { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(30,74,122,0.2); pointer-events: none; }
        .card-header { background: linear-gradient(90deg, #080f1c, #0c1824, #080f1c); border-bottom: 1px solid #1e3d5c; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
        .card-name { font-family: 'Cinzel Decorative', serif; font-size: 16px; color: #c8a84a; letter-spacing: 2px; }
        .card-sub { font-family: 'Share Tech Mono', monospace; font-size: 11px; color: #2e5a82; margin-top: 4px; }
        .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: #0c1824; }
        .stat-cell { background: #060d18; padding: 8px 4px; text-align: center; }
        .stat-cell-label { font-size: 9px; letter-spacing: 2px; color: #2e5a82; text-transform: uppercase; margin-bottom: 4px; font-family: 'Share Tech Mono', monospace; }
        .stat-cell-val { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 600; }
        .empty-slot { border: 1px dashed #0e1e30; background: rgba(8,15,28,0.4); margin-bottom: 20px; padding: 24px; text-align: center; font-family: 'Share Tech Mono', monospace; font-size: 11px; color: #1e3d5c; letter-spacing: 3px; }
        .badge { border: 1px solid #1e4a7a; background: rgba(30,74,122,0.15); padding: 3px 10px; font-size: 10px; letter-spacing: 2px; color: #4a8aaa; display: inline-block; margin: 2px; font-family: 'Share Tech Mono', monospace; }
        .delete-btn { background: linear-gradient(180deg, #1a0808 0%, #0e0404 100%) !important; border-color: #3a1e1e !important; border-left-color: #5a1a1a !important; font-size: 10px !important; padding: 4px 10px !important; }
        .delete-btn:hover { border-color: #c04040 !important; border-left-color: #c04040 !important; color: #f08080 !important; background: linear-gradient(180deg, #2e0e0e 0%, #1e0808 100%) !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => onNavigate("home")}>← Command</button>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid #1e3d5c", paddingBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 24, color: "#c8a84a", letterSpacing: 6, marginBottom: 6 }}>OPERATIVE ROSTER</div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#2e5a82", letterSpacing: 3 }}>
            {characters.length}/8 Operatives on file
          </div>
        </div>

        {/* CHARACTER CARDS */}
        {Array.from({ length: 8 }).map((_, i) => {
          const char = characters[i];
          if (!char) {
            return (
              <div key={i} className="empty-slot">
                — Vacant —
              </div>
            );
          }

          return (
            <div key={i} className="char-card">
              <div className="card-header">
                <div>
                  <div className="card-name">{char.name}</div>
                  <div className="card-sub">{char.class || char.career || 'Operative'}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ border: "1px solid #1e4a7a", background: "rgba(30,74,122,0.15)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#4a8aaa", marginRight: 6, fontFamily: "'Share Tech Mono', monospace" }}>
                      {getRank(char.xp || 0)}
                    </span>
                    <span style={{ border: "1px solid #1e4a7a", background: "rgba(30,74,122,0.15)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#4a8aaa", fontFamily: "'Share Tech Mono', monospace" }}>
                      {char.xp || 0} XP
                    </span>
                    {char.kia && <span style={{ border: "1px solid #5a1a1a", background: "rgba(40,10,10,0.5)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#c05050", marginLeft: 6, fontFamily: "'Share Tech Mono', monospace" }}>KIA</span>}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {char.age > 0 && <span className="badge">Age {char.age}</span>}
                    {char.heightDisplay && <span className="badge">{char.heightDisplay}</span>}
                    {char.background && <span className="badge">{char.background}</span>}
                  </div>
                </div>
                <button className="delete-btn" onClick={() => deleteCharacter(i)}>✕ Delete</button>
              </div>

              {/* STATS GRID */}
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Share Tech Mono', monospace" }}>Characteristics</div>
                <div style={{ overflowX: "auto" }}>
                  <div className="stat-grid" style={{ minWidth: 400 }}>
                    {Object.entries(char.stats).map(([key, val]) => (
                      <div key={key} className="stat-cell">
                        <div className="stat-cell-label">{STAT_NAMES[key] || key}</div>
                        <div className="stat-cell-val" style={{ color: val >= 40 ? "#a78bfa" : val >= 35 ? "#6ee7b7" : val <= 22 ? "#f87171" : "#8ab4d4" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STATUS ROW */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#2e5a82", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Share Tech Mono', monospace" }}>Status</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge">Wounds: {char.wounds}</span>
                    <span className="badge">Fate: {char.fate}</span>
                    <span className="badge">Insanity: {char.insanity}</span>
                    <span className="badge">Corruption: {char.corruption}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 9, color: "#1e3d5c", letterSpacing: 3, fontFamily: "'Share Tech Mono', monospace" }}>
          ⬡ IN SERVICE TO THE COUNCIL ⬡
        </div>
      </div>
    </div>
  );
}
