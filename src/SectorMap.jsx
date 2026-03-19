import { useState, useEffect } from "react";
import { SECTOR } from "./worldData";

// ── Seeded PRNG (mulberry32) — deterministic star field ─────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "dhgen_worlds";

function loadWorldState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function buildDefaultState() {
  const state = {};
  for (const world of SECTOR.worlds) {
    if (!world.accessible) continue;
    state[world.id] = {
      currentPhase: world.storyArc.currentPhase,
      locations: Object.fromEntries(
        world.locationsOfInterest.map((l) => [l.id, { discovered: l.discovered }])
      ),
      missions: Object.fromEntries(
        world.missions.map((m) => [m.id, { discovered: m.discovered }])
      ),
    };
  }
  return state;
}

function saveWorldState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

// ── Type glyph ───────────────────────────────────────────────────────────────
function typeGlyph(type) {
  const map = {
    "hive world":     "H",
    "forge world":    "F",
    "cemetery world": "C",
    "feral world":    "W",
    "shrine world":   "S",
  };
  return map[type] ?? "?";
}

// ── SVG sub-components ───────────────────────────────────────────────────────
function StarField() {
  const rand = mulberry32(0xDEADBEEF);
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      cx:      rand() * 100,
      cy:      rand() * 100,
      r:       rand() * 1.1 + 0.3,
      opacity: rand() * 0.55 + 0.15,
    });
  }
  return (
    <>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.cx}%`}
          cy={`${s.cy}%`}
          r={s.r}
          fill="#4a6a9a"
          opacity={s.opacity}
        />
      ))}
    </>
  );
}

function WarpRoutes() {
  const active = SECTOR.worlds.find((w) => w.accessible);
  if (!active) return null;
  return (
    <>
      {SECTOR.worlds.filter((w) => !w.accessible).map((w) => (
        <line
          key={w.id}
          x1={`${active.sectorPosition.x}%`}
          y1={`${active.sectorPosition.y}%`}
          x2={`${w.sectorPosition.x}%`}
          y2={`${w.sectorPosition.y}%`}
          stroke="#1e4a7a"
          strokeWidth="0.5"
          strokeDasharray="2.5 2"
          opacity="0.4"
        />
      ))}
    </>
  );
}

function WorldNode({ world, isSelected, onClick }) {
  const { sectorPosition: pos, accessible, name, type } = world;
  const nodeColor   = accessible ? "#c8a84a" : "#0c1824";
  const strokeColor = accessible ? "#c8a84a" : "#1e3d5c";
  const textColor   = accessible ? "#8ab4d4" : "#1e3d5c";
  const glyphColor  = accessible ? "#06080f" : "#0c1824";

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Pulse ring — accessible worlds only */}
      {accessible && (
        <circle
          cx={`${pos.x}%`}
          cy={`${pos.y}%`}
          r="15"
          fill="none"
          stroke="#c8a84a"
          strokeWidth="1"
          opacity="0.5"
          className="world-pulse"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      )}
      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={`${pos.x}%`}
          cy={`${pos.y}%`}
          r="14"
          fill="none"
          stroke="#e8d090"
          strokeWidth="1.5"
          opacity="0.9"
        />
      )}
      {/* Main node */}
      <circle
        cx={`${pos.x}%`}
        cy={`${pos.y}%`}
        r="9"
        fill={nodeColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      {/* Type glyph */}
      <text
        x={`${pos.x}%`}
        y={`${pos.y}%`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="6"
        fill={glyphColor}
        fontFamily="'Cinzel', serif"
        fontWeight="700"
        pointerEvents="none"
      >
        {typeGlyph(type)}
      </text>
      {/* World name label */}
      <text
        x={`${pos.x}%`}
        y={`${pos.y + 5.5}%`}
        textAnchor="middle"
        fontSize="4.5"
        fill={textColor}
        fontFamily="'Cinzel', serif"
        letterSpacing="0.8"
        pointerEvents="none"
      >
        {name.toUpperCase()}
      </text>
    </g>
  );
}

// ── Detail panel helpers ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9,
        letterSpacing: 3,
        color: "#c8a84a",
        borderBottom: "1px solid #1e3d5c",
        paddingBottom: 4,
        marginBottom: 10,
        textTransform: "uppercase",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PhaseBadge({ phase }) {
  const colors = {
    1: { bg: "#0a1a0a", border: "#1e5a1e", text: "#5aba5a" },
    2: { bg: "#0e1520", border: "#1e4a7a", text: "#c8a84a" },
    3: { bg: "#1a0a0a", border: "#7a1a1a", text: "#c85050" },
  };
  const c = colors[phase.id] ?? colors[1];
  return (
    <span style={{
      display: "inline-block",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 9,
      letterSpacing: 2,
      padding: "3px 10px",
      marginBottom: 8,
    }}>
      PHASE {phase.id} — {phase.label.toUpperCase()}
    </span>
  );
}

function VillainDossier({ villain, currentPhase }) {
  const redacted = currentPhase <= 1;
  return (
    <div style={{ borderLeft: "2px solid #1e3d5c", paddingLeft: 12 }}>
      <div style={{ fontFamily: "'Cinzel', serif", color: "#c8a84a", fontSize: 12, marginBottom: 2 }}>
        {villain.name}
      </div>
      <div style={{ color: "#8ab4d4", fontSize: 10, marginBottom: 6, fontStyle: "italic" }}>
        {villain.title}
      </div>
      <div style={{ color: "#2e5a82", fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>
        AFFILIATION: {villain.affiliation}
      </div>
      <div style={{ color: "#2e5a82", fontSize: 9, letterSpacing: 1, marginBottom: 10 }}>
        THREAT CLASS: {villain.threat}
      </div>
      <div style={{ color: "#8ab4d4", fontSize: 11, lineHeight: 1.6 }}>
        {redacted
          ? <>
              <span style={{ color: "#1e3d5c", background: "#1e3d5c", userSelect: "none" }}>████████████████</span>
              {" "}Voss preaches a doctrine of inevitable change{" "}
              <span style={{ color: "#1e3d5c", background: "#1e3d5c", userSelect: "none" }}>████████████████████</span>
              {" "}drawing the desperate into forbidden rituals.{" "}
              <span style={{ color: "#1e3d5c", background: "#1e3d5c", userSelect: "none" }}>████████████████</span>
            </>
          : villain.description
        }
      </div>
      {redacted && (
        <div style={{ marginTop: 8, fontSize: 9, color: "#1e3d5c", letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>
          [FURTHER DETAILS REQUIRE PHASE 2 CLEARANCE]
        </div>
      )}
    </div>
  );
}

function NullPanel() {
  return (
    <div style={{ textAlign: "center", paddingTop: 60 }}>
      <div style={{
        color: "#1e4a7a",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10,
        letterSpacing: 4,
        marginBottom: 16,
      }}>
        ⬡ SELECT A NODE ⬡
      </div>
      <div style={{ color: "#1e3d5c", fontSize: 10, letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>
        — Council cartographic survey —
      </div>
      <div style={{
        margin: "32px auto 0",
        width: 80,
        height: 1,
        background: "linear-gradient(90deg, transparent, #1e4a7a, transparent)",
      }} />
    </div>
  );
}

function LockedWorldPanel({ world }) {
  return (
    <div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#1e3d5c", marginBottom: 4, letterSpacing: 2 }}>
        {world.name}
      </div>
      <div style={{ fontSize: 10, color: "#1e3d5c", letterSpacing: 3, marginBottom: 24 }}>
        {world.type.toUpperCase()}
      </div>
      <div style={{
        border: "1px solid #1e3d5c",
        padding: "24px 16px",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          color: "#c8a84a",
          fontSize: 11,
          letterSpacing: 4,
          marginBottom: 12,
          opacity: 0.6,
        }}>
          ████ CLASSIFIED ████
        </div>
        <div style={{ color: "#1e4a7a", fontSize: 9, letterSpacing: 3, fontFamily: "'Share Tech Mono', monospace" }}>
          COUNCIL CLEARANCE REQUIRED
        </div>
        <div style={{
          marginTop: 20,
          fontSize: 9,
          color: "#1e3d5c",
          fontFamily: "'Share Tech Mono', monospace",
          lineHeight: 1.6,
        }}>
          Further intelligence on this world has not been sanctioned for Operative access.
          Consult your Senior Overseer for deployment authorisation.
        </div>
      </div>
    </div>
  );
}

function ActiveWorldPanel({ world, wState, onNavigate }) {
  const currentPhase = wState.currentPhase;
  const phase = world.storyArc.phases.find((p) => p.id === currentPhase);

  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
      <span style={{ color: "#2e5a82", letterSpacing: 1 }}>{label}</span>
      <span style={{ color: "#8ab4d4", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );

  return (
    <div>
      {/* World header */}
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#c8a84a", marginBottom: 2, letterSpacing: 2 }}>
        {world.name}
      </div>
      <div style={{ fontSize: 10, color: "#2e5a82", letterSpacing: 3, marginBottom: 16 }}>
        {world.type.toUpperCase()}
      </div>
      {row("CLIMATE", world.climate)}

      <div style={{ margin: "16px 0", height: 1, background: "linear-gradient(90deg, #1e3d5c, transparent)" }} />

      {/* Biomes */}
      <Section title="Biomes">
        {world.biomes.map((b) => (
          <div key={b} style={{ color: "#8ab4d4", fontSize: 11, marginBottom: 3 }}>
            <span style={{ color: "#1e4a7a", marginRight: 6 }}>—</span>{b}
          </div>
        ))}
      </Section>

      {/* Story arc */}
      <Section title="Arc Status">
        <div style={{ marginBottom: 6, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#2e5a82" }}>
          {world.storyArc.name}
        </div>
        <PhaseBadge phase={phase} />
        <div style={{ color: "#8ab4d4", fontSize: 11, lineHeight: 1.6, marginTop: 6 }}>
          {phase.description}
        </div>
      </Section>

      {/* Villain dossier */}
      <Section title="Threat Dossier">
        <VillainDossier villain={world.villain} currentPhase={currentPhase} />
      </Section>

      {/* Locations */}
      <Section title="Locations of Interest">
        {world.locationsOfInterest.map((loc) => {
          const lState = wState.locations[loc.id];
          return lState?.discovered ? (
            <div key={loc.id} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#c8a84a", marginBottom: 3 }}>
                {loc.name}
              </div>
              <div style={{ fontSize: 10, color: "#6a90b0", lineHeight: 1.6 }}>
                {loc.description}
              </div>
            </div>
          ) : (
            <div key={loc.id} style={{ marginBottom: 8, color: "#1e3d5c", fontSize: 10, letterSpacing: 1 }}>
              <span style={{ marginRight: 6 }}>▪</span>[UNKNOWN LOCATION]
            </div>
          );
        })}
      </Section>

      {/* Missions */}
      <Section title="Available Missions">
        {world.missions.filter((m) => m.unlockPhase <= currentPhase).length === 0 ? (
          <div style={{ color: "#1e3d5c", fontSize: 10 }}>No missions available at current clearance level.</div>
        ) : (
          world.missions
            .filter((m) => m.unlockPhase <= currentPhase)
            .map((m) => {
              const mState = wState.missions[m.id];
              return mState?.discovered ? (
                <div key={m.id} style={{
                  border: "1px solid #1e3d5c",
                  padding: "10px 12px",
                  marginBottom: 8,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#8ab4d4" }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: "#1e4a7a", letterSpacing: 1, whiteSpace: "nowrap", marginLeft: 8 }}>{m.type.toUpperCase()}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#6a90b0", lineHeight: 1.6 }}>{m.description}</div>
                </div>
              ) : (
                <div key={m.id} style={{
                  border: "1px solid #0e1e30",
                  padding: "10px 12px",
                  marginBottom: 8,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#1e3d5c", marginBottom: 4 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 9, color: "#0e1e30", letterSpacing: 2 }}>[CLASSIFIED — FURTHER INVESTIGATION REQUIRED]</div>
                </div>
              );
            })
        )}
      </Section>

      {/* Deploy button */}
      <button
        onClick={() => onNavigate("missions")}
        style={{
          display: "block",
          width: "100%",
          background: "linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%)",
          border: "1px solid #c8a84a",
          color: "#c8a84a",
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          letterSpacing: 3,
          padding: "12px 24px",
          cursor: "pointer",
          textTransform: "uppercase",
          marginTop: 8,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(180deg, #101e30 0%, #0c1624 100%)"; e.currentTarget.style.color = "#e8d090"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%)"; e.currentTarget.style.color = "#c8a84a"; }}
      >
        ⬡ Deploy Operatives
      </button>
    </div>
  );
}

// ── Main SectorMap component ─────────────────────────────────────────────────
export default function SectorMap({ onNavigate }) {
  const [worldState, setWorldState] = useState(() => loadWorldState() ?? buildDefaultState());
  const [selectedWorldId, setSelectedWorldId] = useState(null);

  useEffect(() => {
    saveWorldState(worldState);
  }, [worldState]);

  const selectedWorld = selectedWorldId
    ? SECTOR.worlds.find((w) => w.id === selectedWorldId)
    : null;

  const handleNodeClick = (worldId) => {
    setSelectedWorldId((prev) => (prev === worldId ? null : worldId));
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#06080f",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Cinzel', serif",
      overflow: "hidden",
    }}>
      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        @keyframes sectorPulse {
          0%,100% { transform: scale(1);   opacity: 0.55; }
          50%      { transform: scale(1.9); opacity: 0.08; }
        }
        .world-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: sectorPulse 2.6s ease-in-out infinite;
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        borderBottom: "1px solid #1e3d5c",
        flexShrink: 0,
      }}>
        <div>
          <span style={{ color: "#c8a84a", letterSpacing: 4, fontSize: 12 }}>
            SECTOR MAP
          </span>
          <span style={{ color: "#1e4a7a", letterSpacing: 3, fontSize: 10, marginLeft: 12 }}>
            — {SECTOR.name.toUpperCase()} —
          </span>
        </div>
        <button
          onClick={() => onNavigate("home")}
          style={{
            background: "transparent",
            border: "1px solid #1e3d5c",
            color: "#2e5a82",
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: 3,
            padding: "6px 16px",
            cursor: "pointer",
            transition: "all 0.2s",
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
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
          >
            <defs>
              <radialGradient id="spaceGrad" cx="50%" cy="45%" r="75%">
                <stop offset="0%"   stopColor="#080e18" />
                <stop offset="100%" stopColor="#030608" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#spaceGrad)" />
            <StarField />
            <WarpRoutes />
            {SECTOR.worlds.map((world) => (
              <WorldNode
                key={world.id}
                world={world}
                isSelected={selectedWorldId === world.id}
                onClick={() => handleNodeClick(world.id)}
              />
            ))}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="sector-panel">
          {!selectedWorld && <NullPanel />}
          {selectedWorld && selectedWorld.accessible && (
            <ActiveWorldPanel
              world={selectedWorld}
              wState={worldState[selectedWorld.id]}
              onNavigate={onNavigate}
            />
          )}
          {selectedWorld && !selectedWorld.accessible && (
            <LockedWorldPanel world={selectedWorld} />
          )}
        </div>
      </div>
    </div>
  );
}
