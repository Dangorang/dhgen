import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// CharacterCreator — Veteran Infantry & Adept generation
// ─────────────────────────────────────────────────────────────

// Dice helpers
function d5()  { return Math.ceil(Math.random() * 5); }
function d10() { return Math.ceil(Math.random() * 10); }
function nd10(n) { let t = 0; for (let i = 0; i < n; i++) t += d10(); return t; }

// ── Name Tables ──────────────────────────────────────────────
const FIRST_NAMES = [
  "Kael","Draven","Rook","Voss","Harlan","Cormac","Serus","Taryn","Drace",
  "Maren","Vael","Seraphine","Kira","Liora","Solen","Caen","Isel","Vexis",
  "Bryn","Aldric","Fenwick","Cassia","Oryn","Taemar","Sorel","Nira","Corvus",
  "Ellena","Zael","Hadris",
];
const SURNAMES = [
  "Vane","Dross","Harken","Null","Sever","Ironback","Coldthorn","Blackwell",
  "Asche","Mordren","Reeve","Thorn","Vael","Wren","Holt","Strix","Dusk",
  "Carr","Greyne","Fallow","Ossian","Lorne","Mirren","Daine","Ashford",
];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const genName = () => `${rand(FIRST_NAMES)} ${rand(SURNAMES)}`;

// ── Stat Generation ──────────────────────────────────────────
function generateVeteranStats() {
  return {
    meleeSkill:  25 + nd10(2),
    rangeSkill:  35 + nd10(2),
    strength:    25 + nd10(2),
    toughness:   25 + nd10(2),
    agility:     20 + nd10(2),
    perception:  25 + nd10(2),
    intelligence:20 + nd10(2),
    willpower:   25 + nd10(2),
    fellowship:  20 + nd10(2),
    psyRating:   0,
  };
}

function generateAdeptStats() {
  return {
    meleeSkill:  20 + nd10(2),
    rangeSkill:  20 + nd10(2),
    strength:    20 + nd10(2),
    toughness:   20 + nd10(2),
    agility:     20 + nd10(2),
    perception:  40 + nd10(2),
    intelligence:25 + nd10(2),
    willpower:   35 + nd10(2),
    fellowship:  20 + nd10(2),
    psyRating:   30 + nd10(2),
  };
}

function calcWounds(stats) {
  return d5() + Math.floor(stats.willpower / 10) + Math.floor(stats.toughness / 10) + 5;
}

// ── Equipment Tables ─────────────────────────────────────────
const VETERAN_RANGED = [
  { id: "assault_rifle", name: "Assault Rifle",  desc: "Standard-issue infantry rifle, semi/full auto." },
  { id: "lmg",           name: "Light Machinegun", desc: "Heavy suppression weapon, belt-fed." },
];
const VETERAN_MELEE = [
  { id: "phase_blade",  name: "Phase Blade",  desc: "Energy field disrupts armor on contact." },
  { id: "shield_arm",   name: "Shield Arm",   desc: "+10 to parry. Doubles as off-hand weapon." },
];
const VETERAN_ARMOR = [
  { id: "flak_vest",        name: "Flak Armor Vest",   desc: "Standard infantry protection." },
  { id: "tech_shield_vest", name: "Tech Shield Vest",   desc: "Integrated energy dispersal field." },
];
const ADEPT_KIT = [
  { id: "phase_blade",        name: "Phase Blade",          desc: "Energy field disrupts armor on contact." },
  { id: "aetheric_aperture",  name: "Aetheric Aperture",    desc: "Psychic sidearm. Damage scales with Psy Rating." },
  { id: "robes",              name: "Order Robes",          desc: "Light ceremonial armor. No encumbrance." },
];

function generateVeteranKit() {
  return [
    VETERAN_RANGED[Math.floor(Math.random() * VETERAN_RANGED.length)],
    VETERAN_MELEE[Math.floor(Math.random() * VETERAN_MELEE.length)],
    VETERAN_ARMOR[Math.floor(Math.random() * VETERAN_ARMOR.length)],
  ];
}

