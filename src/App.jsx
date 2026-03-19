import { useState } from "react";
import CharacterCreator from "./CharacterCreator";
import CharacterRoster from "./CharacterRoster";
import MissionSystem from "./missionSystem";
import CampaignSystem from "./campaign/CampaignSystem";

function HomeScreen({ onNavigate }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#06080f",
      color: "#8ab4d4",
      fontFamily: "'Cinzel', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Tech grid overlay */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(30,80,140,0.06) 40px, rgba(30,80,140,0.06) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(30,80,140,0.06) 40px, rgba(30,80,140,0.06) 41px)",
        pointerEvents: "none", zIndex: 0,
      }} />
      {/* Blue radial glow — top */}
      <div style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 0%, rgba(20,80,180,0.12) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      {/* Gold radial glow — bottom */}
      <div style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 110%, rgba(180,140,30,0.07) 0%, transparent 60%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; }

        .menu-btn {
          display: block;
          width: 100%;
          max-width: 380px;
          background: linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%);
          color: #8ab4d4;
          border: 1px solid #1e3d5c;
          border-left: 3px solid #1e4a7a;
          padding: 18px 24px;
          font-family: 'Cinzel', serif;
          font-size: 12px;
          letter-spacing: 3px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          text-align: left;
          margin-bottom: 10px;
          position: relative;
        }
        .menu-btn::after {
          content: '';
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-right: 2px solid #1e4a7a;
          border-top: 2px solid #1e4a7a;
          transform: translateY(-50%) rotate(45deg);
          transition: border-color 0.2s;
        }
        .menu-btn:hover {
          border-color: #c8a84a;
          border-left-color: #c8a84a;
          color: #e8d090;
          background: linear-gradient(180deg, #101e30 0%, #0c1624 100%);
        }
        .menu-btn:hover::after { border-color: #c8a84a; }
        .menu-btn-sub {
          display: block;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #2e5a82;
          letter-spacing: 1px;
          text-transform: none;
          margin-top: 5px;
          transition: color 0.2s;
        }
        .menu-btn:hover .menu-btn-sub { color: #8a7040; }
        .menu-btn.disabled { opacity: 0.35; cursor: not-allowed; }
        .menu-btn.disabled:hover {
          border-color: #1e3d5c;
          border-left-color: #1e4a7a;
          color: #8ab4d4;
          background: linear-gradient(180deg, #0c1a2e 0%, #080f1c 100%);
        }
        .menu-btn.disabled:hover .menu-btn-sub { color: #2e5a82; }
        .menu-btn.disabled:hover::after { border-color: #1e4a7a; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          {/* Corner brackets */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, opacity: 0.35 }}>
            <div style={{ width: 24, height: 24, borderTop: "1px solid #c8a84a", borderLeft: "1px solid #c8a84a" }} />
            <div style={{ width: 24, height: 24, borderTop: "1px solid #c8a84a", borderRight: "1px solid #c8a84a" }} />
          </div>

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#1e4a7a", letterSpacing: 6, marginBottom: 14, textTransform: "uppercase" }}>
            Imperial Council — Enforcement Directorate
          </div>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 30, color: "#c8a84a", letterSpacing: 6, marginBottom: 6, textShadow: "0 0 40px rgba(200,168,74,0.25)" }}>
            THE TWELVE HOURS
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#2e5a82", letterSpacing: 4, marginBottom: 16 }}>
            Agent Directive System  //  v4.2.0
          </div>
          <div style={{ margin: "0 auto 16px", width: "100%", height: 1, background: "linear-gradient(90deg, transparent, #1e4a7a, #c8a84a44, #1e4a7a, transparent)" }} />
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#1a3a5a", letterSpacing: 3 }}>
            ⬡  IMPERIAL COUNCIL CLEARANCE REQUIRED  ⬡
          </div>
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button className="menu-btn" onClick={() => onNavigate("creator")}>
            Agent Dossier
            <span className="menu-btn-sub">Register a new field operative</span>
          </button>
          <button className="menu-btn" onClick={() => onNavigate("roster")}>
            Operative Roster
            <span className="menu-btn-sub">Review assigned personnel</span>
          </button>
          <button className="menu-btn" onClick={() => onNavigate("missions")}>
            Mission Deployment
            <span className="menu-btn-sub">Receive and execute Council directives</span>
          </button>
          <button className="menu-btn" onClick={() => onNavigate("campaign")}>
            Campaign
            <span className="menu-btn-sub">Planetary investigation and field operations</span>
          </button>
          <button className="menu-btn" onClick={() => {
            if (window.confirm("This will erase all saved campaign data and your operative roster. Are you sure?")) {
              localStorage.removeItem("dhgen_campaign");
              localStorage.removeItem("dhgen_roster");
              window.location.reload();
            }
          }} style={{ marginTop: 20 }}>
            Purge Records
            <span className="menu-btn-sub">Clear all campaign data and operative roster</span>
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, display: "flex", justifyContent: "space-between", opacity: 0.25 }}>
          <div style={{ width: 24, height: 24, borderBottom: "1px solid #c8a84a", borderLeft: "1px solid #c8a84a" }} />
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#8ab4d4", letterSpacing: 4, alignSelf: "flex-end", paddingBottom: 4 }}>
            COUNCIL ERA  //  YEAR 4,987
          </div>
          <div style={{ width: 24, height: 24, borderBottom: "1px solid #c8a84a", borderRight: "1px solid #c8a84a" }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  if (screen === "creator")  return <CharacterCreator onNavigate={setScreen} />;
  if (screen === "roster")   return <CharacterRoster onNavigate={setScreen} />;
  if (screen === "missions") return <MissionSystem onNavigate={setScreen} />;
  if (screen === "campaign") return <CampaignSystem onNavigate={setScreen} />;
  return <HomeScreen onNavigate={setScreen} />;
}
