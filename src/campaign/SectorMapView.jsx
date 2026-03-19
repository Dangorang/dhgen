// SectorMapView.jsx — Procedural star system selector (top-down sector view)
import { useEffect } from "react";
import { generateSector } from "../generation/starSystemGenerator";

// ── Seeded PRNG for background stars ────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function StarField() {
  const rand = mulberry32(0xcafebabe);
  const stars = [];
  for (let i = 0; i < 240; i++) {
    stars.push({
      cx: rand() * 100,
      cy: rand() * 100,
      r: rand() * 1.0 + 0.2,
      opacity: rand() * 0.5 + 0.1,
    });
  }
  return (
    <>
      {stars.map((s, i) => (
        <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r}
          fill="#4a6a9a" opacity={s.opacity} />
      ))}
    </>
  );
}

function TransitRoutes({ stars }) {
  const lines = [];
  // Connect each star to its nearest 1-2 neighbors
  for (let i = 0; i < stars.length; i++) {
    const dists = stars.map((s, j) => ({
      j,
      d: Math.hypot(s.position.x - stars[i].position.x, s.position.y - stars[i].position.y),
    })).filter((d) => d.j !== i).sort((a, b) => a.d - b.d);

    const neighbors = dists.slice(0, 2);
    for (const n of neighbors) {
      const key = [i, n.j].sort().join("-");
      if (!lines.find((l) => l.key === key)) {
        lines.push({
          key,
          x1: stars[i].position.x,
          y1: stars[i].position.y,
          x2: stars[n.j].position.x,
          y2: stars[n.j].position.y,
        });
      }
    }
  }
  return (
    <>
      {lines.map((l) => (
        <line key={l.key}
          x1={`${l.x1}%`} y1={`${l.y1}%`}
          x2={`${l.x2}%`} y2={`${l.y2}%`}
          stroke="#1e4a7a" strokeWidth="0.4"
          strokeDasharray="2 2" opacity="0.35" />
      ))}
    </>
  );
}

function StarNode({ star, isSelected, onClick }) {
  const { position: pos } = star;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Pulse ring */}
      <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r="14"
        fill="none" stroke={star.color} strokeWidth="0.8"
        opacity="0.4" className="star-pulse"
        style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      {/* Selection ring */}
      {isSelected && (
        <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r="13"
          fill="none" stroke="#e8d090" strokeWidth="1.5" opacity="0.9" />
      )}
      {/* Star glow */}
      <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r="8"
        fill={star.color} opacity="0.15" />
      {/* Main star */}
      <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r="4.5"
        fill={star.color} stroke={star.color} strokeWidth="0.5" opacity="0.9" />
      {/* Star name */}
      <text x={`${pos.x}%`} y={`${pos.y + 4.5}%`}
        textAnchor="middle" fontSize="3.2"
        fill="#8ab4d4" fontFamily="'Share Tech Mono', monospace"
        letterSpacing="0.5" pointerEvents="none">
        {star.name.toUpperCase()}
      </text>
      {/* Spectral class */}
      <text x={`${pos.x}%`} y={`${pos.y + 6.5}%`}
        textAnchor="middle" fontSize="2.2"
        fill="#2e5a82" fontFamily="'Share Tech Mono', monospace"
        letterSpacing="0.5" pointerEvents="none">
        {star.spectral}
      </text>
    </g>
  );
}

// ── Detail panel ────────────────────────────────────────────────────────────
function NullPanel() {
  return (
    <div style={{ textAlign: "center", paddingTop: 60 }}>
      <div style={{ color: "#1e4a7a", fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10, letterSpacing: 4, marginBottom: 16 }}>
        ⬡ SELECT A STAR SYSTEM ⬡
      </div>
      <div style={{ color: "#1e3d5c", fontSize: 10, letterSpacing: 2,
        fontFamily: "'Share Tech Mono', monospace" }}>
        — Council astrocartographic survey —
      </div>
      <div style={{ margin: "32px auto 0", width: 80, height: 1,
        background: "linear-gradient(90deg, transparent, #1e4a7a, transparent)" }} />
    </div>
  );
}

