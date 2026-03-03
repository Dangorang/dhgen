import { useState } from "react";
import CharacterCreator from "./CharacterCreator";
import CharacterRoster from "./CharacterRoster";

function HomeScreen({ onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0804", color: "#c8b89a", fontFamily: "'Cinzel', serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(139,90,43,0.03) 40px, rgba(139,90,43,0.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(139,90,43,0.03) 40px, rgba(139,90,43,0.03) 41px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(180,120,40,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English&display=swap');
        * { box-sizing: border-box; }
        .menu-btn { display: block; width: 100%; max-width: 340px; background: linear-gradient(180deg, #2a1808 0%, #1a1005 100%); color: #c8b89a; border: 1px solid #5a3e1b; padding: 18px 24px; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; text-align: left; margin-bottom: 12px; position: relative; }
        .menu-btn:hover { border-color: #c09040; color: #f0d890; background: linear-gradient(180deg, #3a2510 0%, #2a1808 100%); }
        .menu-btn::before { content: '✦'; color: #5a3e1b; margin-right: 14px; transition: color 0.2s; }
        .menu-btn:hover::before { color: #c09040; }
        .menu-btn-sub { display: block; font-family: 'IM Fell English', serif; font-size: 11px; color: #5a4020; letter-spacing: 1px; text-transform: none; margin-top: 4px; margin-left: 24px; }
        .menu-btn.disabled { opacity: 0.4; cursor: not-allowed; }
        .menu-btn.disabled:hover { border-color: #5a3e1b; color: #c8b89a; background: linear-gradient(180deg, #2a1808 0%, #1a1005 100%); }
        .menu-btn.disabled:hover::before { color: #5a3e1b; }
      `}</style>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 32, color: "#c09040", letterSpacing: 8, marginBottom: 8 }}>DARK HERESY</div>
          <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 15, color: "#6a5030", letterSpacing: 4, marginBottom: 4 }}>Acolyte Management System</div>
          <div style={{ fontSize: 10, color: "#2a1808", letterSpacing: 3, fontFamily: "Cinzel", marginTop: 12 }}>✦ — INQUISITION USE ONLY — ✦</div>
          <div style={{ margin: "24px auto", width: 200, height: 1, background: "linear-gradient(90deg, transparent, #5a3e1b, transparent)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button className="menu-btn" onClick={() => onNavigate("creator")}>
            Create Character
            <span className="menu-btn-sub">Generate a new Acolyte dossier</span>
          </button>
          <button className="menu-btn" onClick={() => onNavigate("roster")}>
            View Characters
            <span className="menu-btn-sub">Browse your saved Acolyte roster</span>
          </button>
          <button className="menu-btn disabled">
            Missions
            <span className="menu-btn-sub">Coming soon — deploy your Acolytes</span>
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 60, fontSize: 10, color: "#2a1808", letterSpacing: 3, fontFamily: "Cinzel" }}>
          ✦ IN THE GRIM DARKNESS OF THE FAR FUTURE, THERE IS ONLY WAR ✦
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  if (screen === "creator") return <CharacterCreator onNavigate={setScreen} />;
  if (screen === "roster") return <CharacterRoster onNavigate={setScreen} />;
  return <HomeScreen onNavigate={setScreen} />;
}