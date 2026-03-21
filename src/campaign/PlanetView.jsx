// PlanetView.jsx — Planet details + region selector + squad deployment
// Shows planet overview, stats, squad selection, and region list.
import { useState, useEffect } from "react";
import { generatePlanet, BIOME_TABLE } from "../generation/planetGenerator";

const BIOME_ICONS = {
  temperate: "🌿", arid: "🏜", frozen: "❄",
  volcanic: "🌋", ocean: "🌊", jungle: "🌴",
};

const ATMO_COLORS = {
  Breathable: "#5aba5a", Thin: "#c8a84a", Toxic: "#c05050", None: "#4a4a5a",
};

const DEV_COLORS = {
  Frontier: "#c8a84a", Established: "#5aba5a", Developed: "#80b0ff",
};

function formatPop(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
        letterSpacing: 3, color: "#c8a84a",
        borderBottom: "1px solid #1e3d5c", paddingBottom: 4,
        marginBottom: 10, textTransform: "uppercase",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
      <span style={{ color: "#2e5a82", letterSpacing: 1,
        fontFamily: "'Share Tech Mono', monospace" }}>{label}</span>
      <span style={{ color: color || "#8ab4d4", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function RegionCard({ region, index, onSelect }) {
  const biomeDef = BIOME_TABLE[region.biome];
  return (
    <div
      onClick={onSelect}
      style={{
        border: region.isCapital ? "1px solid #1e4a7a" : "1px solid #0e1e30",
        background: region.isCapital ? "rgba(30,74,122,0.12)" : "rgba(8,15,28,0.7)",
        padding: "12px 14px", marginBottom: 8, cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a84a"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = region.isCapital ? "#1e4a7a" : "#0e1e30"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "#c8a84a", fontFamily: "'Cinzel', serif" }}>
          {region.name}
        </div>
        {region.isCapital && (
          <span style={{ fontSize: 8, color: "#c8a84a", letterSpacing: 2,
            fontFamily: "'Share Tech Mono', monospace",
            border: "1px solid #1e4a7a", padding: "2px 6px" }}>
            CAPITAL
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#2e5a82", marginBottom: 6,
        fontFamily: "'Share Tech Mono', monospace" }}>
        {region.subBiome} — {region.installation}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
        <span style={{ color: "#4a8aaa" }}>Pop: {formatPop(region.population)}</span>
        <span style={{ color: "#4a8aaa" }}>POIs: {region.pois.length}</span>
      </div>
    </div>
  );
}

function SquadDeployment({ deployedSquad, onDeploy }) {
  const [roster, setRoster] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    const r = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    setRoster(r.filter(c => c && !c.kia));
    // Pre-select already deployed squad members
    if (deployedSquad?.length > 0) {
      setSelected(new Set(deployedSquad.map(c => c.id || c.name)));
    }
  }, []);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 8) next.add(id);
      return next;
    });
  };

  const confirm = () => {
    const squad = roster.filter(c => selected.has(c.id || c.name));
    onDeploy(squad);
  };

  const roleColors = {
    "Veteran Infantry": "#6ee7b7", "Sanctioned": "#b090e0", "Artificer": "#e0c060",
    "Corpsman": "#60b0e0", "Demotech": "#e08060", "Infiltrator": "#a0a0c0",
  };

  return (
    <div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#4a7a9a",
        marginBottom: 12, lineHeight: 1.5 }}>
        Select up to 8 operatives to deploy. The Prefect always deploys.
      </div>
      {roster.map((char, i) => {
        const id = char.id || char.name;
        const isSel = selected.has(id);
        const isPrefect = char.isPrefect || (char.class && char.class.includes("Prefect"));
        const role = char.role || char.class || "Operative";
        const roleBase = Object.keys(roleColors).find(r => role.includes(r)) || role;
        const color = roleColors[roleBase] || "#8ab4d4";

        // Auto-select prefect
        if (isPrefect && !selected.has(id) && selected.size < 8) {
          selected.add(id);
        }

        return (
          <div key={id + i} onClick={() => !isPrefect && toggle(id)} style={{
            border: `1px solid ${isSel ? "#2a8a5a" : "#0e1e30"}`,
            borderLeft: `3px solid ${isSel ? "#3aaa70" : color}`,
            background: isSel ? "rgba(8,20,14,0.6)" : "rgba(8,15,28,0.7)",
            padding: "8px 12px", marginBottom: 6, cursor: isPrefect ? "default" : "pointer",
            transition: "border-color 0.2s", display: "flex", justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 12, color: isSel ? "#6ee7b7" : "#8ab4d4",
                fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
                {char.name}
                {isPrefect && <span style={{ fontSize: 8, color: "#c8a84a", marginLeft: 8,
                  fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 }}>PREFECT</span>}
              </div>
              <div style={{ fontSize: 9, color: "#2e5a82", fontFamily: "'Share Tech Mono', monospace" }}>
                {char.origin ? `${char.origin} · ` : ""}{role}
                {char.personality ? ` · ${char.personality}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}>
              <span style={{ color: "#2e5a82" }}>W:<span style={{ color: "#c8a84a" }}>{char.wounds}</span></span>
              {isSel && <span style={{ color: "#3aaa70" }}>✓</span>}
            </div>
          </div>
        );
      })}
      <button onClick={confirm} disabled={selected.size === 0} style={{
        background: selected.size > 0 ? "linear-gradient(180deg,#0a1e14 0%,#060f0a 100%)" : "rgba(8,15,28,0.5)",
        color: selected.size > 0 ? "#6ee7b7" : "#2e5a82",
        border: `1px solid ${selected.size > 0 ? "#1e5a3a" : "#0e1e30"}`,
        borderLeft: `3px solid ${selected.size > 0 ? "#2a7a50" : "#0e1e30"}`,
        padding: "10px 20px", fontFamily: "'Cinzel', serif", fontSize: 11,
        letterSpacing: 2, cursor: selected.size > 0 ? "pointer" : "not-allowed",
        width: "100%", marginTop: 8, transition: "all 0.2s",
      }}>
        ⬡ DEPLOY SQUAD ({selected.size} operative{selected.size !== 1 ? "s" : ""})
      </button>
    </div>
  );
}

export default function PlanetView({ state, dispatch }) {
  const planetStub = state.planet;
  if (!planetStub) return null;

  // Generate planet data if not yet generated
  useEffect(() => {
    if (planetStub && !planetStub.generated) {
      const fullPlanet = generatePlanet(
        planetStub.starId,
        planetStub.bodySlot,
        planetStub.name,
        null // star type not needed for generation currently
      );
      dispatch({ type: "UPDATE_PLANET", planet: fullPlanet });
    }
  }, [planetStub?.generated]);

  // Show loading while generating
  if (!planetStub.generated) {
    return (
      <div style={{ minHeight: "100vh", background: "#06080f", color: "#2e5a82",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Share Tech Mono', monospace", fontSize: 12, letterSpacing: 4 }}>
        GENERATING PLANETARY SURVEY...
      </div>
    );
  }

  const planet = planetStub;

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#06080f",
      display: "flex", flexDirection: "column",
      fontFamily: "'Cinzel', serif", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        .planet-body { display: flex; flex: 1; overflow: hidden; }
        .planet-info { flex: 0 0 40%; overflow-y: auto; padding: 20px 18px; border-right: 1px solid #1e3d5c; }
        .planet-regions { flex: 1; overflow-y: auto; padding: 20px 18px; }
        @media (max-width: 768px) {
          .planet-body { flex-direction: column !important; }
          .planet-info { flex: 0 0 auto !important; border-right: none !important; border-bottom: 1px solid #1e3d5c !important; max-height: 40vh; }
          .planet-regions { flex: 1 !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px", borderBottom: "1px solid #1e3d5c", flexShrink: 0,
      }}>
        <div>
          <span style={{ color: "#c8a84a", letterSpacing: 4, fontSize: 12 }}>
            {planet.name.toUpperCase()}
          </span>
          <span style={{ color: "#1e4a7a", letterSpacing: 3, fontSize: 10, marginLeft: 12 }}>
            — PLANETARY SURVEY —
          </span>
        </div>
        <button onClick={() => dispatch({ type: "BACK_TO_SYSTEM" })} style={{
          background: "transparent", border: "1px solid #1e3d5c",
          color: "#2e5a82", fontFamily: "'Cinzel', serif",
          fontSize: 9, letterSpacing: 3, padding: "6px 16px",
          cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a84a"; e.currentTarget.style.color = "#c8a84a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3d5c"; e.currentTarget.style.color = "#2e5a82"; }}
        >
          ← SYSTEM VIEW
        </button>
      </div>

      <div className="planet-body">
        {/* Left panel — planet info */}
        <div className="planet-info">
          {/* Planet globe visual */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto 12px",
              background: `radial-gradient(circle at 35% 35%, ${BIOME_TABLE[planet.biome]?.tileColors.alt || "#4a5a6a"}88, ${BIOME_TABLE[planet.biome]?.tileColors.base || "#3a4a5a"} 60%, ${BIOME_TABLE[planet.biome]?.tileColors.accent || "#2a3a4a"})`,
              border: `2px solid ${BIOME_TABLE[planet.biome]?.tileColors.alt || "#4a5a6a"}60`,
              boxShadow: `0 0 30px ${BIOME_TABLE[planet.biome]?.tileColors.base || "#3a4a5a"}40, inset -20px -10px 40px rgba(0,0,0,0.5)`,
            }} />
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 20, color: "#c8a84a",
              letterSpacing: 3, marginBottom: 4 }}>
              {planet.name}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              color: "#2e5a82", letterSpacing: 2 }}>
              {planet.biome.toUpperCase()} WORLD — {planet.size.toUpperCase()}
            </div>
          </div>

          <Section title="Planetary Data">
            <StatRow label="SIZE CLASS" value={planet.size.charAt(0).toUpperCase() + planet.size.slice(1)} />
            <StatRow label="BIOME" value={`${BIOME_ICONS[planet.biome] || ""} ${planet.biome.charAt(0).toUpperCase() + planet.biome.slice(1)}`} />
            <StatRow label="ATMOSPHERE" value={planet.atmosphere} color={ATMO_COLORS[planet.atmosphere]} />
            <StatRow label="POPULATION" value={formatPop(planet.population)} />
            <StatRow label="DEVELOPMENT" value={planet.developmentLevel} color={DEV_COLORS[planet.developmentLevel]} />
            <StatRow label="REGIONS" value={planet.regions.length} />
          </Section>

          {/* Dispatch briefing */}
          <Section title="Sector Dispatch">
            <div style={{ border: "1px solid #1e3d5c", padding: "12px",
              background: "rgba(8,15,28,0.8)" }}>
              <div style={{ fontSize: 11, color: "#8ab4d4", lineHeight: 1.7, fontStyle: "italic" }}>
                "Intelligence reports indicate growing dissonance among the populace of {planet.name}.
                An Imperial Loyalist cell is suspected to be operating in the region.
                Investigate, identify leadership, and neutralize the threat."
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: "#2e5a82",
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
                — ENFORCEMENT DIRECTORATE COMMAND
              </div>
            </div>
          </Section>

          {/* Threat indicator */}
          <Section title="Threat Assessment">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                flex: 1, height: 6, background: "#0c1824", border: "1px solid #1e3d5c",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  width: `${state.threat.level}%`, height: "100%",
                  background: state.threat.level > 80 ? "#c05050"
                    : state.threat.level > 60 ? "#c08040"
                    : state.threat.level > 40 ? "#c0a040"
                    : state.threat.level > 20 ? "#80a050"
                    : "#408050",
                  transition: "width 0.3s",
                }} />
              </div>
              <span style={{ fontSize: 10, color: "#2e5a82", fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: 2, whiteSpace: "nowrap" }}>
                {state.threat.tier.toUpperCase()}
              </span>
            </div>
          </Section>
        </div>

        {/* Right panel — squad deployment + regions */}
        <div className="planet-regions">
          {/* Squad deployment — show if no squad deployed yet */}
          <Section title={state.deployedSquad?.length > 0 ? `Deployed Squad (${state.deployedSquad.length})` : "Squad Deployment"}>
            {state.deployedSquad?.length > 0 ? (
              <>
                <div style={{ marginBottom: 8 }}>
                  {state.deployedSquad.map((char, i) => {
                    const isPrefect = char.isPrefect || (char.class && char.class.includes("Prefect"));
                    return (
                      <div key={char.id || i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "4px 8px", marginBottom: 3,
                        background: "rgba(8,20,14,0.4)", borderLeft: "2px solid #2a7a50",
                        fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
                      }}>
                        <span style={{ color: "#6ee7b7" }}>
                          {char.name}
                          {isPrefect && <span style={{ color: "#c8a84a", marginLeft: 6, fontSize: 8 }}>PFT</span>}
                        </span>
                        <span style={{ color: "#2e5a82" }}>{char.role || char.class}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => dispatch({ type: "DEPLOY_SQUAD", squad: [] })} style={{
                  background: "transparent", border: "1px solid #1e3d5c", color: "#2e5a82",
                  padding: "4px 12px", fontSize: 9, fontFamily: "'Share Tech Mono', monospace",
                  cursor: "pointer", letterSpacing: 1, marginBottom: 8,
                }}>
                  ↺ REASSIGN SQUAD
                </button>
              </>
            ) : (
              <SquadDeployment
                deployedSquad={state.deployedSquad}
                onDeploy={(squad) => dispatch({ type: "DEPLOY_SQUAD", squad })}
              />
            )}
          </Section>

          {/* Regions — only selectable when squad is deployed */}
          <Section title="Regions — Select Deployment Zone">
            {state.deployedSquad?.length > 0 ? (
              planet.regions.map((region, i) => (
                <RegionCard key={region.id} region={region} index={i}
                  onSelect={() => dispatch({
                    type: "SELECT_REGION",
                    regionId: region.id,
                    startPosition: { x: 10, y: 18 },
                  })}
                />
              ))
            ) : (
              <div style={{ fontSize: 10, color: "#2e5a82", fontFamily: "'Share Tech Mono', monospace",
                fontStyle: "italic", padding: "8px 0" }}>
                Deploy your squad before selecting a region.
              </div>
            )}
          </Section>

          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 9,
            color: "#1e3d5c", letterSpacing: 3,
            fontFamily: "'Share Tech Mono', monospace" }}>
            ⬡ IN SERVICE TO THE COUNCIL ⬡
          </div>
        </div>
      </div>
    </div>
  );
}
