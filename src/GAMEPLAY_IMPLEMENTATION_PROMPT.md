# Gameplay Implementation Prompt — Sector Map & Planetary Investigation Flow

> **Context for Claude Code:** This prompt defines the main gameplay loop for our sci-fi strategy/RPG. We already have a battle map system and character roster in place. This implementation adds the overworld layer: sector maps, star system generation, planetary exploration on a grid, procedural storytelling with hidden NPC actions, investigation mechanics, threat escalation, and seamless transitions into the existing battle system. Character wounds from battles must persist on the roster.

---

## 1. Sector Map — Procedural Star System Generation

### 1.1 Star Generation

Generate a star system when the player enters a new sector. The star is the anchor of the system.

**Star types (weighted selection):**

| Type | Color | Habitability | Weight |
|---|---|---|---|
| Red Dwarf (M-class) | Deep red/orange | High — most common for colonization | 45% |
| Yellow Dwarf (G-class) | Yellow | High — Sol-like, ideal | 30% |
| Orange Dwarf (K-class) | Orange | Moderate-High | 15% |
| Blue Giant (B/O-class) | Blue-white | Low — habitable only at extreme orbital distance | 7% |
| Red Giant (evolved) | Deep red | Very Low — unstable, dying star | 3% |

Store the star's type, luminosity class, and color. These drive the habitable zone distance and planet biome tendencies.

### 1.2 System Body Generation

Generate **4–8 orbital bodies** for the system. Only **one** is the planet of interest (the mission target). The rest are atmospheric filler — gas giants, barren rocky worlds, asteroid belts, ice dwarfs — to make the system feel real but they are non-interactive for now.

**Orbital body types:**

- **Rocky world (barren)** — No atmosphere or thin toxic atmosphere. Craters. No population.
- **Gas giant** — Massive, banded atmosphere. May have moons listed as flavor text.
- **Ice dwarf** — Small, distant, frozen. Kuiper-belt-style.
- **Asteroid belt** — Ring of debris between orbital slots.
- **Planet of Interest** — The mission target. Fully generated per Section 2.

**Rules:**
- Bodies closer to the star trend hotter/rockier. Bodies farther trend colder/gassier.
- Gas giants should appear in mid-to-outer orbits.
- Asteroid belts appear between rocky inner planets and gas giants, or in outer system.
- The planet of interest sits within or near the habitable zone (adjusted for star type — blue giants have distant habitable zones, red dwarfs have close ones).

### 1.3 Sector Map UI

Display the star system as a **top-down orbital map** or a **side-view schematic**. Show:
- The star at center with its color/type label.
- Orbital rings or lanes for each body.
- Icons for each body type (rocky, gas giant, asteroid belt, planet of interest).
- The planet of interest should be **highlighted/pulsing** to indicate it is the mission target.
- Clicking the planet of interest zooms into the **Planetary View** (Section 2).
- Non-interactive bodies show a tooltip on hover with name and brief description (e.g., *"Korrath-IV — Gas giant. Hydrogen-helium atmosphere. 12 known moons."*).

### 1.4 Mission Briefing Overlay

When entering a new sector, display a briefing:

> **SECTOR DISPATCH — [System Name]**
> *"Growing dissonance among the populace of [Planet Name]. Civil unrest reports increasing. Investigate the root cause and restore order."*

This is the procedural story hook. The specifics (who, what, where) are fleshed out once the player lands on the planet.

---

## 2. Planet of Interest — Procedural Generation

### 2.1 Planet Parameters

Generate the following for the planet of interest:

| Parameter | Range | Driven By |
|---|---|---|
| **Size class** | Small / Medium / Large | Random weighted |
| **Orbital distance** | Near / Mid / Far from star | Determines base temperature |
| **Atmosphere** | Breathable / Thin / Toxic / None | Size + distance |
| **Base biome** | Temperate / Arid / Frozen / Volcanic / Ocean / Jungle | Distance + atmosphere |
| **Total population** | 50,000 – 5,000,000 | Size + biome hospitality |
| **Number of regions** | 4–12 | Scaled to size and population |
| **Development level** | Frontier / Established / Developed | Population density |

### 2.2 Region Generation

