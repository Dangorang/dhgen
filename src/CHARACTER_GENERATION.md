# CHARACTER GENERATION SYSTEM — Project Codename: The Twelve Hours

> **Purpose:** This document defines the complete character generation system for Council Agent squad members. It is the canonical reference for all character creation logic, stat rolling, role assignment, physiology derivation, name generation, and detail layers. All character generation should follow the layered sequence and rules described here.

> **Companion Document:** LORE_BIBLE.md — refer to it for faction context, universe tone, and narrative framework.

---

## TABLE OF CONTENTS

1. [Generation Sequence](#generation-sequence)
2. [Layer 1: Character Origin](#layer-1-character-origin)
3. [Layer 2: Base Stats](#layer-2-base-stats)
4. [Layer 3: Role Selection](#layer-3-role-selection)
5. [Layer 4: Physiology](#layer-4-physiology)
6. [Layer 5: Name Generation](#layer-5-name-generation)
7. [Layer 6: Personality](#layer-6-personality)
8. [Layer 7: Gear Loadout](#layer-7-gear-loadout)
9. [Layer 8: Character Details](#layer-8-character-details)
10. [Complete Role Reference](#complete-role-reference)
11. [Complete Weapon and Gear Reference](#complete-weapon-and-gear-reference)
12. [Stat Summary Tables](#stat-summary-tables)

---

## GENERATION SEQUENCE

Characters are generated in a strict layered sequence. Each layer constrains the layers that follow.

```
1. ORIGIN ──► 2. STATS ──► 3. ROLE ──► 4. PHYSIOLOGY ──► 5. NAME ──► 6. PERSONALITY ──► 7. GEAR ──► 8. DETAILS
```

**Step 1 — Origin:** Determines stat modifiers, role access, physiology tendencies, name conventions, and narrative background.

**Step 2 — Stats:** Rolled using Origin-modified base values.

**Step 3 — Role:** Selected from Origin-permitted roles. Role stat modifiers applied on top of Origin stats.

**Step 4 — Physiology:** Derived from final stats and Origin. Includes age, height, weight, skin tone, hair color, eye color, and build.

**Step 5 — Name:** Generated from Origin-specific cultural templates. Player may enter a custom name or randomize.

**Step 6 — Personality:** Rolled from Role-weighted personality tables.

**Step 7 — Gear:** Determined by Role with possible Origin-influenced variations.

**Step 8 — Details:** Visual traits, charm/trinket, quirk/habit. Rolled from Origin-weighted tables.

---

## LAYER 1: CHARACTER ORIGIN

Origin defines where the character grew up, what shaped them, and what doors are open or closed to them.

---

### HIVE-BORN

**Background:** Raised in massive, overcrowded industrial cities that manufacture the Council's war machine. Dense populations, factory labor, gang hierarchies, pollution, and violence. Hive-born agents are tough, streetwise, and comfortable in confined urban environments. They have never seen an open sky without smog.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Toughness | +5 |
| Perception | +5 |
| Agility | +5 |
| Intelligence | -5 |

**Role Access:** Veteran Infantry, Corpsman, Demotech, Infiltrator.
**Role Restrictions:** No Artificer (education access too limited). No Sanctioned (screening infrastructure in hives is brutal and most candidates do not survive selection intact enough to be useful — rare exceptions possible).

**Physiology Tendencies:**
- Build: Stocky to average
- Skin: Pale from artificial lighting
- Hair: Tends dark
- Distinguishing: Higher frequency of industrial scarring and tattoos

**Name Convention:** Short, blunt, often single-syllable given names. Surnames derived from factory districts or work classifications.
**Name Format:** [Given] [District Surname]
**Examples:** Kael Drosswick, Ren Ashward, Tam Greymill, Voss Cinder, Brix Foundry, Sal Millbank

---

### VOID-BORN

**Background:** Raised on orbital stations, generation ships, or deep-space installations. Entire lives spent in artificial gravity, recycled air, and the hum of machinery. Void-born are comfortable in zero-G, familiar with ship systems, and accustomed to isolation and tight communities where everyone depends on everyone else.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Agility | +5 |
| Intelligence | +5 |
| Perception | +5 |
| Strength | -5 |
| Toughness | -5 |

**Role Access:** All roles. Void-born have broad exposure to technical systems and diverse skill sets out of necessity.
**Role Restrictions:** None.

**Physiology Tendencies:**
- Build: Tall and lean from low or variable gravity
- Skin: Pale, often with slight translucence
- Hair: White or very light hair significantly more common
- Features: Slightly elongated
- Distinguishing: Light-sensitive eyes, elongated fingers

**Name Convention:** Formal, often hyphenated. Station or ship names incorporated into family names. Given names tend toward old astronomical terminology.
**Name Format:** [Given] [Station/Ship-Hyphenate]
**Examples:** Seren Ark-Valis, Cael Orion-Dray, Lyss Threshold-Kaine, Mira Solace-Venn, Theron Drift-Callum

---

### FRONTIER-BORN

**Background:** Raised on the outer edges of settled space, on worlds that are sparsely populated, poorly supplied, and far from Council authority. Frontier worlds are self-reliant out of necessity. People hunt, build, repair, and fight for themselves. Council presence is thin — maybe a garrison town and a communication relay.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Strength | +5 |
| Toughness | +5 |
| Perception | +5 |
| Leadership | -5 |
| Willpower | -5 |

**Role Access:** Veteran Infantry, Corpsman, Demotech, Infiltrator.
**Role Restrictions:** No Artificer (too far from technical infrastructure). No Sanctioned (screening programs barely reach frontier worlds).

**Physiology Tendencies:**
- Build: Weathered, rangy
- Skin: Varies widely by world conditions — sun-darkened on arid worlds, pale on ice worlds
- Hair: May be sun-bleached lighter
- Distinguishing: Scarring from wildlife, weather, and manual labor common

**Name Convention:** Practical, often nature-derived or place-derived. Family names tied to homesteads or geographic features.
**Name Format:** [Given] [Homestead/Geographic Surname]
**Examples:** Drev Coldridge, Marra Stonefield, Joss Windhollow, Tarn Ashfen, Kira Deepwell, Breck Thornwall

---

### SCHOLA-BORN

**Background:** Raised in Council institutional education from a young age. Orphans, children of disgraced families, or children voluntarily surrendered by zealous parents for the honor of Council service. The Schola system is the Council's indoctrination pipeline at its purest — these agents have known nothing but Council doctrine their entire lives.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Willpower | +10 |
| Leadership | +5 |
| Strength | -5 |

**Role Access:** All roles. The Schola system is designed to sort children into optimal career paths early.
**Role Restrictions:** None.

**Personality Note:** Personality rolls for Schola-born are heavily weighted toward Zealous, Disciplined, or Ambitious regardless of Role weighting.

**Physiology Tendencies:**
- Build: Average, well-fed but not physically remarkable
- Grooming: Uniform standards from youth
- Distinguishing: Institutional tattoos or brandings marking their Schola of origin

**Name Convention:** Given names assigned by the institution, drawn from Council martyrs or historical figures. Surnames are their Schola designation — cold, institutional identifiers.
**Name Format:** [Assigned Given] [Schola Designation]
**Examples:** Castus Primus-VII, Venn Doctrina-XII, Sera Fortis-III, Aldren Vigil-IX, Maren Crucis-IV

---

### NOBLE-BORN

**Background:** Raised in privileged families that govern sectors, systems, or major institutions under Council authority. Nobility in the Council era is political dynasty — families who consolidated power in the post-betrayal chaos and held it through loyalty, wealth, and ruthlessness. Noble-born agents enter service with connections, education, and expectations.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Intelligence | +5 |
| Leadership | +10 |
| Toughness | -5 |
| Strength | -5 |

**Role Access:** All roles technically. Demotech and Corpsman are rare — noble families do not typically send children to be field medics or demolitions specialists. Infiltrator is an interesting exception — some noble families cultivate espionage as a family tradition.
**Role Restrictions:** None (but weighted probability against Demotech and Corpsman).

**Physiology Tendencies:**
- Build: Well-nourished, often tall
- Skin: Clear, healthy complexion regardless of tone
- Health: Superior medical access from birth
- Distinguishing: Subtle gene-seed enhancements may be present in the wealthiest families, affecting appearance and longevity

**Name Convention:** Long, multi-part names with family prefixes, honorific suffixes, and lineage indicators. Given names are classical and ornate.
**Name Format:** [Honorific Prefix] [Given] [Middle Lineage] [Family Surname] [Honorific Suffix]
**Examples:** Ser Aldric Voss-Meridian Caelworth the Younger, Dame Lysara Thane-Solari Ashcourt of the Fourth Hour, Lord Cassius Draeven-Kael Mordaine, Ser Petra Venn-Auric Halstead the Third

---

### MILITARUM-BORN

**Background:** Raised in military families, garrison worlds, or fleet communities. Their parents served, their grandparents served, and they were expected to serve from birth. Military culture is all they know — hierarchy, discipline, unit cohesion, and the understanding that you follow orders or people die.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Strength | +5 |
| Toughness | +5 |
| Willpower | +5 |
| Leadership | +5 |
| Intelligence | -5 |

**Role Access:** Veteran Infantry, Corpsman, Demotech.
**Role Restrictions:** No Infiltrator (too rigid and institutionalized for deep cover work). No Artificer (technical education too narrow). Sanctioned possible but rare.

**Physiology Tendencies:**
- Build: Physically developed from childhood training regimens
- Distinguishing: Military tattoos and unit markings common. Scarring from training accidents and early service.

**Name Convention:** Strong, clipped names. Surnames often carry generational military honorifics — a family that has served for ten generations carries that in their name.
**Name Format:** [Given] [Family Surname] [Generational Honorific]
**Examples:** Bren Harkov Sixthline, Dalla Vostok Tenthwatch, Cade Marek Firstsword, Jael Torrin Fourthblade, Ryn Callus Eighthwall

---

### OUTCAST

**Background:** Not a place but a circumstance. Outcasts come from penal colonies, refugee populations, displaced communities, the underclass that exists in every sector. They survived by wit, violence, and adaptability. The Council recruits from this pool when they need someone expendable or someone whose skills were forged outside legitimate channels.

**Stat Modifiers:**
| Stat | Modifier |
|------|----------|
| Agility | +10 |
| Perception | +5 |
| Willpower | -5 |
| Leadership | -10 |

**Role Access:** Infiltrator, Veteran Infantry. Corpsman possible if they learned field medicine through necessity.
**Role Restrictions:** No Artificer (no technical education). No Sanctioned (no access to screening programs — though an Outcast with latent psionic ability missed by screening is a compelling rare exception). No Demotech (no formal explosives training).

**Physiology Tendencies:**
- Build: Lean, often malnourished in youth leaving lasting marks
- Distinguishing: Tattoos from gang affiliation, penal branding, or cultural identity. Highly variable appearance.

**Name Convention:** Street names, aliases, single names. Many Outcasts do not use their birth name. Some do not know it.
**Name Format:** [Street Name or Single Name]
**Examples:** Slit, Marrow, Dusk, Glass, Nine-Finger Kel, Sable, Haunt, Crow, Jink

---

## LAYER 2: BASE STATS

### Average Adult Human Baseline

| Stat | Formula |
|------|---------|
| Strength | 20 + 2D10 |
| Toughness | 20 + 2D10 |
| Agility | 20 + 2D10 |
| Perception | 20 + 2D10 |
| Intelligence | 20 + 2D10 |
| Willpower | 20 + 2D10 |
| Leadership | 5 + 2D10 |
| PSY Rating | 0 + D10 |

### Stat Definitions

**Strength:** Raw physical power. Carrying capacity, melee damage, ability to force open doors or restrain targets. Influences Height and Weight.

**Toughness:** Physical resilience. Ability to absorb damage, resist illness, endure harsh environments, and keep functioning through pain. Influences Height and Weight. Represented by scars and old wounds.

**Agility:** Speed, reflexes, coordination, stealth, and fine motor control. Inversely influences Height and Weight (agile characters tend leaner).

**Perception:** Awareness of surroundings. Ability to notice threats, detect anomalies, read people, and pick up details others miss.

**Intelligence:** Reasoning, problem-solving, technical knowledge, and the ability to process complex information quickly.

**Willpower:** Mental fortitude. Resistance to fear, intimidation, psionic influence, indoctrination, and psychological stress.

**Leadership:** Natural authority and the ability to command, inspire, or direct others. Note: baseline for average humans is lower (5+2D10) than other stats because most people are not leaders.

**PSY Rating:** Aetheric potential. For the vast majority of humans this is negligible (0+D10 baseline, with most results being functionally zero). Only Sanctioned specialists have meaningful ratings.

### Stat Generation Process

1. Roll baseline stats for an average human (formulas above)
2. Apply Origin modifiers (add/subtract from base values before rolling)
3. Roll dice
4. Apply Role modifiers (added after rolling)

**Example:** A Hive-born Veteran Infantry character rolling Toughness:
- Human base: 20
- Hive-born modifier: +5 = 25
- Veteran Infantry modifier: +10 (base 30 replaces human base, so effective base is 30+5 = 35)
- Roll: 35 + 2D10

> **Implementation Note:** When both Origin and Role modify the same stat, apply Origin modifier to the Role base if the Role base is higher than human base. If the Role does not modify that stat, apply Origin modifier to the human base. The higher base always takes precedence.

---

## LAYER 3: ROLE SELECTION

### Available Roles

Player selects from roles permitted by their Origin. The six base roles are:

| Role | Summary |
|------|---------|
| **Veteran Infantry** | Core combat. Standard-issue weapons, above-average strength and toughness. |
| **Sanctioned** | Council-controlled psionic operative. Monitored, leashed, distrusted but essential. |
| **Artificer** | Field technician. Maintains degraded tech. Carries the squad's high-power encrypted comms array. |
| **Corpsman** | Veteran frontline medic. Military first, medical second. |
| **Demotech** | Demolitions and breaching specialist. Explosives, structural analysis, heavy equipment. |
| **Infiltrator** | Elite recon and infiltration. Extensive training, typically solo, difficult to integrate into squads. |

### Origin-Role Access Matrix

| Origin | Vet. Infantry | Sanctioned | Artificer | Corpsman | Demotech | Infiltrator |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Hive-born | YES | NO | NO | YES | YES | YES |
| Void-born | YES | YES | YES | YES | YES | YES |
| Frontier-born | YES | NO | NO | YES | YES | YES |
| Schola-born | YES | YES | YES | YES | YES | YES |
| Noble-born | YES | YES | YES | RARE | RARE | YES |
| Militarum-born | YES | RARE | NO | YES | YES | NO |
| Outcast | YES | NO | NO | RARE | NO | YES |

> **RARE** means the combination is possible but should be uncommon in random generation. If the player specifically selects it, allow it — these are the interesting edge cases.

### Prefect — Promotion Layer

The Prefect is not a base role. It is a promotion applied to any of the six base roles. A Prefect retains their original role's stats and gains additional modifiers:

| Stat | Prefect Modifier |
|------|-----------------|
| Willpower | +5 |
| Leadership | +10 |

**Personality Filter:** Prefects are drawn disproportionately from Disciplined, Zealous, Pragmatic, Stoic, Ambitious, and Ruthless personality types. The Council's indoctrination pipeline selects for these traits.

**Equipment:** The Prefect carries the **Seal of Authority** — a physical object encoded with Council authorization that grants command authority, restricted communications access, and requisition capability. It also functions as a monitoring device reporting to the Senior Overseer.

---

### Role Stat Modifiers

Applied after Origin modifiers.

#### VETERAN INFANTRY

| Stat | Base + Roll | Rationale |
|------|-------------|-----------|
| Strength | 30 + 2D10 | Strength training and years of active duty |
| Toughness | 30 + 2D10 | Ability to take hits, demonstrated by scars and old wounds |
| Agility | 20 + 2D10 | No specialized modifier |
| Perception | 30 + 2D10 | Years in active engagements make one quick to notice threats |
| Intelligence | 20 + 2D10 | No specialized modifier |
| Willpower | 35 + 2D10 | Mental fortitude from years of hardship |
| Leadership | 30 + 2D10 | Natural leaders rising through combat ranks |
| PSY Rating | 0 + D10 | Standard human baseline |

#### SANCTIONED

| Stat | Base + Roll | Rationale |
|------|-------------|-----------|
| Strength | 20 + 2D10 | No physical emphasis; they rely on the Aether |
| Toughness | 25 + 2D10 | The sanctioning process and trials are physically punishing; survivors are hardened |
| Agility | 20 + 2D10 | No specialized modifier |
| Perception | 30 + 2D10 | Trained to detect psionic activity and anomalies; senses sharpened through attunement exercises |
| Intelligence | 25 + 2D10 | Must understand Council psionic doctrine and complex protocols |
| Willpower | 40 + 2D10 | Defining stat. The sanctioning trials break most candidates. Survivors have extraordinary mental fortitude. The limiter requires constant discipline. |
| Leadership | 5 + 2D10 | Nobody follows a Sanctioned willingly. Feared and distrusted, kept at arm's length. |
| PSY Rating | 20 + 2D10 | The whole point. Council screening identified them, trials developed them, ongoing training refines them. |

#### ARTIFICER

| Stat | Base + Roll | Rationale |
|------|-------------|-----------|
| Strength | 20 + 2D10 | Not combat-focused; carries heavy equipment but not trained for physical confrontation |
| Toughness | 25 + 2D10 | Field work toughens them. Burns, shocks, exposure to unstable equipment are occupational hazards. |
| Agility | 25 + 2D10 | Precise hands, steady under pressure. Delicate work on fragile technology builds fine motor control. |
| Perception | 30 + 2D10 | Trained to notice details — flickering indicators, faint hums, hairline fractures in cogitator housings. |
| Intelligence | 40 + 2D10 | Defining stat. Smartest person in the squad by necessity. Maintains technology through reasoning and pattern recognition. |
| Willpower | 25 + 2D10 | Discipline to work methodically under fire and resist dangerous curiosity. |
| Leadership | 10 + 2D10 | Respected for skills but not natural commanders. |
| PSY Rating | 0 + D10 | Standard human baseline |

**Special Equipment:** Carries the squad's high-power encrypted comms array for communication with the Justicar. All command communications pass through the Artificer.

#### CORPSMAN

| Stat | Base + Roll | Rationale |
|------|-------------|-----------|
| Strength | 25 + 2D10 | Must drag wounded agents from fire, carry heavy medical equipment, restrain patients during field surgery. |
| Toughness | 30 + 2D10 | Former frontline infantry before medical selection. Has taken hits and kept moving. |
| Agility | 25 + 2D10 | Moving through active engagements to reach wounded. Steady hands for field surgery under pressure. |
| Perception | 30 + 2D10 | Reads a body at a glance. Assesses injuries, spots shock symptoms, notices hidden wounds. |
| Intelligence | 30 + 2D10 | Medical protocols, drug interactions, field diagnoses with limited equipment. Processes fast, decides under pressure. |
| Willpower | 35 + 2D10 | Watches people die and moves to the next patient. Years of that forges something unshakable. |
| Leadership | 15 + 2D10 | Not a command role, but carries quiet authority. When the Corpsman says someone cannot fight, the Prefect listens. |
| PSY Rating | 0 + D10 | Standard human baseline |

#### DEMOTECH

| Stat | Base + Roll | Rationale |
|------|-------------|-----------|
| Strength | 30 + 2D10 | Carries heaviest specialist equipment. Raw power needed for manual breaching. |
| Toughness | 35 + 2D10 | Defining physical stat. Works close to explosions, collapses, structural failures. Body is a map of blast concussions and shrapnel. |
| Agility | 20 + 2D10 | Heavy gear and armor slow them. Precision matters but speed is not their strength. |
| Perception | 30 + 2D10 | Reads structures like a Corpsman reads bodies. Load-bearing walls, stress fractures, material density. |
| Intelligence | 30 + 2D10 | Calculating blast radii, understanding materials, improvising charges. Deeply practical problem-solving. |
| Willpower | 30 + 2D10 | Steady nerves are a job requirement. |
| Leadership | 10 + 2D10 | Respected specialist but not a leader. Tells the squad where to stand and when to cover their ears. |
| PSY Rating | 0 + D10 | Standard human baseline |

#### INFILTRATOR

| Stat | Base + Roll | Rationale |
|------|-------------|-----------|
| Strength | 20 + 2D10 | Not a brute force role. Avoids direct confrontation. |
| Toughness | 20 + 2D10 | Light and lean. Does not absorb punishment, avoids it entirely. |
| Agility | 35 + 2D10 | Defining physical stat. Speed, stealth, flexibility, reflexes. Years of evasion, climbing, silent movement training. |
| Perception | 40 + 2D10 | Defining stat overall. Sees everything — security patterns, guard rotations, social dynamics, structural vulnerabilities. Survival depends on noticing what others miss. |
| Intelligence | 35 + 2D10 | Extensive training produces sharp, adaptive minds. Forges documents, cracks security, constructs cover identities. |
| Willpower | 30 + 2D10 | Operating solo behind enemy lines. Maintaining cover under pressure. Resisting interrogation. |
| Leadership | 5 + 2D10 | Works alone. Leading a team conflicts with their instincts. Lowest squad integration. |
| PSY Rating | 0 + D10 | Standard human baseline |

---

## LAYER 4: PHYSIOLOGY

### Age

**Formula:** 16 + 4D10

**Range:** 20–56, clustering around 30–40.

**Narrative Note:** Young agents (20–25) are green and unproven. Middle-aged agents (30–45) are experienced and in their prime. Older agents (46–56) are grizzled veterans who have survived longer than most.

### Height

**Formula:** 160cm + Origin Adjustment + Stat Modifier + 2D10 cm

**Stat Modifier:** ((Strength + Toughness) / 10) - (Agility / 10), rounded to nearest integer. Uses final stats after all modifiers.

**Origin Adjustments:**
| Origin | Height Adjustment |
|--------|------------------|
| Hive-born | -5 cm |
| Void-born | +10 cm |
| Frontier-born | +0 cm |
| Schola-born | +0 cm |
| Noble-born | +5 cm |
| Militarum-born | +0 cm |
| Outcast | -5 cm |

### Weight

**Formula:** 60kg + Origin Adjustment + Stat Modifier + 2D10 kg

**Stat Modifier:** ((Strength + Toughness) / 5) - (Agility / 5), rounded to nearest integer. Uses final stats after all modifiers.

**Origin Adjustments:**
| Origin | Weight Adjustment |
|--------|------------------|
| Hive-born | +5 kg |
| Void-born | -10 kg |
| Frontier-born | +5 kg |
| Schola-born | +0 kg |
| Noble-born | +0 kg |
| Militarum-born | +5 kg |
| Outcast | -5 kg |

### Build Descriptor

Derived from final Height and Weight ratio:

| BMI Equivalent Range | Descriptor |
|---------------------|------------|
| Very low | Gaunt |
| Low | Lean |
| Low-medium | Wiry |
| Medium | Average |
| Medium-high | Stocky |
| High | Broad |
| Very high | Heavy |

### Skin Tone

Determined primarily by Origin with randomization.

| Origin | Primary Tendencies | Notes |
|--------|-------------------|-------|
| Hive-born | Pale, sallow, light olive | Artificial lighting, no sun exposure |
| Void-born | Very pale, slightly translucent | Station-born pallor |
| Frontier-born | Varies widely by homeworld | Arid worlds: sun-darkened. Ice worlds: pale. Jungle worlds: deeper tones. Roll or select based on homeworld type. |
| Schola-born | Any, evenly distributed | Schola draw from all populations |
| Noble-born | Any, with clear and healthy complexion | Superior medical care smooths complexion regardless of tone |
| Militarum-born | Any, evenly distributed | Military families come from all sectors |
| Outcast | Any, evenly distributed | Outcasts come from everywhere |

### Hair Color

**Base Options:** Black, Dark Brown, Brown, Auburn, Red, Blonde, Light Blonde, Grey, White.

| Origin | Weighting |
|--------|-----------|
| Hive-born | Heavy: Black, Dark Brown. Medium: Brown. Rare: Auburn, Blonde. |
| Void-born | Heavy: White, Light Blonde, Grey. Medium: Blonde. Rare: Brown. Very Rare: Black. |
| Frontier-born | Even distribution with slight bias toward sun-bleached lighter tones. |
| Schola-born | Even distribution. |
| Noble-born | Even distribution. |
| Militarum-born | Even distribution. |
| Outcast | Even distribution. |

**Age Modifier:** Characters over 40 shift one step toward Grey. Characters over 50 shift two steps toward Grey/White.

### Eye Color

**Base Options:** Dark Brown, Brown, Hazel, Green, Grey, Blue, Pale Blue.

| Origin | Weighting |
|--------|-----------|
| Hive-born | Heavy: Dark Brown, Brown. Medium: Hazel. Rare: Green, Grey. |
| Void-born | Heavy: Grey, Pale Blue. Medium: Blue. Rare: Hazel. |
| Frontier-born | Even distribution. |
| Schola-born | Even distribution. |
| Noble-born | Even distribution with slight bias toward striking colors (Green, Blue). |
| Militarum-born | Even distribution. |
| Outcast | Even distribution. |

**Rare Result (1% chance regardless of Origin):** Violet or Amber. The character has never thought twice about it, but it may be a marker of latent Aetheric attunement. This has no mechanical effect unless the narrative activates it.

---

## LAYER 5: NAME GENERATION

The player may enter a custom name or generate one randomly. Random generation follows Origin-specific cultural templates.

### HIVE-BORN
**Format:** [Given] [District Surname]
**Given Names:** Short, blunt, often single-syllable. Examples: Kael, Ren, Tam, Voss, Brix, Sal, Dek, Nev, Grinn, Jace, Tol, Mak, Fen, Rook, Cog.
**Surnames:** Derived from factory districts or work classifications. Examples: Drosswick, Ashward, Greymill, Cinder, Foundry, Millbank, Rustfield, Smeltdon, Pressward, Cokeburn.

### VOID-BORN
**Format:** [Given] [Station/Ship-Hyphenate]
**Given Names:** Formal, astronomical terminology. Examples: Seren, Cael, Lyss, Mira, Theron, Vega, Altair, Eos, Lune, Peri, Axis, Zenith, Cora, Solenne.
**Surnames:** Hyphenated station/ship names. Examples: Ark-Valis, Orion-Dray, Threshold-Kaine, Solace-Venn, Drift-Callum, Meridian-Salk, Haven-Rho, Eclipse-Farren.

### FRONTIER-BORN
**Format:** [Given] [Homestead/Geographic Surname]
**Given Names:** Practical, solid. Examples: Drev, Marra, Joss, Tarn, Kira, Breck, Hale, Wynn, Colt, Dessa, Leith, Rowan, Thane, Petra.
**Surnames:** Nature-derived or geographic. Examples: Coldridge, Stonefield, Windhollow, Ashfen, Deepwell, Thornwall, Ironmoor, Dryreach, Blackthorn, Stormvale.

### SCHOLA-BORN
**Format:** [Assigned Given] [Schola Designation]
**Given Names:** Drawn from Council martyrs and historical figures. Examples: Castus, Venn, Sera, Aldren, Maren, Lucan, Decima, Corvus, Pallas, Septima, Felix, Justus.
**Surnames:** Institutional Schola designators. Examples: Primus-VII, Doctrina-XII, Fortis-III, Vigil-IX, Crucis-IV, Ferrum-VI, Bellum-II, Fidus-VIII.

### NOBLE-BORN
**Format:** [Honorific Prefix] [Given] [Middle Lineage] [Family Surname] [Honorific Suffix]
**Honorific Prefixes:** Ser, Dame, Lord, Lady, Scion.
**Given Names:** Classical and ornate. Examples: Aldric, Lysara, Cassius, Petra, Valerian, Isolde, Octavian, Seraphine, Hadrian, Celestine.
**Middle Lineage:** Hyphenated maternal/paternal line. Examples: Voss-Meridian, Thane-Solari, Draeven-Kael, Venn-Auric, Cross-Halcyon.
**Family Surnames:** Examples: Caelworth, Ashcourt, Mordaine, Halstead, Blackholme, Argentus, Valorian, Sternmark.
**Honorific Suffixes:** the Younger, the Elder, the Third, of the [Nth] Hour, Secondborn, Heir-Apparent.

### MILITARUM-BORN
**Format:** [Given] [Family Surname] [Generational Honorific]
**Given Names:** Strong, clipped. Examples: Bren, Dalla, Cade, Jael, Ryn, Torr, Vex, Kade, Mira, Stern, Holt, Dace.
**Surnames:** Examples: Harkov, Vostok, Marek, Torrin, Callus, Brenn, Dekker, Volsk, Thrace, Renn.
**Generational Honorifics:** [Ordinal]line, [Ordinal]watch, [Ordinal]sword, [Ordinal]blade, [Ordinal]wall, [Ordinal]shield. Examples: Sixthline, Tenthwatch, Firstsword, Fourthblade, Eighthwall, Thirdshield.

### OUTCAST
**Format:** [Street Name or Single Name]
**Names:** Slit, Marrow, Dusk, Glass, Sable, Haunt, Crow, Jink, Needle, Whisper, Notch, Copper, Splint, Gutter, Ash, Flicker, Moth, Scratch, Rust, Shale.
**Modified Names:** Occasionally a descriptor attached. Examples: Nine-Finger Kel, Blind Moss, Tall Sev, Old Fen, Red Tash.

---

## LAYER 6: PERSONALITY

### The Sixteen Personalities

| # | Personality | Description |
|---|-------------|-------------|
| 1 | **Stoic** | Reveals little, endures much, rarely complains. Steady under pressure but hard to read and connect with. |
| 2 | **Zealous** | True believer in Council doctrine. Motivated, reliable, but inflexible and potentially dangerous when doctrine conflicts with reality. |
| 3 | **Pragmatic** | Does what works. Not interested in ideology or sentiment, just results. Useful but can feel cold and transactional. |
| 4 | **Bitter** | Carries resentment from past experiences. Competent but corrosive. Sees the worst in every situation. |
| 5 | **Quiet** | Says little, observes much. Not unfriendly, just economical with words. Easy to overlook. |
| 6 | **Arrogant** | Knows they are good and makes sure everyone else knows. Confidence can be infectious or alienating. |
| 7 | **Cautious** | Thinks before acting, plans contingencies, hesitates under sudden pressure. Keeps the squad alive through preparation but slows decisions. |
| 8 | **Aggressive** | Pushes forward, hits hard, acts fast. Valuable in a fight but prone to escalation and poor judgment when restraint is needed. |
| 9 | **Loyal** | Bonds deeply with squadmates. Will take a bullet for the team. But loyalty to people can conflict with loyalty to the Council. |
| 10 | **Sardonic** | Copes through dark humor and deflection. Keeps morale from collapsing but can undermine seriousness when needed. |
| 11 | **Disciplined** | Follows orders precisely, maintains standards, expects the same from others. Ideal on paper but rigid and unforgiving of deviation. |
| 12 | **Curious** | Asks questions, investigates, wants to understand why. Dangerous in the Council's culture where certain questions are forbidden. |
| 13 | **Ruthless** | Gets the job done regardless of cost. No hesitation, no remorse. Valued by the Council but even squadmates keep distance. |
| 14 | **Compassionate** | Cares about collateral damage, civilian lives, the human cost. A liability in the Council's eyes but holds a squad's humanity together. |
| 15 | **Haunted** | Something in their past will not let go. Functional but carrying weight. Unpredictable under the wrong kind of pressure. |
| 16 | **Ambitious** | Actively climbing the ranks. Volunteers for high-risk missions, delivers results, takes initiative. Looks great on paper until you see them prioritizing career over squad. |

### Personality Weighting by Role

Weights are: **HIGH** (common), **MEDIUM** (possible), **LOW** (uncommon), **RARE** (very unlikely), **EXCLUDED** (not available for this role).

#### VETERAN INFANTRY
| Weight | Personalities |
|--------|--------------|
| High | Stoic, Aggressive, Loyal, Disciplined, Bitter |
| Medium | Pragmatic, Zealous, Haunted, Sardonic |
| Low | Cautious, Ruthless, Compassionate, Ambitious |
| Rare | Quiet, Arrogant |
| Excluded | Curious |

#### SANCTIONED
| Weight | Personalities |
|--------|--------------|
| High | Stoic, Quiet, Haunted, Bitter |
| Medium | Disciplined, Cautious, Arrogant |
| Low | Zealous, Ruthless, Pragmatic |
| Rare | Compassionate, Sardonic |
| Excluded | Loyal, Aggressive |

#### ARTIFICER
| Weight | Personalities |
|--------|--------------|
| High | Curious, Pragmatic, Cautious, Quiet |
| Medium | Sardonic, Stoic, Disciplined |
| Low | Loyal, Compassionate, Haunted |
| Rare | Bitter, Arrogant, Ambitious |
| Excluded | Aggressive, Zealous |

#### CORPSMAN
| Weight | Personalities |
|--------|--------------|
| High | Stoic, Compassionate, Pragmatic, Haunted |
| Medium | Disciplined, Loyal, Sardonic, Bitter |
| Low | Cautious, Quiet |
| Rare | Curious, Aggressive, Ambitious |
| Excluded | Ruthless, Arrogant |

#### DEMOTECH
| Weight | Personalities |
|--------|--------------|
| High | Stoic, Disciplined, Pragmatic, Cautious |
| Medium | Sardonic, Quiet, Aggressive, Loyal |
| Low | Bitter, Haunted, Arrogant, Ambitious |
| Rare | Compassionate, Ruthless |
| Excluded | Curious |

#### INFILTRATOR
| Weight | Personalities |
|--------|--------------|
| High | Quiet, Arrogant, Pragmatic, Ruthless |
| Medium | Cautious, Sardonic, Stoic, Curious |
| Low | Disciplined, Haunted, Bitter, Ambitious |
| Rare | Compassionate |
| Excluded | Zealous, Loyal, Aggressive |

#### PREFECT (Promotion Override)
Regardless of original Role weighting, Prefect candidates are disproportionately drawn from:
| Weight | Personalities |
|--------|--------------|
| High | Disciplined, Zealous, Pragmatic, Stoic, Ambitious |
| Medium | Ruthless, Aggressive, Loyal, Arrogant |
| Low | All others not excluded |

**Schola-born Override:** Schola-born characters have Zealous, Disciplined, and Ambitious forced to HIGH weight regardless of Role weighting.

### Personality Effects on Autonomous Squad Behavior

Personality drives how squads behave when deployed without direct player control. The player assembles the team and gives objectives; the squad's composition determines approach and outcomes.

#### Combat Behavior
| Personality | Combat Tendency |
|-------------|----------------|
| Aggressive | Pushes forward, takes risks, high damage output, takes more casualties |
| Cautious | Holds position, uses cover, fewer casualties, slower progress |
| Stoic | Holds the line. Less likely to break or rout. Steady but uninspired. |
| Zealous | Fights with intensity, resistant to morale failure, may pursue past tactical sense, reluctant to retreat |
| Disciplined | Follows the plan precisely. Effective when plan is good, vulnerable when conditions change. |
| Ruthless | Efficient, no hesitation on lethal force, may execute prisoners or ignore wounded squadmates |
| Loyal | Prioritizes squadmate survival. Will break position to rescue downed teammate. |
| Compassionate | Hesitates against non-combatant targets. May hold fire in ambiguous situations. |
| Haunted | Unpredictable under extreme stress. Certain triggers cause performance to spike or collapse. |
| Ambitious | Takes the flashy shot over the tactically sound one. Pushes for visible victories. |

#### Investigation Behavior
| Personality | Investigation Tendency |
|-------------|----------------------|
| Curious | Follows tangential leads, discovers more but may stray from mission parameters |
| Pragmatic | Efficient, focused on objectives, may miss broader context |
| Quiet | Observational, patient, lets situations develop before acting |
| Cautious | Thorough but slow, recommends pulling out at first sign of danger |
| Zealous | Interprets everything through doctrinal lens, escalates through ideology |
| Ruthless | Interrogates aggressively, gets results fast but damages sources |
| Compassionate | Builds rapport with civilians, gathers cooperative intelligence but may sympathize with targets |
| Ambitious | Focuses on what looks best in reports, may take credit or exaggerate findings |

#### Squad Friction — Negative Combinations
| Combination | Effect |
|-------------|--------|
| Aggressive + Cautious | Constant tension over approach. Slower decisions, internal disagreements. |
| Zealous + Curious | Dangerous. Zealous member may report Curious one for asking forbidden questions. |
| Arrogant + Loyal | Arrogant member takes unnecessary risks; Loyal member follows them in. |
| Sardonic + Zealous | Morale erosion. Sardonic member undermines Zealous intensity, creating resentment. |
| Ambitious + Ambitious | Competition for recognition. Both prioritize personal achievement over squad. |
| Ruthless + Compassionate | Direct conflict over methods. Operational paralysis or one overriding the other. |

#### Squad Synergy — Positive Combinations
| Combination | Effect |
|-------------|--------|
| Disciplined + Pragmatic | Orders followed and adapted intelligently. Clean operations. |
| Quiet + Cautious | Patient, observational, thorough. Ideal for investigation. |
| Loyal + Compassionate | High cohesion, strong morale. Potentially soft on enforcement. |
| Stoic + Ruthless | Grim efficiency. Job done, no complaints, no questions about methods. |
| Pragmatic + Ambitious | Results-oriented. Effective as long as interests align with mission. |
| Stoic + Disciplined | Reliable, unshakable. No surprises, no drama. |

### The Artificer's Report Filter

The Artificer communicates mission updates to the player. Their personality filters what and how the player receives information:

| Artificer Personality | Report Style |
|----------------------|--------------|
| Pragmatic | Facts and outcomes. Clean, efficient reports. |
| Curious | Includes details about anomalies and tangential observations. May provide intelligence the mission didn't call for. |
| Cautious | Flags risks prominently. Recommends withdrawal frequently. |
| Sardonic | Delivers bad news with dry commentary. Accurate but editorialized. |
| Quiet | Terse, minimal reports. Only essential information. May under-report developing situations. |
| Disciplined | Structured, formal reports following exact protocol. Complete but rigid. |

---

## LAYER 7: GEAR LOADOUT

### Standard Issue — All Agents

Every Council agent regardless of role carries:

| Item | Description |
|------|-------------|
| **Thorn Sidearm** | Standard-issue pistol. Compact, reliable. Last line of defense. |
| **Ashmark Combat Knife** | Utility blade and last-resort weapon. |
| **Meridian Helmet** | Integrated short-range comms and basic HUD showing squad positions and vitals. |
| **Suture Kit** | Personal medikit. Bandages, coagulant patch, single stimulant injector. |
| **Dusk Lamp** | Field illumination. Mag-mounted or handheld. |
| **Field Rations** | Council-issue sustenance. Functional, not pleasant. |

### Role-Specific Loadouts

#### VETERAN INFANTRY
| Item | Description |
|------|-------------|
| **Forge Plate Armor** | Full set: Head, Body, LARM, RARM, LLEG, RLEG. Mass-produced stamped alloy. |
| **Vex-9 Assault Rifle** | Primary weapon. Reliable, accurate, standard issue. |
| **Pyre Grenades (x2)** | Fragmentation. |
| **Veil Grenades (x1)** | Smoke concealment. |

**Alternate Loadout Options (selected at deployment):**
- Hound LMG (replaces Vex-9, adds suppression capability)
- Mauler HMG (replaces Vex-9, requires bracing or exceptional Strength)
- Vigil Marksman Rifle (replaces Vex-9, long-range precision)
- Reaver Shotgun (replaces Vex-9, close-quarters)

#### SANCTIONED
| Item | Description |
|------|-------------|
| **Forge Plate Armor (Light)** | Reduced set: Head, Body only. Mobility prioritized. |
| **Council Focus Apparatus** | Psionic channeling device — gauntlet or rod. Monitors output. Crude but functional. |
| **Limiter Device** | Worn on body (collar, bracelet, or cranial band). Allows squad leader or Senior Overseer to suppress abilities. |
| **Blood Vial** | Condensed sanctioned blood for field psionic screening. |
| **Thorn Sidearm** | Backup weapon. The Council does not trust them to rely solely on abilities. |

#### ARTIFICER
| Item | Description |
|------|-------------|
| **Shade Vest** | Light torso armor. Mobility for technical work. |
| **Diagnostic Array** | Portable tools for interfacing with cogitator systems and Council tech. |
| **Repair Kit** | Irreplaceable pre-war components, hoarded and rationed. |
| **Salvaged Cogitator Fragment** | Non-Sparked processing unit used as field computer. |
| **High-Power Encrypted Comms Array** | Squad's link to the Justicar. Highest-level Council encryption. |
| **Vex-9C Carbine** | Compact weapon. Not a primary combatant. |

#### CORPSMAN
| Item | Description |
|------|-------------|
| **Forge Plate Armor** | Full set. Former infantry, expects to be in the fight. |
| **Field Trauma Kit** | Surgical tools, coagulants, bone-setting splints, pain suppressors. |
| **Stimulant Suite** | Combat-grade injectors. Push wounded agents past pain and shock. Dangerous with repeated use. |
| **Diagnostic Scanner** | Handheld vitals reader. Old tech, sometimes unreliable. |
| **Vex-9C Carbine** | Compact primary. Needs hands free for medical work. |

#### DEMOTECH
| Item | Description |
|------|-------------|
| **Forge Plate Armor (Heavy)** | Reinforced set with blast protection. Works close to explosions. |
| **Breaching Charges** | Various configurations — door, wall, shaped charges. |
| **Blast Kit** | Detonators, fuses, remote triggers. |
| **Heavy Cutting Tools** | For when explosives are not appropriate. |
| **Structural Scanner** | Reads load-bearing points and material density. |
| **Reaver Shotgun** | Close-quarters primary. Often first through the breach. |
| **Pyre Grenades (x3)** | Extra frag allocation. |

#### INFILTRATOR
| Item | Description |
|------|-------------|
| **Shade Vest** | Light torso armor, concealable. |
| **Cover Kit** | False identity documents, appearance alteration tools, forged credentials. |
| **Bypass Suite** | Compact tools for defeating locks, alarms, security systems. |
| **Covert Communicator** | Short-range, encrypted, hard to detect. |
| **Surveillance Package** | Miniaturized recording and observation devices. Plantable. |
| **Spectra Scanner** | Handheld sensor for life signs and movement. |
| **Vex-9C Carbine** | Compact, concealable configuration. |
| **Lull Grenades (x2)** | Flashbang for disorientation and escape. |

---

## LAYER 8: CHARACTER DETAILS

### Visual Traits

Rolled from Origin-weighted tables. Each character receives 1–2 visual traits.

| Origin | Common Visual Traits |
|--------|---------------------|
| Hive-born | Facial scarring, chemical burns, industrial tattoos, missing teeth, calloused hands, smog-stained skin |
| Void-born | Elongated fingers, light-sensitive eyes, faint blue veins visible through pale skin, zero-G posture (slightly hunched in full gravity) |
| Frontier-born | Weather-beaten skin, calloused hands, animal-bite scarring, sun damage, wind-chapped features |
| Schola-born | Institutional brand or tattoo (Schola mark), shaved or close-cropped hair, rigid posture, uniform grooming |
| Noble-born | Manicured appearance, subtle gene-seed enhancement, clear skin, well-maintained teeth, slight perfume or grooming products |
| Militarum-born | Unit tattoos, training scars, cropped hair, tan lines from armor wear, cauliflower ears |
| Outcast | Missing digit, penal brand, gang tattoos, malnutrition markers, improvised piercings, knife scars |

### Charms and Trinkets

Every character carries one personal item that survived their journey into Council service. Rolled from Origin-weighted table.

| Origin | Example Charms/Trinkets |
|--------|------------------------|
| Hive-born | Corroded factory token, bent gear cog on a cord, scrap of cloth from a dead sibling's clothing, spent shell casing from first gang fight |
| Void-born | Void-crystal pendant, fragment of station hull plating, star chart etched on metal, pressurized air capsule from birth-station |
| Frontier-born | Predator tooth necklace, carved wooden figure, seed pouch from homestead, polished river stone, tanned leather cord |
| Schola-born | Prayer coin stamped with Schola seal, worn copy of Council catechism, braided wristband from a Schola-mate who did not graduate, merit badge |
| Noble-born | Signet ring bearing family crest (worn hidden on duty), miniature portrait of a family member, silver chain of office, monogrammed handkerchief |
| Militarum-born | Shell casing from first engagement, dog tags of a fallen parent, regimental badge, worn holo-pic of family in uniform |
| Outcast | Stolen data chip they have never been able to read, shiv they refuse to throw away, faded tattoo ink vial, luck charm made from scavenged wire |

### Quirks and Habits

Small behavioral details that make characters feel individual. Each character receives one.

**Universal Quirk Table (not Origin-weighted):**

1. Taps sidearm holster when nervous
2. Hums under their breath before combat
3. Never eats in front of others
4. Sleeps with boots on
5. Writes letters they never send
6. Counts rounds obsessively
7. Talks to their weapon
8. Chews something constantly (ration stick, stim tab, leather strip)
9. Cleans their weapon at every opportunity, even when already clean
10. Refuses to use anyone else's equipment
11. Always checks exits first when entering a room
12. Cracks knuckles before making decisions
13. Stares at the sky whenever outdoors, as if seeing it for the first time
14. Keeps a running tally of something (kills, days deployed, meals missed) scratched into armor
15. Whistles the same three-note phrase repeatedly
16. Touches their charm/trinket before every engagement
17. Speaks to the dead — mutters names of fallen squadmates under their breath
18. Avoids mirrors and reflective surfaces
19. Always volunteers for first watch
20. Memorizes the full name of every person they kill

---

## COMPLETE ROLE REFERENCE

### Summary Table

| Role | Primary Function | Defining Stats | Squad Value |
|------|-----------------|----------------|-------------|
| Veteran Infantry | Core combat | STR, TGH, WIL | Backbone. Damage dealing and damage taking. |
| Sanctioned | Psionic operations | WIL, PSY, PER | Aetheric capability. Screening, psionic combat, detection. |
| Artificer | Tech maintenance, comms | INT, PER, AGI | Keeps tech running. Squad's comms lifeline to command. |
| Corpsman | Field medicine | TGH, WIL, PER, INT | Keeps squad alive. Triage and battlefield surgery. |
| Demotech | Demolitions, breaching | TGH, STR, PER, INT | Breaks obstacles. Structural analysis. Heavy combat. |
| Infiltrator | Recon, infiltration | PER, AGI, INT, WIL | Intelligence gathering. Operates ahead or inside. Elite but difficult to integrate. |
| Prefect (promotion) | Squad leadership | +WIL, +LDR | Command authority. Council's doctrinal presence. Carries the Seal. |

---

## COMPLETE WEAPON AND GEAR REFERENCE

### Weapons

| Weapon | Type | Notes |
|--------|------|-------|
| **Vex-9 Assault Rifle** | Assault Rifle | Standard workhorse. Reliable, accurate. Named for Vexar Foundries, ninth production iteration. |
| **Vex-9C Carbine** | Carbine | Compact variant. Shorter barrel, lighter frame. Designated C for close-pattern. |
| **Hound LMG** | Light Machine Gun | Squad automatic weapon. Belt-fed, bipod-mounted. Sustained suppressive fire. |
| **Mauler HMG** | Heavy Machine Gun | Tripod-mounted or braced. Shreds light vehicles and fortifications. Requires setup or exceptional Strength. |
| **Thorn Sidearm** | Pistol | Standard-issue. Compact, reliable. Every agent carries one. |
| **Reaver Shotgun** | Shotgun | Close-quarters. Pump-action. Various shell types: standard shot, breaching slugs, less-lethal. |
| **Vigil Marksman Rifle** | Marksman Rifle | Precision weapon with integrated optics. Semi-automatic, extended range. |
| **Ashmark Combat Knife** | Melee/Utility | Standard blade. Named for the tradition of carbon-scoring kill marks on the handle. |
| **Stun Baton** | Non-lethal Melee | For taking targets alive and crowd control. |

### Grenades

| Grenade | Type | Notes |
|---------|------|-------|
| **Pyre Grenade** | Fragmentation | Named for what remains after detonation in enclosed spaces. |
| **Lull Grenade** | Flashbang | Forces a moment of stillness before the squad moves in. Darkly ironic name. |
| **Veil Grenade** | Smoke | Concealment. Simple, descriptive. |

### Armor

| Armor | Coverage | Notes |
|-------|----------|-------|
| **Forge Plate** | Head, Body, LARM, RARM, LLEG, RLEG | Full armor system. Mass-produced stamped alloy composite. Heavy, utilitarian. |
| **Forge Plate (Heavy)** | As above, reinforced | Demotech variant with additional blast protection. |
| **Forge Plate (Light)** | Head, Body only | Sanctioned variant. Reduced for mobility. |
| **Shade Vest** | Torso only | Light flak alternative. Worn under clothing. Used by Infiltrators and Artificers. |
| **Meridian Helmet** | Head | Standard issue. Integrated short-range comms and basic HUD. Named for the meridian lines of the Twelve Hours. |

### Field Equipment

| Equipment | Notes |
|-----------|-------|
| **Spectra Scanner** | Handheld sensor. Life signs, energy, movement. Unreliable past 50m. |
| **Halcyon Rebreather** | Atmospheric protection. Name bitterly ironic among users. |
| **Suture Kit** | Personal medikit. Bandages, coagulant, single stimulant injector. |
| **Tether Line** | Synthetic cord with magnetic grapple. Simple, reliable. |
| **Lockstep Restraints** | Mag-locked binders. Keyed to Prefect's Seal. |
| **Dusk Lamp** | Field illumination. For moving through dark places where lights died long ago. |
| **Field Rations** | Council-issue sustenance. Functional, not pleasant. |
| **Void Seal Kit** | Emergency patching for armor breaches in vacuum or hostile atmosphere. |

### Vehicles

| Vehicle | Type | Notes |
|---------|------|-------|
| **Bulwark APC** | Ground Transport | Armored personnel carrier. Ugly, loud, heavily armored. Moving wall between squad and threats. |
| **Strix Drop Shuttle** | Orbital-to-Surface | Rapid deployment craft. Named for a predatory bird. Lightly armed. |

---

## STAT SUMMARY TABLES

### Origin Stat Modifiers

| Origin | STR | TGH | AGI | PER | INT | WIL | LDR | PSY |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Hive-born | — | +5 | +5 | +5 | -5 | — | — | — |
| Void-born | -5 | -5 | +5 | +5 | +5 | — | — | — |
| Frontier-born | +5 | +5 | — | +5 | — | -5 | -5 | — |
| Schola-born | -5 | — | — | — | — | +10 | +5 | — |
| Noble-born | -5 | -5 | — | — | +5 | — | +10 | — |
| Militarum-born | +5 | +5 | — | — | -5 | +5 | +5 | — |
| Outcast | — | — | +10 | +5 | — | -5 | -10 | — |

### Role Stat Bases

| Role | STR | TGH | AGI | PER | INT | WIL | LDR | PSY |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Vet. Infantry | 30 | 30 | 20 | 30 | 20 | 35 | 30 | 0 |
| Sanctioned | 20 | 25 | 20 | 30 | 25 | 40 | 5 | 20 |
| Artificer | 20 | 25 | 25 | 30 | 40 | 25 | 10 | 0 |
| Corpsman | 25 | 30 | 25 | 30 | 30 | 35 | 15 | 0 |
| Demotech | 30 | 35 | 20 | 30 | 30 | 30 | 10 | 0 |
| Infiltrator | 20 | 20 | 35 | 40 | 35 | 30 | 5 | 0 |

All stats use the formula: **Base + 2D10** (PSY uses **Base + D10**)

### Prefect Promotion Modifiers

| Stat | Modifier |
|------|----------|
| Willpower | +5 |
| Leadership | +10 |

Applied on top of existing Role and Origin stats.

---

*End of Character Generation System — Version 1.0*
*Companion to: LORE_BIBLE.md*
*Last updated: March 2026*