// ── Stat Labels ──────────────────────────────────────────────
const STAT_META = [
  { key: "meleeSkill",   label: "MELEE",   abbr: "MEL", desc: "Accuracy with melee weapons" },
  { key: "rangeSkill",   label: "RANGE",   abbr: "RNG", desc: "Accuracy with ranged weapons" },
  { key: "strength",     label: "STRENGTH",abbr: "STR", desc: "Melee damage & feats of strength" },
  { key: "toughness",    label: "TOUGH",   abbr: "TOU", desc: "Resist damage & critical injury" },
  { key: "agility",      label: "AGILITY", abbr: "AGI", desc: "Dodge, move range, initiative" },
  { key: "perception",   label: "PERCEPT", abbr: "PER", desc: "Passive checks, range bonus, initiative" },
  { key: "intelligence", label: "INTEL",   abbr: "INT", desc: "Reasoning, tech, skill slots" },
  { key: "willpower",    label: "WILLPWR", abbr: "WP",  desc: "Resist death, insanity, corruption" },
  { key: "fellowship",   label: "FELLOW",  abbr: "FEL", desc: "Leadership & social interaction" },
  { key: "psyRating",    label: "PSY",     abbr: "PSY", desc: "Psychic power & damage" },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function CharacterCreator({ onNavigate }) {
  const [step, setStep]           = useState("class");   // class | build | done
  const [charClass, setCharClass] = useState(null);
  const [name, setName]           = useState("");
  const [stats, setStats]         = useState(null);
  const [wounds, setWounds]       = useState(0);
  const [equipment, setEquipment] = useState([]);
  const [saved, setSaved]         = useState(false);

  // ── Handlers ────────────────────────────────────────────────
  const selectClass = useCallback((cls) => {
    const newStats = cls === "Veteran Infantry" ? generateVeteranStats() : generateAdeptStats();
    const newWounds = calcWounds(newStats);
    const newEquip  = cls === "Veteran Infantry" ? generateVeteranKit() : ADEPT_KIT;
    setCharClass(cls);
    setStats(newStats);
    setWounds(newWounds);
    setEquipment(newEquip);
    setName(genName());
    setStep("build");
    setSaved(false);
  }, []);

  const rerollStats = useCallback(() => {
    if (!charClass) return;
    const newStats  = charClass === "Veteran Infantry" ? generateVeteranStats() : generateAdeptStats();
    const newWounds = calcWounds(newStats);
    const newEquip  = charClass === "Veteran Infantry" ? generateVeteranKit() : ADEPT_KIT;
    setStats(newStats);
    setWounds(newWounds);
    setEquipment(newEquip);
    setSaved(false);
  }, [charClass]);

  const saveCharacter = useCallback(() => {
    if (!stats || !name.trim()) return;
    const roster = JSON.parse(localStorage.getItem("dhgen_roster") || "[]");
    if (roster.length >= 8) {
      alert("Roster full (8 operatives max). Remove one first.");
      return;
    }
    const char = {
      name:        name.trim(),
      class:       charClass,
      background:  charClass === "Veteran Infantry"
        ? "Years of service on the front lines of the Battalions."
        : "Graduate of the Academy, trained under the Order of Seers.",
      stats,
      wounds,
      fate:        charClass === "Adept" ? 3 : 2,
      xp:          0,
      kia:         false,
      insanity:    0,
      corruption:  0,
      equipment,
    };
    roster.push(char);
    localStorage.setItem("dhgen_roster", JSON.stringify(roster));
    setSaved(true);
    setStep("done");
  }, [stats, name, charClass, wounds, equipment]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#0a0804", color:"#c8b89a", fontFamily:"'Cinzel',serif", position:"relative", overflowX:"hidden" }}>
      {/* Decorative grid overlay */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(139,90,43,0.03) 40px,rgba(139,90,43,0.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(139,90,43,0.03) 40px,rgba(139,90,43,0.03) 41px)", pointerEvents:"none", zIndex:0 }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English&display=swap');
        *{box-sizing:border-box;}
        .cc-btn{background:linear-gradient(180deg,#3a2510 0%,#1e1208 100%);color:#c8b89a;border:1px solid #5a3e1b;padding:8px 18px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;border-radius:0;}
        .cc-btn:hover{border-color:#c09040;color:#f0d890;background:linear-gradient(180deg,#5a3510 0%,#2e1e08 100%);}
        .cc-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .cc-btn-green{border-color:#4a7a4a;color:#6ee7b7;}
        .cc-btn-green:hover{border-color:#6aaa6a;color:#90ffb0;background:linear-gradient(180deg,#1a3a1a 0%,#0e1e0e 100%);}
        .cc-card{border:1px solid #3a2510;background:rgba(15,10,4,0.9);position:relative;margin-bottom:16px;}
        .cc-card::before{content:'';position:absolute;inset:3px;border:1px solid rgba(90,62,27,0.2);pointer-events:none;}
        .stat-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #1a1005;}
        .stat-row:last-child{border-bottom:none;}
        .stat-label{font-size:9px;letter-spacing:2px;color:#6a5030;text-transform:uppercase;}
        .stat-val{font-size:16px;font-weight:600;font-family:'Cinzel',serif;}
        .equip-item{padding:8px 12px;border-left:2px solid #5a3e1b;margin-bottom:8px;background:rgba(40,25,10,0.3);}
        input[type=text]{background:#0f0a04;border:1px solid #3a2510;color:#c8b89a;padding:8px 12px;font-family:'Cinzel',serif;font-size:13px;width:100%;outline:none;letter-spacing:1px;}
        input[type=text]:focus{border-color:#c09040;}
        .class-card{border:1px solid #3a2510;background:rgba(15,10,4,0.85);padding:20px;cursor:pointer;transition:border-color 0.2s,background 0.2s;margin-bottom:16px;}
        .class-card:hover{border-color:#c09040;background:rgba(25,15,5,0.95);}
        .class-card.selected{border-color:#6ee7b7;background:rgba(10,25,15,0.8);}
      `}</style>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"24px 16px", position:"relative", zIndex:1 }}>

        {/* HEADER */}
        <div style={{ marginBottom:16 }}>
          <button className="cc-btn" onClick={() => onNavigate("home")}>← Main Menu</button>
        </div>
        <div style={{ textAlign:"center", marginBottom:28, borderBottom:"1px solid #3a2510", paddingBottom:16 }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:22, color:"#c09040", letterSpacing:5 }}>PERSONNEL DEPLOYMENT</div>
          <div style={{ fontFamily:"'IM Fell English',serif", fontSize:12, color:"#6a5030", letterSpacing:3, marginTop:4 }}>
            {step === "class" ? "Select Operative Class" : step === "build" ? `Reviewing — ${charClass}` : "Operative Registered"}
          </div>
        </div>

        {/* ── STEP 1: CLASS SELECTION ── */}
        {step === "class" && (
          <>
            <div style={{ fontFamily:"'IM Fell English',serif", fontSize:13, color:"#8a7050", marginBottom:20, lineHeight:1.6, fontStyle:"italic", textAlign:"center" }}>
              Choose the operative's combat designation. Stats are generated from class baselines plus random variance.
            </div>

            {/* Veteran Infantry */}
            <div className="class-card" onClick={() => selectClass("Veteran Infantry")}>
              <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:16, color:"#c09040", letterSpacing:2, marginBottom:6 }}>VETERAN INFANTRY</div>
              <div style={{ fontFamily:"'IM Fell English',serif", fontSize:12, color:"#9a8060", lineHeight:1.6, marginBottom:14 }}>
                Years of front-line service in the Battalions. Hardened combatants trained in assault and suppression tactics. High melee and ranged baseline with resilient constitution.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                {[["MELEE",  "25+2D10"],["RANGE",  "35+2D10"],["STR",   "25+2D10"],
                  ["TOUGH",  "25+2D10"],["PER",    "25+2D10"],["WILLPWR","25+2D10"]].map(([k,v]) => (
                  <div key={k} style={{ background:"rgba(40,25,10,0.4)", padding:"6px 10px", borderLeft:"2px solid #5a3e1b" }}>
                    <div style={{ fontSize:8, color:"#6a5030", letterSpacing:2 }}>{k}</div>
                    <div style={{ fontSize:12, color:"#c8b89a", fontFamily:"'Cinzel',serif" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:10, color:"#6a5030", letterSpacing:1 }}>
                Equipment: Assault Rifle or LMG · Phase Blade or Shield Arm · Flak Vest or Tech Shield Vest
              </div>
            </div>

            {/* Adept */}
            <div className="class-card" onClick={() => selectClass("Adept")}>
              <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:16, color:"#9080d0", letterSpacing:2, marginBottom:6 }}>ADEPT</div>
              <div style={{ fontFamily:"'IM Fell English',serif", fontSize:12, color:"#9a8060", lineHeight:1.6, marginBottom:14 }}>
                Graduates of the Order of Seers Academy. Rare psychic operatives with devastating mental powers. Fragile in conventional combat — lethal at range and support.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                {[["PERCEPT","40+2D10"],["WILLPWR","35+2D10"],["INTEL", "25+2D10"],
                  ["PSY",    "30+2D10"],["MELEE",  "20+2D10"],["TOUGH", "20+2D10"]].map(([k,v]) => (
                  <div key={k} style={{ background:"rgba(30,20,50,0.4)", padding:"6px 10px", borderLeft:"2px solid #6050a0" }}>
                    <div style={{ fontSize:8, color:"#6050a0", letterSpacing:2 }}>{k}</div>
                    <div style={{ fontSize:12, color:"#c8b89a", fontFamily:"'Cinzel',serif" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:10, color:"#6a5030", letterSpacing:1 }}>
                Equipment: Phase Blade · Aetheric Aperture · Order Robes
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: BUILD REVIEW ── */}
        {step === "build" && stats && (
          <>
            {/* Name */}
            <div className="cc-card" style={{ padding:"16px 20px", marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#6a5030", textTransform:"uppercase", marginBottom:8 }}>Operative Designation</div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter name..."
                  style={{ flex:1 }}
                />
                <button className="cc-btn" onClick={() => setName(genName())}>↺ Regenerate</button>
              </div>
            </div>

            {/* Stats */}
            <div className="cc-card" style={{ padding:"16px 20px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:9, letterSpacing:2, color:"#6a5030", textTransform:"uppercase" }}>Characteristics</div>
                <button className="cc-btn" onClick={rerollStats}>↺ Reroll All</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                {STAT_META.map(({ key, label, desc }) => {
                  if (key === "psyRating" && charClass !== "Adept") return null;
                  const val = stats[key];
                  const color = val >= 40 ? "#6ee7b7" : val >= 30 ? "#c8b89a" : val <= 22 ? "#f87171" : "#e2d5b0";
                  return (
                    <div key={key} className="stat-row">
                      <div>
                        <div className="stat-label">{label}</div>
                        <div style={{ fontSize:9, color:"#3a2a10", letterSpacing:1 }}>{desc}</div>
                      </div>
                      <div className="stat-val" style={{ color }}>{val}</div>
                    </div>
                  );
                })}
              </div>
              {/* Secondary stats */}
              <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid #2a1808" }}>
                <div style={{ fontSize:9, letterSpacing:2, color:"#6a5030", textTransform:"uppercase", marginBottom:6 }}>Derived</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {[["Wounds",     wounds],
                    ["Fate Pts",   charClass === "Adept" ? 3 : 2],
                    ["Insanity",   0],
                    ["Corruption", 0]].map(([k,v]) => (
                    <span key={k} style={{ border:"1px solid #4a3010", background:"rgba(90,62,27,0.2)", padding:"4px 10px", fontSize:10, color:"#9a7840" }}>
                      {k}: {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="cc-card" style={{ padding:"16px 20px", marginBottom:20 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#6a5030", textTransform:"uppercase", marginBottom:10 }}>Starting Equipment</div>
              {equipment.map((item) => (
                <div key={item.id} className="equip-item">
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#c8b89a", marginBottom:2 }}>{item.name}</div>
                  <div style={{ fontFamily:"'IM Fell English',serif", fontSize:11, color:"#8a7050", fontStyle:"italic" }}>{item.desc}</div>
                </div>
              ))}
              {charClass === "Veteran Infantry" && (
                <div style={{ fontSize:9, color:"#5a4020", marginTop:8, fontFamily:"'IM Fell English',serif", fontStyle:"italic" }}>
                  ↺ Rerolling stats re-randomises equipment loadout.
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <button className="cc-btn cc-btn-green" onClick={saveCharacter}>
                ✦ Register Operative
              </button>
              <button className="cc-btn" onClick={() => setStep("class")}>
                ← Change Class
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: DONE ── */}
        {step === "done" && (
          <div style={{ border:"1px solid #4a7a4a", background:"rgba(20,40,20,0.6)", padding:28, textAlign:"center" }}>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:20, color:"#6ee7b7", letterSpacing:4, marginBottom:10 }}>
              OPERATIVE REGISTERED
            </div>
            <div style={{ fontFamily:"'IM Fell English',serif", fontSize:14, color:"#80b080", marginBottom:8 }}>
              {name}
            </div>
            <div style={{ fontFamily:"'IM Fell English',serif", fontSize:12, color:"#6a8060", marginBottom:24, fontStyle:"italic" }}>
              {charClass} · {wounds} Wounds
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="cc-btn cc-btn-green" onClick={() => { setStep("class"); setCharClass(null); setStats(null); setSaved(false); }}>
                + Deploy Another
              </button>
              <button className="cc-btn" onClick={() => onNavigate("roster")}>
                View Roster
              </button>
              <button className="cc-btn" onClick={() => onNavigate("home")}>
                Main Menu
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", padding:"24px 0 8px", fontSize:9, color:"#2a1808", letterSpacing:3 }}>
          ✦ IN SERVICE TO THE ORDER ✦
        </div>
      </div>
    </div>
  );
}