Each region has:
- **Name** — Procedurally generated, thematic to the biome (e.g., "Khevren Frost Wastes", "Ashfall Basin").
- **Biome** — Derived from the planet's base biome with variation. A frozen world might have: Frozen Waste, Icy Canyons, Tundra Flats, Geothermal Vent Zone. A temperate world might have: Grasslands, Forest, Coastal, Mountain.
- **Primary installation/feature** — What humans built here: Mining Complex, Biodome Agriculture, Geothermal Plant, Starport City, Research Station, Refinery, Military Garrison, Communications Hub, etc.
- **Population** — Fraction of total planet population. The capital/starport region gets the largest share.
- **Points of Interest (POIs)** — 3–6 per region. These are the investigation targets: outposts, comm arrays, surveillance stations, labor camps, settlements. Each POI has a name, type, and grid coordinates within the region.

**Rules for biome coherence:**
- Frozen worlds: Frozen waste, icy canyons, tundra, geothermal zones. Installations are enclosed/domed.
- Arid worlds: Desert, badlands, salt flats, mesa. Installations cluster near water sources.
- Temperate worlds: Forest, plains, coast, mountains. Most Earth-like variety.
- Volcanic worlds: Lava fields, obsidian plains, ash desert, caldera. Installations are hardened/shielded.
- Ocean worlds: Archipelago, reef platform, deep trench, floating city. Installations are aquatic/platform-based.
- Jungle worlds: Dense canopy, river basin, swamp, highland clearing. Installations are carved out of growth.

### 2.3 Planetary View UI

When the player selects the planet of interest from the sector map, show:
- A **planetary overview** with the planet's name, stats (population, atmosphere, biome, development level).
- A **region selector** — a map or list of all regions with their biome, installation, and population.
- Selecting a region enters the **Regional Grid** (Section 3).
- A **"Change Region"** button is always accessible during regional gameplay to move between regions.

### 2.4 Hidden State — The Antagonist Layer

Generate the following **hidden from the player** at planet creation:

- **Antagonist faction**: Imperial Loyalist cell (or other procedurally chosen faction based on lore).
- **Loyalist Leader**: A named NPC with stats and personality. Wants to remain hidden, undermine the Planetary Administrator, and protect loyalist operations.
- **Loyalist strength**: Number of operatives (e.g., 30–100 depending on planet size).
- **Loyalist base**: Located in a specific region, at specific grid coordinates. Hidden until discovered.
- **Loyalist outposts**: 1–3 small hidden positions in other regions. Each is a 1×1 tile on the regional grid, hidden until discovered through investigation.
- **Loyalist agents**: NPCs that will actively work against the player — throwing off trails, feeding misinformation, setting ambushes.
- **Supply lines**: Connections to off-world Imperial facilities (flavor/future content).

---

## 3. Regional Grid — Exploration & Investigation

### 3.1 Grid Setup

Use the **same grid size as the existing battle map**. Each region is represented as a grid.