function StarPanel({ star, onEnterSystem }) {
  const poi = star.bodies.find((b) => b.isPOI);
  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
      <span style={{ color: "#2e5a82", letterSpacing: 1, fontFamily: "'Share Tech Mono', monospace" }}>{label}</span>
      <span style={{ color: "#8ab4d4", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );

  return (
    <div>
      <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: "#c8a84a",
        marginBottom: 4, letterSpacing: 2 }}>
        {star.name}
      </div>
      <div style={{ fontSize: 10, color: "#2e5a82", letterSpacing: 3, marginBottom: 16,
        fontFamily: "'Share Tech Mono', monospace" }}>
        {star.type.toUpperCase()} — {star.spectral}
      </div>

      {row("SPECTRAL CLASS", star.spectral)}
      {row("HABITABILITY", star.habitability)}
      {row("ORBITAL BODIES", star.bodies.length)}

      {/* Star color swatch */}
      <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: star.color,
          boxShadow: `0 0 12px ${star.color}40` }} />
        <span style={{ color: "#2e5a82", fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>
          {star.color.toUpperCase()}
        </span>
      </div>

      <div style={{ margin: "16px 0", height: 1,
        background: "linear-gradient(90deg, #1e3d5c, transparent)" }} />

      {/* Orbital bodies list */}
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
        letterSpacing: 3, color: "#c8a84a", borderBottom: "1px solid #1e3d5c",
        paddingBottom: 4, marginBottom: 10, textTransform: "uppercase" }}>
        Orbital Bodies
      </div>
      {star.bodies.map((body, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "6px 0", borderBottom: "1px solid #0c1824",
        }}>
          <div>
            <div style={{ fontSize: 11, color: body.isPOI ? "#c8a84a" : "#8ab4d4",
              fontFamily: body.isPOI ? "'Cinzel', serif" : "'Share Tech Mono', monospace" }}>
              {body.isPOI ? "⬡ " : ""}{body.name}
            </div>
            <div style={{ fontSize: 9, color: "#2e5a82", marginTop: 2 }}>
              {body.type === "planet_of_interest" ? "TARGET WORLD"
                : body.type === "gas_giant" ? `Gas Giant${body.moons ? ` — ${body.moons} moons` : ""}`
                : body.type === "ice_dwarf" ? "Ice Dwarf"
                : body.type === "asteroid_belt" ? "Asteroid Belt"
                : "Rocky World"}
            </div>
          </div>
          <div style={{ fontSize: 8, color: "#1e3d5c", letterSpacing: 1,
            fontFamily: "'Share Tech Mono', monospace" }}>
            ORBIT {i + 1}
          </div>
        </div>
      ))}

      {/* Planet of Interest callout */}
      {poi && (
        <div style={{ marginTop: 16, border: "1px solid #1e4a7a",
          background: "rgba(30,74,122,0.1)", padding: "12px" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
            letterSpacing: 3, color: "#c8a84a", marginBottom: 8 }}>
            MISSION TARGET
          </div>
          <div style={{ fontSize: 12, color: "#c8a84a", fontFamily: "'Cinzel', serif",
            marginBottom: 4 }}>
            {poi.name}
          </div>
          <div style={{ fontSize: 10, color: "#8ab4d4", lineHeight: 1.6 }}>
            Detailed planetary survey required. Deploy operatives to investigate reported anomalies.
          </div>
        </div>
      )}

      {/* Enter system button */}
      <button onClick={onEnterSystem} style={{
        display: "block", width: "100%", marginTop: 16,
        background: "linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%)",
        border: "1px solid #c8a84a", color: "#c8a84a",
        fontFamily: "'Cinzel', serif", fontSize: 11,
        letterSpacing: 3, padding: "12px 24px", cursor: "pointer",
        textTransform: "uppercase", transition: "all 0.2s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(180deg, #101e30 0%, #0c1624 100%)"; e.currentTarget.style.color = "#e8d090"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%)"; e.currentTarget.style.color = "#c8a84a"; }}
      >
        ⬡ Enter System
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SectorMapView({ state, dispatch, onNavigateHome }) {
  const { stars } = state.sector;

  // Generate sector on first load
  useEffect(() => {
    if (stars.length === 0) {
      const generated = generateSector(42);
      dispatch({ type: "SET_SECTOR", stars: generated });
    }
  }, []);

  const selectedStar = state.sector.currentStarId
    ? stars.find((s) => s.id === state.sector.currentStarId)
    : null;

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#06080f",
      display: "flex", flexDirection: "column",
      fontFamily: "'Cinzel', serif", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        @keyframes starPulse {
          0%,100% { transform: scale(1);   opacity: 0.4; }
          50%      { transform: scale(2.2); opacity: 0.05; }
        }
        .star-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: starPulse 3s ease-in-out infinite;
        }
        .sector-body  { display: flex; flex: 1; overflow: hidden; }
        .sector-map   { flex: 0 0 68%; position: relative; overflow: hidden; }
        .sector-panel { flex: 0 0 32%; border-left: 1px solid #1e3d5c; overflow-y: auto; padding: 20px 18px; }
        @media (max-width: 768px) {
          .sector-body  { flex-direction: column !important; }
          .sector-map   { flex: 0 0 55vh !important; }
          .sector-panel { flex: 1 1 auto !important; border-left: none !important; border-top: 1px solid #1e3d5c !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px", borderBottom: "1px solid #1e3d5c", flexShrink: 0,
      }}>
        <div>
          <span style={{ color: "#c8a84a", letterSpacing: 4, fontSize: 12 }}>SECTOR MAP</span>
          <span style={{ color: "#1e4a7a", letterSpacing: 3, fontSize: 10, marginLeft: 12 }}>
            — ASTROCARTOGRAPHIC SURVEY —
          </span>
        </div>
        <button onClick={onNavigateHome} style={{
          background: "transparent", border: "1px solid #1e3d5c",
          color: "#2e5a82", fontFamily: "'Cinzel', serif",
          fontSize: 9, letterSpacing: 3, padding: "6px 16px",
          cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a84a"; e.currentTarget.style.color = "#c8a84a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3d5c"; e.currentTarget.style.color = "#2e5a82"; }}
        >
          ← COMMAND
        </button>
      </div>

      {/* Body */}
      <div className="sector-body">
        {/* SVG map */}
        <div className="sector-map">
          <svg width="100%" height="100%" viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
            <defs>
              <radialGradient id="sectorGrad" cx="50%" cy="45%" r="75%">
                <stop offset="0%" stopColor="#080e18" />
                <stop offset="100%" stopColor="#030608" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#sectorGrad)" />
            <StarField />
            {stars.length > 0 && <TransitRoutes stars={stars} />}
            {stars.map((star) => (
              <StarNode key={star.id} star={star}
                isSelected={state.sector.currentStarId === star.id}
                onClick={() => dispatch({
                  type: state.sector.currentStarId === star.id ? "BACK_TO_SECTOR" : "SELECT_STAR",
                  starId: star.id,
                })}
              />
            ))}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="sector-panel">
          {!selectedStar && <NullPanel />}
          {selectedStar && (
            <StarPanel star={selectedStar}
              onEnterSystem={() => dispatch({ type: "SELECT_STAR", starId: selectedStar.id })} />
          )}
        </div>
      </div>
    </div>
  );
}
