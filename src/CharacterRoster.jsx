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
    <div style={{ minHeight: "100vh", background: "#0a0804", color: "#c8b89a", fontFamily: "'Cinzel', serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(139,90,43,0.03) 40px, rgba(139,90,43,0.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(139,90,43,0.03) 40px, rgba(139,90,43,0.03) 41px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(180,120,40,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English&display=swap');
        * { box-sizing: border-box; }
        button { background: linear-gradient(180deg, #3a2510 0%, #1e1208 100%); color: #c8b89a; border: 1px solid #5a3e1b; padding: 6px 14px; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; border-radius: 0; }
        button:hover { border-color: #c09040; color: #f0d890; background: linear-gradient(180deg, #5a3510 0%, #2e1e08 100%); }
        .char-card { border: 1px solid #3a2510; background: rgba(15,10,4,0.85); margin-bottom: 20px; position: relative; }
        .char-card::before { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(90,62,27,0.3); pointer-events: none; }
        .card-header { background: linear-gradient(90deg, #2a1808, #1a1005, #2a1808); border-bottom: 1px solid #3a2510; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
        .card-name { font-family: 'Cinzel Decorative', serif; font-size: 16px; color: #d4a850; letter-spacing: 2px; }
        .card-sub { font-family: 'IM Fell English', serif; font-size: 12px; color: #8a7050; margin-top: 2px; }
        .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: #2a1808; }
        .stat-cell { background: #0f0a04; padding: 8px 4px; text-align: center; }
        .stat-cell-label { font-size: 9px; letter-spacing: 2px; color: #6a5030; text-transform: uppercase; margin-bottom: 4px; }
        .stat-cell-val { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 600; }
        .empty-slot { border: 1px dashed #2a1808; background: rgba(15,10,4,0.4); margin-bottom: 20px; padding: 24px; text-align: center; font-family: 'IM Fell English', serif; font-size: 13px; color: #3a2810; letter-spacing: 2px; }
        .badge { border: 1px solid #4a3010; background: rgba(90,62,27,0.2); padding: 3px 10px; font-size: 10px; letter-spacing: 2px; color: #9a7840; display: inline-block; margin: 2px; }
        .delete-btn { background: linear-gradient(180deg, #3a1010 0%, #1e0808 100%) !important; border-color: #5a1e1b !important; font-size: 10px !important; padding: 4px 10px !important; }
        .delete-btn:hover { border-color: #c04040 !important; color: #f08080 !important; background: linear-gradient(180deg, #5a1510 0%, #2e0e08 100%) !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => onNavigate("home")}>← Back to Main Menu</button>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid #3a2510", paddingBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 24, color: "#c09040", letterSpacing: 6, marginBottom: 4 }}>ACOLYTE ROSTER</div>
          <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 13, color: "#6a5030", letterSpacing: 3 }}>
            {characters.length}/8 Acolytes on file
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
                  <div style={{ marginTop: 4 }}>
				  <span style={{ border: "1px solid #4a3010", background: "rgba(90,62,27,0.2)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#9a7840", marginRight: 6 }}>
					{getRank(char.xp || 0)}
				  </span>
				  <span style={{ border: "1px solid #4a3010", background: "rgba(90,62,27,0.2)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#9a7840" }}>
					{char.xp || 0} XP
				  </span>
				  {char.kia && <span style={{ border: "1px solid #5a2020", background: "rgba(60,10,10,0.4)", padding: "3px 10px", fontSize: 10, letterSpacing: 2, color: "#c05050", marginLeft: 6 }}>KIA</span>}
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
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#6a5030", textTransform: "uppercase", marginBottom: 8 }}>Characteristics</div>
                <div style={{ overflowX: "auto" }}>
                  <div className="stat-grid" style={{ minWidth: 400 }}>
                    {Object.entries(char.stats).map(([key, val]) => (
                      <div key={key} className="stat-cell">
                        <div className="stat-cell-label">{STAT_NAMES[key] || key}</div>
                        <div className="stat-cell-val" style={{ color: val >= 40 ? "#a78bfa" : val >= 35 ? "#6ee7b7" : val <= 22 ? "#f87171" : "#e2d5b0" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STATUS ROW */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#6a5030", textTransform: "uppercase", marginBottom: 8 }}>Status</div>
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

        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 10, color: "#2a1808", letterSpacing: 3, fontFamily: "Cinzel" }}>
          ✦ IN THE GRIM DARKNESS OF THE FAR FUTURE, THERE IS ONLY WAR ✦
        </div>
      </div>
    </div>
  );
}