**Tile types:**
- **Open terrain** — Default. Biome-appropriate appearance (snow, sand, grass, rock, etc.).
- **Installation** — Multi-tile or single-tile structures (the region's main installation).
- **POI (Point of Interest)** — 1×1 tiles. Outposts, comm arrays, settlements. These are the investigation targets.
- **Hidden Loyalist Outpost** — 1×1 tile. Invisible until discovered. Generated when the player succeeds at investigation.
- **Hidden Enemy Squads** — Mobile 1×1 tokens. Invisible until detected (see Section 4).
- **Player Party** — 1×1 token. Moves 1 tile per action.

### 3.2 Player Movement

- The player moves **1 tile per action** (we may add vehicles later).
- Each player movement constitutes one **action tick**. When the player acts, all other entities on the planet also take actions (see Section 5 — Hidden Action System).
- Movement is 4-directional (up/down/left/right) or 8-directional (include diagonals) — recommend 8-directional for tactical feel.

### 3.3 Investigation Mechanics

When the player moves onto or adjacent to a **POI tile**, they can choose to **Investigate**.

**Investigation checks:**
- **Investigation (Perception + Intelligence)** — Standard check to find clues.
- **Tech (Intelligence)** — Alternative check for tech-oriented characters. Used for hacking comm arrays, decrypting surveillance logs, etc.

**On success:**
- The player gains a **clue**. Clues are procedurally generated narrative fragments:
  - *"Encrypted comm traffic detected. Origin bearing points to the Khevren Frost Wastes."*
  - *"Supply manifests show unregistered cargo drops at grid coordinates [X,Y] in the Icy Canyons."*
  - *"A laborer reports seeing armed figures near the geothermal vents at night."*
- After accumulating enough clues (e.g., 2–3 pointing to the same region), **reveal a hidden Loyalist outpost** on the grid as a 1×1 tile at procedurally generated coordinates.
- Clues should guide the player toward the correct regions and eventually toward the main Loyalist base.

**On failure:**
- No clue gained. The POI is "exhausted" for a number of action ticks before it can be investigated again.
- Optionally: A failed check at a compromised POI may alert the Loyalists (slight threat increase).

### 3.4 Region Transition

- The player can **change regions** at any time via a UI button or by moving to a region border tile.
- Changing regions preserves the player's investigation progress, clue log, and threat level.
- The new region loads its own grid with its own POIs, hidden enemies, etc.
- Time passes when changing regions (e.g., 3–5 action ticks), during which the Hidden Action System continues to run.

---

## 4. Detection & Encounter System

### 4.1 Hidden Enemy Movement

Enemy squads exist as invisible tokens on the regional grid. They move **1 tile per action tick** (same as the player), patrolling or hunting.

**Enemy behavior modes:**
- **Patrol** (low threat): Move randomly or along preset routes within the region.
- **Hunt** (high threat): Move toward the player's last known position.
- **Ambush** (special): Position near POIs or chokepoints and wait.

### 4.2 Passive Perception — Detection Rolls

Every time the player moves, perform a **passive Perception check** to detect hidden entities within range.

**Detection ranges and difficulty:**

| Distance (tiles) | Detection DC | Notes |
|---|---|---|
| 4+ tiles | Not detectable | Enemy remains fully hidden |
| 3 tiles | Hard (DC 15+) | Faint signs — tracks, distant sounds |
| 2 tiles | Moderate (DC 10) | Clear indicators — movement, comm chatter |
| 1 tile (adjacent) | Easy (DC 5) | Obvious presence |

On successful detection:
- The enemy token becomes **visible** on the grid.
- The player can choose to engage, avoid, or set up tactically.

On failed detection:
- The enemy remains hidden. If they close to the player's tile, ambush occurs.

### 4.3 Engagement Rules

**Enemy moves onto player's tile (undetected) → AMBUSH:**
- Transition to the **existing battle map system**.
- The enemy gets a **full bonus round** before normal combat begins.
- Enemy squad composition is generated based on Loyalist strength and threat level.

**Player moves onto a visible enemy tile → NORMAL BATTLE:**
- Transition to the **existing battle map system**.
- Normal initiative. No bonus round.

**Player moves onto a hidden enemy tile (undetected by both) → ENCOUNTER:**
- Transition to battle. Both sides get normal initiative (neither surprised).

### 4.4 Post-Battle

- After battle resolution, return to the regional grid.
- **Update the character roster** to reflect wounds, injuries, and status effects sustained in battle. This is critical — wounds persist between battles.
- Dead enemies are removed from the grid.
- Captured enemies can be interrogated for clues (automatic investigation success).

---

## 5. Hidden Action System — NPC Turns

### 5.1 Action Tick Cycle

Every time the player takes an action (move, investigate, change region, etc.), one **action tick** passes. On each tick:

1. **Player acts.**
2. **All NPCs on the planet act** (hidden from the player unless within detection range).
3. **Threat level is evaluated** and NPC behavior may change.

### 5.2 NPC Actions (Per Tick)

**Planetary Administrator (Ally):**
- Provides intel periodically (every N ticks): suspected regions, NPC names, rumored locations.
- If threat is high, may provide military escort or additional resources.

**Loyalist Leader (Hidden Antagonist):**
- At low threat: Continues operations. Sends agents to spread misinformation.
- At medium threat: Repositions outposts. Sends scouts to track the player.
- At high threat: Deploys **hunter squads** to the player's region. Attempts to evacuate the main base.
- At critical threat: Full assault or desperate escape attempt. Endgame trigger.

**Loyalist Agents:**
- Move on the grid each tick.
- If in the same region as the player, may attempt to shadow, mislead, or ambush.
- If in other regions, perform sabotage, recruit, or resupply actions (tracked in the background log).

**Loyalist Squads (Combat Units):**
- Move 1 tile per tick.
- Follow behavior mode (patrol/hunt/ambush) based on threat level.
- When hunting, move toward the player using simple pathfinding.

### 5.3 Background Event Log

Maintain a **hidden event log** that tracks all NPC actions across all regions every tick. This log is not shown to the player but drives the world state. Examples:

```
Tick 12: Loyalist Agent "Voss" moved to POI "Relay Station Theta" in Icy Canyons. Sabotaged comm array.
Tick 13: Loyalist Squad Alpha moved to [4,7] in Frozen Wastes. Patrol mode.
Tick 14: Loyalist Leader ordered squad deployment to Capital Region. Threat level: Medium.
Tick 15: Planetary Administrator sent intel to player: "Suspicious activity reported near the geothermal vents."
```

This log enables the world to feel alive and reactive even when the player isn't looking.

---

## 6. Threat Level System

### 6.1 Threat Meter

Display a **visible threat level** to the player so we can develop and tune enemy behavior at each tier.

**Threat tiers:**

| Level | Label | Value Range | Enemy Behavior |
|---|---|---|---|
| 1 | Unaware | 0–20 | Loyalists operate normally. No squads deployed against player. |
| 2 | Cautious | 21–40 | Scouts sent to player's region. Agents begin counter-intel. |
| 3 | Alerted | 41–60 | Hunter squads deployed. Outposts may relocate. Leader begins contingencies. |
| 4 | Threatened | 61–80 | Multiple squads hunting. Ambushes set at POIs. Leader prepares evacuation. |
| 5 | Critical | 81–100 | Full mobilization. Leader attempts escape or last stand. Endgame sequence. |

### 6.2 Threat Modifiers

| Action | Threat Change |
|---|---|
| Player investigates a POI (success) | +3 |
| Player investigates a POI (failure at compromised POI) | +1 |
| Player discovers a Loyalist outpost | +8 |
| Player wins a battle against Loyalists | +10 |
| Player captures a Loyalist (alive) | +12 |
| Player kills a Loyalist squad | +5 |
| Player interrogates a captured Loyalist | +5 |
| Time passes without player action (every 10 ticks) | -2 (threat decays slowly) |
| Loyalist agent successfully misleads player | -3 |
| Loyalist sabotages a comm array | -2 (harder for player to find clues there) |

### 6.3 Threat UI

Display the threat meter prominently on the regional grid HUD:
- A labeled bar or gauge showing current threat value and tier label.
- Color-coded: Green (Unaware) → Yellow (Cautious) → Orange (Alerted) → Red (Threatened) → Flashing Red (Critical).

---

## 7. Key NPCs — Procedural Generation Templates

### 7.1 Planetary Administrator (Ally)

- **Name**: Procedurally generated.
- **Role**: Civilian governor. Serves the Council.
- **Personality traits**: Pick 2–3 from [Cautious, Ambitious, Honest, Corrupt, Pragmatic, Idealistic, Paranoid, Trusting].
- **Goal**: Maintain order, keep their position, serve the Council.
- **Behavior**: Provides the player with intel, suspected targets, and regions to investigate. May have their own agenda (e.g., a corrupt administrator might withhold info to protect business interests).
- **Located**: Capital region, Starport.

### 7.2 Loyalist Leader (Hidden Antagonist)

- **Name**: Procedurally generated.
- **Role**: Underground cell commander. Former military or intelligence operative.
- **Personality traits**: Pick 2–3 from [Ruthless, Charismatic, Fanatical, Calculating, Desperate, Patient, Vengeful, Honorable].
- **Goal**: Remain hidden. Undermine the Planetary Administrator. Recruit for the Imperial cause. Protect the cell.
- **Behavior**: Directs agents and squads. Escalates response as threat increases. Will sacrifice operatives to protect the base. At critical threat, may confront the player directly or attempt to flee off-world.
- **Located**: Hidden base (specific region and grid coordinates, generated at planet creation).

### 7.3 Loyalist Agents

- Generate 2–5 named agents with basic stats.
- Each has a specialty: infiltration, sabotage, combat, intel.
- They operate semi-independently based on the Leader's orders and threat level.

---

## 8. Character Roster — Wound Persistence

### 8.1 Post-Battle Roster Update

After every battle (ambush, encounter, or player-initiated):
- **Sync the character roster** with the battle results.
- Wounds, HP loss, status effects, and deaths carry over to the exploration phase.
- Dead characters are marked as KIA on the roster.
- Wounded characters have reduced stats until healed.

### 8.2 Healing

- Healing occurs over time (slow regen per action tick) or at specific locations (medical bays at installations).
- The player may need to return to the capital/starport for full medical treatment.

### 8.3 Roster Display

- The character roster should be accessible at all times during exploration.
- Show each character's current HP, wounds, status effects, and equipment.
- Highlight characters who are critically wounded or at reduced effectiveness.

---

## 9. Procedural Storytelling — Narrative Generation

### 9.1 Story Beats

The system should generate contextual narrative text at key moments:

- **Arrival**: Description of the planet, its atmosphere, the starport, the mood of the populace.
- **Administrator meeting**: Dialogue with the Planetary Administrator. They provide initial leads.
- **Clue discovery**: Flavor text for each clue found. Should feel like uncovering a conspiracy.
- **Enemy encounter**: Pre-battle narrative. Who are these Loyalists? Why are they fighting?
- **Threat escalation**: Notifications when threat level changes tier. The tone shifts — from calm investigation to urgent danger.
- **Endgame**: Discovery of the main base. Confrontation with the Loyalist Leader. Resolution.

### 9.2 Tone

- The overall tone is **tense, grounded sci-fi**. Think noir investigation meets military sci-fi.
- Early game: Quiet, procedural investigation. Sparse encounters. Building unease.
- Mid game: Escalating danger. Ambushes. Counter-intel. The hunter becomes the hunted.
- Late game: Full-scale confrontation. Assault on the Loyalist base. Climactic battle.

---

## 10. Implementation Priority Order

Build these systems in this order, testing each before moving to the next:

1. **Star system generation** — Procedural star + orbital bodies. Sector map UI with planet selection.
2. **Planet generation** — Parameters, regions, biomes, installations, populations. Planetary view UI.
3. **Regional grid** — Grid rendering with terrain tiles, POIs, player token. Movement system (1 tile per action).
4. **Investigation mechanics** — POI interaction, skill checks, clue generation, Loyalist outpost reveal.
5. **Hidden NPC action system** — Action tick cycle, NPC movement, background event log.
6. **Detection & encounter system** — Passive perception, hidden enemies, ambush/normal battle transitions.
7. **Threat level system** — Threat meter, modifiers, UI display, behavior tier triggers.
8. **NPC generation** — Planetary Administrator, Loyalist Leader, agents. Dialogue and intel delivery.
9. **Battle integration** — Seamless transition to existing battle map. Post-battle roster sync with wound persistence.
10. **Region transition** — Ability to change regions. Time passage. Grid state preservation.
11. **Narrative layer** — Procedural story text at key moments. Arrival, clues, escalation, endgame.

---

## 11. Data Structures — Reference

These are suggested schemas. Adapt to your existing codebase.

```
StarSystem {
  name: string
  star: { type, color, luminosity }
  bodies: [{ name, type, orbitalSlot, description }]
  planetOfInterest: Planet
}

Planet {
  name: string
  size: "small" | "medium" | "large"
  biome: string
  atmosphere: string
  population: number
  developmentLevel: string
  regions: Region[]
  hiddenState: {
    antagonistFaction: string
    loyalistLeader: NPC
    loyalistStrength: number
    loyalistBase: { regionIndex, gridX, gridY }
    loyalistOutposts: [{ regionIndex, gridX, gridY, discovered }]
    agents: NPC[]
    squads: Squad[]
    eventLog: LogEntry[]
  }
  threatLevel: number
}

Region {
  name: string
  biome: string
  installation: string
  population: number
  pois: POI[]
  grid: Tile[][]
  entities: Entity[]  // player, enemies, agents on this grid
}

POI {
  name: string
  type: string  // "comm_array", "outpost", "settlement", etc.
  gridX: number
  gridY: number
  investigated: boolean
  exhaustedUntilTick: number
  compromised: boolean  // loyalist presence here?
}

NPC {
  name: string
  role: string
  traits: string[]
  stats: CharacterStats
  goal: string
  location: { regionIndex, gridX, gridY }
  hidden: boolean
  alive: boolean
}

Squad {
  id: string
  members: NPC[]
  mode: "patrol" | "hunt" | "ambush"
  location: { regionIndex, gridX, gridY }
  hidden: boolean
  targetLocation: { gridX, gridY } | null
}

LogEntry {
  tick: number
  actor: string
  action: string
  region: string
  details: string
}
```

---

## Summary

This system creates a layered gameplay loop:

**Sector → System → Planet → Region → Grid → Investigation → Battle → Consequences**

The player investigates a world tile-by-tile while hidden enemies act in the background. Clues lead to outposts, outposts lead to the base, and the threat level escalates the danger throughout. Every battle has consequences that persist on the character roster. The world reacts to the player's actions even when they're not looking.

Build each layer incrementally, test it, then add the next. The existing battle map system is the combat resolution engine — this prompt builds everything around it.
