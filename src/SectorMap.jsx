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
          fill="#c8b89a"
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
          stroke="#5a3e1b"
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
  const nodeColor   = accessible ? "#c09040" : "#2a1e0e";
  const strokeColor = accessible ? "#c09040" : "#3a2e1e";
  const textColor   = accessible ? "#c8b89a" : "#4a3a20";
  const glyphColor  = accessible ? "#0a0804" : "#2a1e0e";

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Pulse ring — accessible worlds only */}
      {accessible && (
        <circle
          cx={`${pos.x}%`}
          cy={`${pos.y}%`}
          r="15"
          fill="none"
          stroke="#c09040"
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
          stroke="#f0d890"
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
        fontFamily: "'Cinzel', serif",
        fontSize: 9,
        letterSpacing: 3,
        color: "#c09040",
        borderBottom: "1px solid #3a2810",
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
    1: { bg: "#0e1e0e", border: "#2a5a2a", text: "#5aba5a" },
    2: { bg: "#1e130a", border: "#7a4a10", text: "#c09040" },
    3: { bg: "#1e0a0a", border: "#7a1a1a", text: "#c85050" },
  };
  const c = colors[phase.id] ?? colors[1];
  return (
    <span style={{
      display: "inline-block",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontFamily: "'Cinzel', serif",
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
    <div style={{ borderLeft: "2px solid #3a2810", paddingLeft: 12 }}>
      <div style={{ fontFamily: "'Cinzel', serif", color: "#c09040", fontSize: 12, marginBottom: 2 }}>
        {villain.name}
      </div>
      <div style={{ color: "#c8b89a", fontSize: 10, marginBottom: 6, fontStyle: "italic" }}>
        {villain.title}
      </div>
      <div style={{ color: "#6a5030", fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>
        AFFILIATION: {villain.affiliation}
      </div>
      <div style={{ color: "#6a5030", fontSize: 9, letterSpacing: 1, marginBottom: 10 }}>
        THREAT CLASS: {villain.threat}
      </div>
      <div style={{ color: "#c8b89a", fontSize: 11, lineHeight: 1.6 }}>
        {redacted
          ? <>
              <span style={{ color: "#3a2810", background: "#3a2810", userSelect: "none" }}>████████████████</span>
              {" "}Voss preaches a doctrine of inevitable change{" "}
              <span style={{ color: "#3a2810", background: "#3a2810", userSelect: "none" }}>████████████████████</span>
              {" "}drawing the desperate into forbidden rituals.{" "}
              <span style={{ color: "#3a2810", background: "#3a2810", userSelect: "none" }}>████████████████</span>
            </>
          : villain.description
        }
      </div>
      {redacted && (
        <div style={{ marginTop: 8, fontSize: 9, color: "#4a3020", letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>
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
        color: "#3a2810",
        fontFamily: "'Cinzel', serif",
        fontSize: 10,
        letterSpacing: 4,
        marginBottom: 16,
      }}>
        ✦ SELECT A WORLD ✦
      </div>
      <div style={{ color: "#2a1808", fontSize: 10, letterSpacing: 2, fontFamily: "'IM Fell English', serif" }}>
        — Inquisition cartographic survey —
      </div>
      <div style={{
        margin: "32px auto 0",
        width: 80,
        height: 1,
        background: "linear-gradient(90deg, transparent, #3a2810, transparent)",
      }} />
    </div>
  );
}

function LockedWorldPanel({ world }) {
  return (
    <div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#3a2810", marginBottom: 4, letterSpacing: 2 }}>
        {world.name}
      </div>
      <div style={{ fontSize: 10, color: "#3a2810", letterSpacing: 3, marginBottom: 24 }}>
        {world.type.toUpperCase()}
      </div>
      <div style={{
        border: "1px solid #3a2810",
        padding: "24px 16px",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          color: "#c09040",
          fontSize: 11,
          letterSpacing: 4,
          marginBottom: 12,
          opacity: 0.6,
        }}>
          ████ CLASSIFIED ████
        </div>
        <div style={{ color: "#3a2810", fontSize: 9, letterSpacing: 3, fontFamily: "'Cinzel', serif" }}>
          INQUISITION CLEARANCE REQUIRED
        </div>
        <div style={{
          marginTop: 20,
          fontSize: 9,
          color: "#2a1808",
          fontFamily: "'IM Fell English', serif",
          lineHeight: 1.6,
        }}>
          Further intelligence on this world has not been sanctioned for Acolyte access.
          Consult your Inquisitor for deployment authorisation.
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
      <span style={{ color: "#6a5030", letterSpacing: 1 }}>{label}</span>
      <span style={{ color: "#c8b89a", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );

  return (
    <div>
      {/* World header */}
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#c09040", marginBottom: 2, letterSpacing: 2 }}>
        {world.name}
      </div>
      <div style={{ fontSize: 10, color: "#6a5030", letterSpacing: 3, marginBottom: 16 }}>
        {world.type.toUpperCase()}
      </div>
      {row("CLIMATE", world.climate)}

      <div style={{ margin: "16px 0", height: 1, background: "linear-gradient(90deg, #3a2810, transparent)" }} />

      {/* Biomes */}
      <Section title="Biomes">
        {world.biomes.map((b) => (
          <div key={b} style={{ color: "#c8b89a", fontSize: 11, marginBottom: 3 }}>
            <span style={{ color: "#5a3e1b", marginRight: 6 }}>—</span>{b}
          </div>
        ))}
      </Section>

      {/* Story arc */}
      <Section title="Arc Status">
        <div style={{ marginBottom: 6, fontFamily: "'Cinzel', serif", fontSize: 10, color: "#6a5030" }}>
          {world.storyArc.name}
        </div>
        <PhaseBadge phase={phase} />
        <div style={{ color: "#c8b89a", fontSize: 11, lineHeight: 1.6, marginTop: 6 }}>
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
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#c09040", marginBottom: 3 }}>
                {loc.name}
              </div>
              <div style={{ fontSize: 10, color: "#a09070", lineHeight: 1.6 }}>
                {loc.description}
              </div>
            </div>
          ) : (
            <div key={loc.id} style={{ marginBottom: 8, color: "#3a2810", fontSize: 10, letterSpacing: 1 }}>
              <span style={{ marginRight: 6 }}>▪</span>[UNKNOWN LOCATION]
            </div>
          );
        })}
      </Section>

      {/* Missions */}
      <Section title="Available Missions">
        {world.missions.filter((m) => m.unlockPhase <= currentPhase).length === 0 ? (
          <div style={{ color: "#3a2810", fontSize: 10 }}>No missions available at current clearance level.</div>
        ) : (
          world.missions
            .filter((m) => m.unlockPhase <= currentPhase)
            .map((m) => {
              const mState = wState.missions[m.id];
              return mState?.discovered ? (
                <div key={m.id} style={{
                  border: "1px solid #3a2810",
                  padding: "10px 12px",
                  marginBottom: 8,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#c8b89a" }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: "#5a3e1b", letterSpacing: 1, whiteSpace: "nowrap", marginLeft: 8 }}>{m.type.toUpperCase()}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#a09070", lineHeight: 1.6 }}>{m.description}</div>
                </div>
              ) : (
                <div key={m.id} style={{
                  border: "1px solid #2a1808",
                  padding: "10px 12px",
                  marginBottom: 8,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#3a2810", marginBottom: 4 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 9, color: "#2a1808", letterSpacing: 2 }}>[CLASSIFIED — FURTHER INVESTIGATION REQUIRED]</div>
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
          background: "linear-gradient(180deg, #3a2206 0%, #2a1804 100%)",
          border: "1px solid #c09040",
          color: "#c09040",
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          letterSpacing: 3,
          padding: "12px 24px",
          cursor: "pointer",
          textTransform: "uppercase",
          marginTop: 8,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(180deg, #4a2e0a 0%, #3a2206 100%)"; e.currentTarget.style.color = "#f0d890"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(180deg, #3a2206 0%, #2a1804 100%)"; e.currentTarget.style.color = "#c09040"; }}
      >
        ✦ Deploy Acolytes
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
      background: "#0a0804",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Cinzel', serif",
      overflow: "hidden",
    }}>
      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English&display=swap');
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
        .sector-panel { flex: 0 0 32%; border-left: 1px solid #3a2810; overflow-y: auto; padding: 20px 18px; }
        @media (max-width: 768px) {
          .sector-body  { flex-direction: column !important; }
          .sector-map   { flex: 0 0 55vh !important; }
          .sector-panel { flex: 1 1 auto !important; border-left: none !important; border-top: 1px solid #3a2810 !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        borderBottom: "1px solid #3a2810",
        flexShrink: 0,
      }}>
        <div>
          <span style={{ color: "#c09040", letterSpacing: 4, fontSize: 12 }}>
            SECTOR MAP
          </span>
          <span style={{ color: "#3a2810", letterSpacing: 3, fontSize: 10, marginLeft: 12 }}>
            — {SECTOR.name.toUpperCase()} —
          </span>
        </div>
        <button
          onClick={() => onNavigate("home")}
          style={{
            background: "transparent",
            border: "1px solid #3a2810",
            color: "#6a5030",
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: 3,
            padding: "6px 16px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c09040"; e.currentTarget.style.color = "#c09040"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a2810"; e.currentTarget.style.color = "#6a5030"; }}
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
                <stop offset="0%"   stopColor="#120a06" />
                <stop offset="100%" stopColor="#060402" />
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
