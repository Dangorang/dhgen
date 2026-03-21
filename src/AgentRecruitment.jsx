import { useState, useEffect } from "react";
import { generateFullCharacter, STAT_META } from "./generation/characterGenerator";

// ─────────────────────────────────────────────────────────────
// AgentRecruitment — 10 random agents, player selects up to 8
// ─────────────────────────────────────────────────────────────

function AgentCard({ agent, selected, onToggle, expanded, onExpand }) {
  const roleColors = {
    "Veteran Infantry": "#6ee7b7", "Sanctioned": "#b090e0", "Artificer": "#e0c060",
    "Corpsman": "#60b0e0", "Demotech": "#e08060", "Infiltrator": "#a0a0c0",
  };
  const roleColor = roleColors[agent.role] || "#8ab4d4";

  return (
    <div
      onClick={onToggle}
      style={{
        border: `1px solid ${selected ? "#2a8a5a" : "#1e3d5c"}`,
        borderLeft: `3px solid ${selected ? "#3aaa70" : roleColor}`,
        background: selected ? "rgba(8,20,14,0.8)" : "rgba(8,15,28,0.9)",
        padding: "12px 16px",
        marginBottom: 8,
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      {/* Selection indicator */}
      {selected && (
        <div style={{ position: "absolute", right: 12, top: 12, color: "#3aaa70", fontSize: 14, fontFamily: "'Cinzel',serif" }}>
          ✓ SELECTED
        </div>
      )}

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: selected ? "#6ee7b7" : "#8ab4d4", letterSpacing: 1 }}>
          {agent.name}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onExpand(); }}
          style={{
            background: "none", border: "1px solid #1e3d5c", color: "#2e5a82", padding: "2px 8px",
            fontSize: 9, fontFamily: "'Share Tech Mono',monospace", cursor: "pointer", letterSpacing: 1,
          }}
        >
          {expanded ? "COLLAPSE" : "DETAILS"}
        </button>
      </div>

      {/* Summary line */}
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a7a9a", marginBottom: 4 }}>
        {agent.origin} · {agent.role} · {agent.personality}
      </div>

      {/* Key stats inline */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STAT_META.filter(s => s.key !== "psyRating" || agent.role === "Sanctioned").map(({ key, abbr }) => {
          const val = agent.stats[key];
          const color = val >= 40 ? "#6ee7b7" : val >= 30 ? "#8ab4d4" : val <= 22 ? "#f87171" : "#a8c8e0";
          return (
            <span key={key} style={{ fontSize: 9, fontFamily: "'Share Tech Mono',monospace", color: "#2e5a82" }}>
              {abbr}:<span style={{ color, marginLeft: 2 }}>{val}</span>
            </span>
          );
        })}
        <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono',monospace", color: "#2e5a82" }}>
          W:<span style={{ color: "#c8a84a", marginLeft: 2 }}>{agent.wounds}</span>
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #0c1824" }}>
          {/* Physiology */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {[
              ["Age", agent.physiology.age], ["Height", `${agent.physiology.height}cm`],
              ["Weight", `${agent.physiology.weight}kg`], ["Build", agent.physiology.build],
              ["Skin", agent.physiology.skinTone], ["Hair", agent.physiology.hairColor],
              ["Eyes", agent.physiology.eyeColor],
            ].map(([k, v]) => (
              <span key={k} style={{ fontSize: 9, fontFamily: "'Share Tech Mono',monospace", color: "#2e5a82" }}>
                {k}: <span style={{ color: "#4a8aaa" }}>{v}</span>
              </span>
            ))}
          </div>
          {/* Details */}
          <div style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", color: "#4a8aaa", marginBottom: 4 }}>
            Traits: {agent.details.visualTraits.join(", ")}
          </div>
          <div style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", color: "#4a8aaa", marginBottom: 4 }}>
            Charm: {agent.details.charm}
          </div>
          <div style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", color: "#4a8aaa", marginBottom: 4 }}>
            Quirk: {agent.details.quirk}
          </div>
          {/* Equipment */}
          <div style={{ fontSize: 9, letterSpacing: 1, color: "#2e5a82", marginTop: 6, marginBottom: 4, textTransform: "uppercase" }}>Loadout</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {agent.equipment.map((item, i) => (
              <span key={item.id + i} style={{
                fontSize: 9, fontFamily: "'Share Tech Mono',monospace", color: "#4a8aaa",
                background: "rgba(10,20,40,0.5)", padding: "2px 6px", border: "1px solid #0c1824",
              }}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentRecruitment({ onNavigate, onComplete, prefect }) {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);

  // Generate 10 random agents on mount
  useEffect(() => {
    const pool = [];
    for (let i = 0; i < 10; i++) {
      pool.push(generateFullCharacter({ isPrefect: false }));
    }
    setAgents(pool);
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 8) {
        next.add(id);
      }
      return next;
    });
  };

  const confirmSquad = () => {
    const squad = agents.filter(a => selected.has(a.id));
    // Save roster: prefect + selected agents
    const prefectData = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    const roster = [prefectData[0] || prefect, ...squad];
    localStorage.setItem("dhgen_roster", JSON.stringify(roster));
    if (onComplete) onComplete(squad);
  };

  const selectedCount = selected.size;

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
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <button className="cc-btn" onClick={() => onNavigate("home")}>← Command</button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: "1px solid #1e3d5c", paddingBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 22, color: "#c8a84a", letterSpacing: 5 }}>AGENT RECRUITMENT</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#2e5a82", letterSpacing: 3, marginTop: 6 }}>
            Select up to 8 agents for your squad ({selectedCount}/8 selected)
          </div>
        </div>

        {/* Prefect summary */}
        {prefect && (
          <div style={{ border: "1px solid #1e5a3a", background: "rgba(8,20,14,0.5)", padding: "10px 16px", marginBottom: 16, borderLeft: "3px solid #3aaa70" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2e5a82", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              Squad Leader
            </div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: "#6ee7b7" }}>
              {prefect.name} — {prefect.origin} {prefect.class}
            </div>
          </div>
        )}

        {/* Agent list */}
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selected.has(agent.id)}
            onToggle={() => toggleSelect(agent.id)}
            expanded={expandedId === agent.id}
            onExpand={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
          />
        ))}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <button
            className="cc-btn cc-btn-green"
            disabled={selectedCount === 0}
            onClick={confirmSquad}
          >
            ⬡ Deploy Squad ({selectedCount} agent{selectedCount !== 1 ? "s" : ""})
          </button>
          <button className="cc-btn" onClick={() => {
            const pool = [];
            for (let i = 0; i < 10; i++) pool.push(generateFullCharacter({ isPrefect: false }));
            setAgents(pool);
            setSelected(new Set());
          }}>
            ↺ Request New Candidates
          </button>
        </div>

        <div style={{ textAlign: "center", padding: "24px 0 8px", fontSize: 9, color: "#1e3d5c", letterSpacing: 3, fontFamily: "'Share Tech Mono',monospace" }}>
          ⬡ IN SERVICE TO THE COUNCIL ⬡
        </div>
      </div>
    </div>
  );
}
