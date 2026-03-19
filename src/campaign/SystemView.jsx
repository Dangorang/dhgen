// SystemView.jsx — Orbital body view for a selected star system
// Shows the star at center with orbital rings and body icons

const BODY_COLORS = {
  rocky_barren: "#6a6050",
  gas_giant: "#b08040",
  ice_dwarf: "#80a0c0",
  asteroid_belt: "#5a5040",
  planet_of_interest: "#c8a84a",
};

const BODY_ICONS = {
  rocky_barren: "●",
  gas_giant: "◉",
  ice_dwarf: "◦",
  asteroid_belt: "⋯",
  planet_of_interest: "⬡",
};

export default function SystemView({ state, dispatch }) {
  const star = state.sector.stars.find((s) => s.id === state.sector.currentStarId);
  if (!star) return null;

  const poi = star.bodies.find((b) => b.isPOI);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#06080f",
      display: "flex", flexDirection: "column",
      fontFamily: "'Cinzel', serif", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        @keyframes poiPulse {
          0%,100% { box-shadow: 0 0 8px #c8a84a40; }
          50%     { box-shadow: 0 0 20px #c8a84a80; }
        }
        @keyframes orbitPulse {
          0%,100% { opacity: 0.15; }
          50%     { opacity: 0.3; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px", borderBottom: "1px solid #1e3d5c", flexShrink: 0,
      }}>
        <div>
          <span style={{ color: "#c8a84a", letterSpacing: 4, fontSize: 12 }}>
            {star.name.toUpperCase()}
          </span>
          <span style={{ color: "#1e4a7a", letterSpacing: 3, fontSize: 10, marginLeft: 12 }}>
            — {star.type.toUpperCase()} SYSTEM —
          </span>
        </div>
        <button onClick={() => dispatch({ type: "BACK_TO_SECTOR" })} style={{
          background: "transparent", border: "1px solid #1e3d5c",
          color: "#2e5a82", fontFamily: "'Cinzel', serif",
          fontSize: 9, letterSpacing: 3, padding: "6px 16px",
          cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a84a"; e.currentTarget.style.color = "#c8a84a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3d5c"; e.currentTarget.style.color = "#2e5a82"; }}
        >
          ← SECTOR MAP
        </button>
      </div>

      {/* System view body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Orbital diagram */}
        <div style={{ flex: "0 0 60%", position: "relative", display: "flex",
          alignItems: "center", justifyContent: "center" }}>
          <svg width="100%" height="100%" viewBox="0 0 600 600"
            preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={star.color} stopOpacity="0.4" />
                <stop offset="50%" stopColor={star.color} stopOpacity="0.1" />
                <stop offset="100%" stopColor={star.color} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Star glow */}
            <circle cx="300" cy="300" r="80" fill="url(#starGlow)" />

            {/* Star */}
            <circle cx="300" cy="300" r="22" fill={star.color}
              style={{ filter: `drop-shadow(0 0 15px ${star.color}80)` }} />
            <text x="300" y="340" textAnchor="middle" fontSize="10"
              fill="#8ab4d4" fontFamily="'Share Tech Mono', monospace">
              {star.spectral}
            </text>

            {/* Orbital rings and bodies */}
            {star.bodies.map((body, i) => {
              const orbitRadius = 70 + (i + 1) * 42;
              const angle = (i * 137.5 + 30) * (Math.PI / 180); // golden angle spread
              const bx = 300 + Math.cos(angle) * orbitRadius;
              const by = 300 + Math.sin(angle) * orbitRadius;
              const bodyColor = BODY_COLORS[body.type] || "#666";
              const bodyRadius = body.type === "gas_giant" ? 10
                : body.type === "asteroid_belt" ? 3
                : body.isPOI ? 9 : 6;

              return (
                <g key={i}>
                  {/* Orbit ring */}
                  <circle cx="300" cy="300" r={orbitRadius}
                    fill="none" stroke="#1e3d5c" strokeWidth="0.5"
                    opacity="0.2" strokeDasharray={body.type === "asteroid_belt" ? "3 3" : "none"} />

                  {/* Body */}
                  {body.type === "asteroid_belt" ? (
                    // Scatter some dots along the orbit
                    <>
                      {Array.from({ length: 12 }).map((_, j) => {
                        const a = (j * 30 + i * 20) * (Math.PI / 180);
                        const r = orbitRadius + (j % 3 - 1) * 4;
                        return (
                          <circle key={j}
                            cx={300 + Math.cos(a) * r}
                            cy={300 + Math.sin(a) * r}
                            r={1 + (j % 2)} fill="#5a5040" opacity="0.5" />
                        );
                      })}
                    </>
                  ) : (
                    <g style={{ cursor: body.isPOI ? "pointer" : "default" }}
                      onClick={() => {
                        if (body.isPOI) {
                          dispatch({ type: "SET_PLANET", planet: { starId: star.id, bodySlot: body.slot, name: body.name, generated: false } });
                        }
                      }}>
                      {/* POI pulse ring */}
                      {body.isPOI && (
                        <circle cx={bx} cy={by} r={bodyRadius + 6}
                          fill="none" stroke="#c8a84a" strokeWidth="1"
                          opacity="0.4" style={{ animation: "orbitPulse 2s ease-in-out infinite" }} />
                      )}
                      {/* Planet body */}
                      <circle cx={bx} cy={by} r={bodyRadius}
                        fill={bodyColor} stroke={body.isPOI ? "#c8a84a" : bodyColor}
                        strokeWidth={body.isPOI ? 1.5 : 0.5}
                        opacity={0.85}
                        style={body.isPOI ? { filter: "drop-shadow(0 0 8px #c8a84a60)" } : {}} />
                      {/* Gas giant bands */}
                      {body.type === "gas_giant" && (
                        <>
                          <ellipse cx={bx} cy={by - 2} rx={bodyRadius - 1} ry={1.5}
                            fill="none" stroke="#00000030" strokeWidth="1" />
                          <ellipse cx={bx} cy={by + 3} rx={bodyRadius - 2} ry={1}
                            fill="none" stroke="#00000020" strokeWidth="1" />
                        </>
                      )}
                      {/* Label */}
                      <text x={bx} y={by + bodyRadius + 12}
                        textAnchor="middle" fontSize="7"
                        fill={body.isPOI ? "#c8a84a" : "#2e5a82"}
                        fontFamily="'Share Tech Mono', monospace">
                        {body.name.length > 14 ? body.name.substring(0, 12) + "…" : body.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        <div style={{ flex: "0 0 40%", borderLeft: "1px solid #1e3d5c",
          overflowY: "auto", padding: "20px 18px" }}>

          {/* System info */}
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
            letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
            paddingBottom: 4, marginBottom: 12, textTransform: "uppercase" }}>
            System Survey
          </div>

          {star.bodies.map((body, i) => (
            <div key={i} style={{
              border: body.isPOI ? "1px solid #1e4a7a" : "1px solid #0c1824",
              background: body.isPOI ? "rgba(30,74,122,0.1)" : "rgba(8,15,28,0.6)",
              padding: "10px 12px", marginBottom: 8,
              cursor: body.isPOI ? "pointer" : "default",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={(e) => { if (body.isPOI) e.currentTarget.style.borderColor = "#c8a84a"; }}
              onMouseLeave={(e) => { if (body.isPOI) e.currentTarget.style.borderColor = "#1e4a7a"; }}
              onClick={() => {
                if (body.isPOI) {
                  dispatch({ type: "SET_PLANET", planet: { starId: star.id, bodySlot: body.slot, name: body.name, generated: false } });
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{
                  fontSize: body.isPOI ? 12 : 11,
                  color: body.isPOI ? "#c8a84a" : "#8ab4d4",
                  fontFamily: body.isPOI ? "'Cinzel', serif" : "'Share Tech Mono', monospace",
                }}>
                  {BODY_ICONS[body.type]} {body.name}
                </div>
                <div style={{ fontSize: 8, color: "#1e3d5c", letterSpacing: 1,
                  fontFamily: "'Share Tech Mono', monospace" }}>
                  ORBIT {i + 1}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#6a90b0", lineHeight: 1.6 }}>
                {body.description}
              </div>
              {body.isPOI && (
                <div style={{ marginTop: 8, fontSize: 9, color: "#c8a84a",
                  letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>
                  ▸ SELECT TO DEPLOY
                </div>
              )}
            </div>
          ))}

          {/* Sector dispatch briefing */}
          {poi && (
            <div style={{ marginTop: 16, border: "1px solid #1e3d5c",
              padding: "14px", background: "rgba(8,15,28,0.8)" }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                letterSpacing: 3, color: "#c8a84a", marginBottom: 8 }}>
                SECTOR DISPATCH
              </div>
              <div style={{ fontSize: 11, color: "#8ab4d4", lineHeight: 1.7,
                fontStyle: "italic" }}>
                "Growing dissonance among the populace of {poi.name}. Civil unrest reports increasing. Investigate the root cause and restore order."
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: "#2e5a82",
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
                — ENFORCEMENT DIRECTORATE COMMAND
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
