# COMBAT RULES IMPLEMENTATION PROMPT
## Project: The Twelve Hours — Battle System
## Version: 1.0 — March 2026
## Companion Documents: CHARACTER_GENERATION.md · LORE_BIBLE.md · GAMEPLAY_IMPLEMENTATION_PROMPT.md

---

## PURPOSE

This document defines the complete combat rules to be implemented in the battle system. It covers three interconnected systems established in design sessions: the **Action Economy**, the **Grapple & Wrestling System**, and **Grenade Rules**. All stat references are to final character stats after Origin and Role modifiers have been applied per `CHARACTER_GENERATION.md`.

Implement these systems as modular, testable logic components. Each system should be independently callable so that the overworld system defined in `GAMEPLAY_IMPLEMENTATION_PROMPT.md` can invoke battle resolution cleanly.

---

## PART 1 — ACTION ECONOMY

### 1.1 Turn Structure

Each character turn consists of:

- **1 free Move action** — always available, costs no action slots
- **2 Half Action slots** — may be spent individually or combined

A character may alternatively spend both Half Action slots on **1 Full Action**.

```
TURN = FREE_MOVE + (HALF_ACTION + HALF_ACTION)
     = FREE_MOVE + FULL_ACTION
```

**Initiative order:** Roll `AGI + PER` for each character at the start of combat. Highest result acts first. Re-roll ties.

---

### 1.2 Movement

Movement is **always free**. Every character may move up to their base movement distance each turn regardless of what actions they spend.

- Base movement distance is derived from AGI. Define a movement curve: `base_move_tiles = floor(AGI / 10)` — adjust this value during playtesting.
- Some actions carry a `cannot_move_this_turn` flag. If a character has used such an action, movement is locked for the remainder of that turn.
- **Sprint** (Full Action) allows movement of double base distance but locks all attack actions.

---

### 1.3 Full Actions

Full Actions consume both Half Action slots. The character may still use their free Move unless the action sets `blocks_movement = true`.

| Action | blocks_movement | Notes |
|---|---|---|
| `FULL_AUTO_FIRE` | true | Cannot move same turn. Requires weapon with auto capability. Applies recoil penalty unless `BRACED = true`. |
| `AIMED_SHOT` | true | Accuracy bonus scaled to PER: `aimed_bonus = floor(PER / 10)`. May target specific hit locations if bonus >= 3. |
| `CHARGE` | false | Combines full move distance with a melee strike. Damage bonus on hit. Cannot use ranged weapons during charge. |
| `OVERWATCH` | true | Designates a kill zone. Triggers a reaction shot when an enemy enters the zone before next turn. Reaction shot check: `AGI vs target AGI` — if attacker wins, fires before target action resolves. |
| `SPRINT` | false | Double base move distance. Blocks all attack actions. Sets `sprinting = true` flag. |

---

### 1.4 Half Actions

Half Actions can be taken once per turn (spending one slot) or combined as two in a single turn.

#### Ranged Attack Actions

**SINGLE_SHOT**
- Standard ranged attack. Consumes 1 Half Action slot.
- May be taken twice in one turn as a **double-tap**. Double-tap rules:
  - Both shots must target the **same enemy**. Splitting targets removes the bonus and treats them as two independent single shots.
  - Second shot receives a flat **+10 accuracy bonus** (follow-through — character does not re-acquire the target).
  - If the character moved this turn, apply on-the-move single shot penalty to **both** shots (proficiency and AGI table applies — see Part 2).
  - Second shot bonus is applied **after** movement penalty.

**BURST_FIRE**
- Short controlled burst. Better damage profile and hit chance than single shot.
- Consumes 1 Half Action slot.
- If the character moved this turn, apply the on-the-move burst fire penalty (see Part 2 — AGI & Proficiency table).

#### Support Actions

**BRACE**
- Consumes 1 Half Action slot.
- Sets `character.braced = true`.
- Effect: negates full auto recoil penalty on `FULL_AUTO_FIRE`. Required to fire Mauler HMG without meeting STR threshold (STR < 50).
- Persists until the character moves. Clears `braced = false` on any movement, including free move.
- Can be set on a prior turn and carried forward as long as the character has not moved.

**PREPARE_GRENADE**
- Consumes 1 Half Action slot.
- Sets `character.grenade_primed = true` and `character.grenade_prime_turn = current_turn`.
- Must be followed by `THROW_GRENADE` on the current turn or the following turn.
- If `current_turn > grenade_prime_turn + 1` and `grenade_primed == true`: grenade detonates in hand. Apply blast to the character and adjacent tiles. Clear `grenade_primed`.

**THROW_GRENADE**
- Consumes 1 Half Action slot.
- Requires `character.grenade_primed == true`.
- Full resolution defined in Part 3 — Grenade Rules.

#### Utility Actions

| Action | Slots | Notes |
|---|---|---|
| `MELEE_STRIKE` | 1 | Standard close-quarters attack. Can be taken twice (two strikes) by spending both Half Action slots. |
| `SWITCH_WEAPON` | 1 | Holster current weapon, draw another from loadout. Updates `character.active_weapon`. |
| `RELOAD` | 1 | Standard reload — swap magazine or feed belt. Emergency reload under fire: Full Action cost. |
| `TAKE_COVER` | 1 | Sets `character.in_cover = true`. Activates cover defence bonus. Clears on movement or `STAND`. |
| `STAND_OR_PRONE` | 1 | Toggle `character.prone`. Prone grants ranged defence bonus. Rising from prone costs 1 Half Action slot. |
| `USE_ITEM` | 1 | Consume an item from loadout (stimulant injector, suture kit, equipment activation). |
| `INITIATE_GRAPPLE` | 1 | Attempt to grab target in melee range. Begins grapple resolution (see Part 4). |

---

### 1.5 Free Actions

Free actions cost no action slots and may be taken at any point during the character's turn.

| Action | Notes |
|---|---|
| `MOVE` | Up to base movement distance. Always available unless `blocks_movement = true` from a used action. |
| `SPEAK` | Short in-combat communication. No mechanical effect. Narrative layer only. |
| `DROP_ITEM` | Release a held item. No cost. |
| `PASSIVE_PERCEPTION` | Automatic PER check each turn. Detects threats within detection range. No action required. |

---

## PART 2 — AGI & WEAPON PROFICIENCY

### 2.1 System Overview

Two gates must both be satisfied to reduce on-the-move firing penalties:

1. **Proficiency gate:** The character's role must have a proficiency tag matching the active weapon's category tag.
2. **AGI gate:** The character's AGI must meet the threshold for the relevant penalty tier.

If either gate fails, the non-proficient column applies regardless of AGI value.

---

### 2.2 Role Proficiency Tags

```
VETERAN_INFANTRY  → [RIFLE, PISTOL, LMG]
INFILTRATOR       → [PISTOL, CARBINE, RIFLE]
CORPSMAN          → [PISTOL, CARBINE]
DEMOTECH          → [SHOTGUN, PISTOL]
ARTIFICER         → [PISTOL]
SANCTIONED        → [PISTOL]
```

Prefect promotion does not modify proficiency tags. Prefect retains the proficiency of their base role.

---

### 2.3 Weapon Category Tags

```
Vex-9 Assault Rifle    → RIFLE
Vex-9C Carbine         → CARBINE
Hound LMG              → LMG
Mauler HMG             → HMG        (special rules — see 2.5)
Thorn Sidearm          → PISTOL
Reaver Shotgun         → SHOTGUN
Vigil Marksman Rifle   → RIFLE      (special rules — see 2.6)
Ashmark Combat Knife   → MELEE      (not subject to ranged proficiency)
Stun Baton             → MELEE
```

---

### 2.4 Burst Fire On-The-Move Penalty Table

```
function get_burst_move_penalty(agi, has_matching_proficiency):

  if has_matching_proficiency:
    if agi < 30:  return -20
    if agi < 45:  return -10    # 30–44
    return 0                    # 45+

  else:  # no proficiency match
    if agi < 30:  return -20
    if agi < 45:  return -15    # 30–44
    if agi < 55:  return -10    # 45–54
    return -5                   # 55+
```

Wait — the proficiency column at AGI below 30 is −10 (not −20). Correct table:

```
function get_burst_move_penalty(agi, has_matching_proficiency):

  if has_matching_proficiency:
    if agi < 30:  return -10
    if agi < 45:  return -5     # 30–44
    return 0                    # 45+

  else:
    if agi < 30:  return -20
    if agi < 45:  return -15    # 30–44
    if agi < 55:  return -10    # 45–54
    return -5                   # 55+
```

---

### 2.5 Mauler HMG — Special Rules

- **No proficiency tag exists for HMG.** Movement penalties cannot be reduced by any role or AGI value.
- **Full auto + movement is always blocked** (as with all weapons).
- **Firing without brace:**
  - Default: requires `character.braced = true` to fire at all.
  - Exception: Veteran Infantry with `STR >= 50` may fire the Mauler HMG without bracing, but takes the full unbraced recoil penalty. No reduction pathway exists.
  - Implement check: `if role == VETERAN_INFANTRY and STR >= 50: allow_unbraced_hmg = true`

---

### 2.6 Vigil Marksman Rifle — Special Rules

- **Cannot fire on the move under any circumstances.**
- No AGI value and no proficiency tag removes this restriction.
- The Vigil sets `requires_stationary = true`. If `character.moved_this_turn == true`, firing the Vigil is blocked.
- Must be used from standing, crouched, or prone with no movement that turn.

---

### 2.7 Double-Tap Rules (Full Implementation)

```
function resolve_double_tap(attacker, target, moved_this_turn):

  # Shot 1 — standard single shot
  shot1_accuracy = attacker.base_accuracy
  if moved_this_turn:
    shot1_accuracy += get_single_shot_move_penalty(attacker.agi, attacker.has_proficiency(active_weapon))
  resolve_shot(attacker, target, shot1_accuracy)

  # Shot 2 — follow-through bonus, same target mandatory
  shot2_accuracy = attacker.base_accuracy + 10   # flat bonus
  if moved_this_turn:
    move_penalty = get_single_shot_move_penalty(attacker.agi, attacker.has_proficiency(active_weapon))
    shot2_accuracy += move_penalty               # penalty applied first, then +10
  resolve_shot(attacker, target, shot2_accuracy)
```

Note: `get_single_shot_move_penalty` uses the same proficiency + AGI table as burst fire. Define it identically or share the lookup function with a `mode` parameter.

If the player attempts to double-tap against two different targets: treat as two independent single shots. Do not apply the +10 bonus. Do not display the double-tap UI affordance.

---

## PART 3 — GRENADE RULES

### 3.1 Sequence

Grenades require two Half Action slots — Prepare and Throw — which may be split across two turns.

```
Turn N:   PREPARE_GRENADE (Half Action)  →  character.grenade_primed = true
Turn N:   THROW_GRENADE   (Half Action)  →  resolve immediately
  OR
Turn N+1: THROW_GRENADE   (Half Action)  →  resolve
  OR
Turn N+1: No throw — DETONATE IN HAND   →  blast character's tile, apply to self and adjacents
```

**Detonate-in-hand trigger:** At the start of the character's turn, if `grenade_primed == true` and `current_turn > grenade_prime_turn + 1`, force detonation before the character may act. Apply blast to the character's current tile. This is not a player-controlled action.

---

### 3.2 Range — STR

Grenade throw range is governed by STR. Define a range table or formula during implementation — suggested baseline: `max_range_tiles = floor(STR / 10)`.

If the declared target tile exceeds the character's STR range: apply an automatic **−20** to the PER accuracy roll. The throw is still attempted.

---

### 3.3 Accuracy — PER Roll

```
function resolve_grenade_throw(attacker, target_tile):

  roll = d100()
  per = attacker.PER

  if roll >= 91:                          # Fumble — 91–00
    scatter_tiles = d4() + 2              # 3–6 tiles
    scatter_dir   = d8_compass()
    landing_tile  = offset(target_tile, scatter_dir, scatter_tiles)
    flag_danger_to_thrower_and_allies(landing_tile, blast_radius)
    return detonate(landing_tile)

  if roll > per:                          # Failure (non-fumble)
    scatter_tiles = d6()
    scatter_dir   = d8_compass()
    landing_tile  = offset(target_tile, scatter_dir, scatter_tiles)
    return detonate(landing_tile)

  # Success
  degrees = floor((per - roll) / 10)

  if degrees >= 1:                        # One or more degrees of success
    landing_tile = target_tile            # Exact tile
  else:                                   # Basic success
    landing_tile = random_adjacent(target_tile)   # Within 1 tile

  return detonate(landing_tile)
```

---

### 3.4 Scatter Direction

D8 compass rose — map each face to a grid direction:

```
1 = North
2 = Northeast
3 = East
4 = Southeast
5 = South
6 = Southwest
7 = West
8 = Northwest
```

---

### 3.5 Fumble Zone (91–00)

- Scatter distance: `d4() + 2` tiles (range: 3–6).
- Random direction via D8.
- After resolving landing tile: check if the thrower or any allied characters fall within the blast radius. Apply blast damage to any characters in radius regardless of faction.
- Surface this prominently in the UI — fumble is a significant threat.

---

## PART 4 — GRAPPLE & WRESTLING SYSTEM

### 4.1 Initiating a Grapple

Grapple is initiated via the `INITIATE_GRAPPLE` Half Action. The initiating character must be within melee range of the target.

**Charge Phase** — if the initiating character moves to close distance during the same turn:

```
function resolve_charge_phase(initiator, defender):
  initiator_roll = initiator.AGI + d10()
  defender_roll  = defender.PER + d10()

  if defender_roll > initiator_roll:
    # Defender reacts — opportunity action before contact
    # Defender may fire a burst, strike, or throw an object
    resolve_opportunity_action(defender, initiator)

  elif initiator_roll == defender_roll:
    # Messy contact — both take -2 to first Grapple Roll
    apply_flag(initiator, 'messy_contact')
    apply_flag(defender,  'messy_contact')

  # Grapple begins regardless of charge outcome
  begin_grapple(initiator, defender)
```

---

### 4.2 Grapple Check

Every turn of an active grapple, both characters make an opposed Grapple Roll.

```
function grapple_roll(character):
  base = floor((character.STR + character.AGI) / 2)
  role_mod = get_role_grapple_modifier(character.role)
  weapon_pen = get_weapon_grapple_penalty(character.active_weapon)
  messy_mod = -2 if character.has_flag('messy_contact') else 0
  return base + role_mod + weapon_pen + messy_mod + d10()
```

**Role grapple modifiers:**

```
VETERAN_INFANTRY  → +10
DEMOTECH          → +8
CORPSMAN          → +5
INFILTRATOR       → +5
ARTIFICER         → +0
SANCTIONED        → -5
```

**Weapon grapple penalties:**

```
Mauler HMG              → -15
Vigil Marksman Rifle    → -12
Vex-9 Assault Rifle     → -10
Reaver Shotgun          → -8
Vex-9C Carbine          → -5
Thorn Sidearm           → +0
Ashmark Combat Knife    → +2
Stun Baton              → +3
```

---

### 4.3 Dominance Meter

Dominance is a shared integer track from **−5 to +5**. Positive values favour the Initiator; negative values favour the Defender. Both start at 0.

```
function resolve_grapple_turn(initiator, defender):
  i_roll = grapple_roll(initiator)
  d_roll = grapple_roll(defender)
  margin = abs(i_roll - d_roll)
  winner = initiator if i_roll > d_roll else defender

  if margin == 0:
    dominance_change = 0          # Stalemate
  elif margin <= 5:
    dominance_change = 1
  elif margin <= 10:
    dominance_change = 2
  else:
    dominance_change = 3

  if winner == initiator:
    dominance = min(dominance + dominance_change, 5)
  else:
    dominance = max(dominance - dominance_change, -5)
```

**Dominance action thresholds** — actions available only to the controlling party at or above the threshold:

```
±1  → Shove, reposition, light unarmed strike
±2  → Weapon grab attempt, pin attempt, headbutt
±3  → Disarm, choke, joint lock
±4  → Throw, clean break, execute takedown
±5  → Submission, knock unconscious, execution
```

Only the character whose side dominance favours may use these options. The opponent may only defend or attempt a break.

---

### 4.4 Stamina

Grappling drains Stamina. Calculate the Stamina Pool from final character stats:

```
stamina_pool = max(floor((character.TGH + character.WIL) / 10), 3)
```

Each turn of active grapple: `character.grapple_stamina -= 1`.

**Stamina state effects:**

```
stamina >= 1  →  No penalty
stamina == 0  →  -5 to all Grapple Rolls. Cannot attempt actions above ±2 Dominance.
stamina < 0   →  Automatic stalemate each turn (dominance_change = 0 regardless of roll).
```

---

### 4.5 Reaching for the Sidearm

A character may attempt to draw their Thorn Sidearm during a grapple. This is a **Reach Action**.

**Declaring a Reach Action:**

1. Character declares before rolling.
2. That turn, they **defend only** — use half their Grapple Roll (rounded down) instead of full.
3. Resolve a Reach Check:

```
function resolve_reach_action(grappler, opponent):
  reach_roll     = grappler.AGI + d10()
  opponent_roll  = grapple_roll(opponent)   # opponent rolls full
  margin         = reach_roll - opponent_roll

  if margin >= 6:
    # Clean draw — sidearm in hand
    grappler.active_weapon = THORN_SIDEARM
    grappler.can_fire_next_turn = true      # Point-blank, no range penalty
    return CLEAN_DRAW

  elif margin >= 1:
    # Contested draw — both hands on the Thorn
    # Resolve as STR vs STR sub-contest next turn
    return CONTESTED_DRAW

  elif margin == 0:
    # Failed reach
    dominance -= 1
    return FAILED

  elif margin >= -5:
    # Arm grabbed
    dominance -= 2
    return ARM_GRABBED

  else:  # margin <= -6
    # Exposed — light hit and dominance loss
    dominance -= 3
    resolve_light_unarmed_hit(opponent, grappler)
    return EXPOSED
```

---

### 4.6 Breaking the Grapple

Either character may attempt to break free instead of contesting for Dominance. A Break attempt replaces the character's Grapple Roll for that turn.

```
function resolve_break_attempt(breaker, holder):
  break_roll  = breaker.AGI + d10()
  hold_roll   = holder.STR + d10()

  if breaker.role == INFILTRATOR:
    break_roll += 10    # Infiltrator break bonus

  if break_roll > hold_roll:
    end_grapple()
    stagger_both_characters()    # Both move 1 tile back, outside grapple range
    return BREAK_SUCCESS

  else:
    dominance_shift(-1, against=breaker)   # Breaker loses 1 Dominance
    # Holder may immediately attempt throw or pin (±4 threshold check)
    return BREAK_FAILURE
```

---

### 4.7 Multi-Character Grapples (2v1)

When a third character joins an active grapple on one side:

```
function two_vs_one_grapple_roll(char_a, char_b):
  roll_a = grapple_roll(char_a)
  roll_b = grapple_roll(char_b)
  higher = max(roll_a, roll_b)
  lower  = min(roll_a, roll_b)
  return higher + floor(lower / 2)
```

The solo character receives **+5** to their Grapple Roll (adrenaline response) but faces a structural disadvantage. At ±3 Dominance in a 2v1, the outnumbered character is considered pinned — cannot attempt any action above ±1 threshold.

A 4th character creates a 2v2: split into two 1v1 grapples between matched pairs. Prefect or highest-LDR character determines pairing if control is ambiguous.

---

### 4.8 Psionic Interaction — Sanctioned Characters

If a Sanctioned character's Limiter is breached or removed during a grapple, substitute their PSY Rating for the normal Grapple Roll that turn:

```
function psionic_grapple_roll(sanctioned):
  return sanctioned.PSY_RATING + d10()
```

**Psionic Grapple outcome table:**

```
Win by 1–5   →  Target shoved back. Grapple ends. Target staggered 1 turn.
Win by 6–10  →  Target flung away. Grapple ends. Target knocked prone.
Win by 11+   →  Target psychically gripped. Grapple ends. Target immobilised until Sanctioned releases or takes damage.
```

**Consequence:** Limiter breach is logged automatically. Transmit notification to Prefect and Senior Overseer. This occurs regardless of tactical outcome and cannot be suppressed.

---

## PART 5 — PERSONALITY SYSTEM INTEGRATION IN COMBAT

The personality system from `CHARACTER_GENERATION.md` governs autonomous character behaviour. Apply the following combat modifiers when characters act without direct player input.

### 5.1 Grapple Behaviour

| Personality | Autonomous Grapple Tendency |
|---|---|
| Aggressive | Initiates grapple if target is in range. +3 to first Grapple Roll (charge momentum). |
| Cautious | Prefers Break attempts. Sacrifices Dominance to create distance. |
| Ruthless | At ±3 Dominance or higher, always selects the most damaging action (choke, joint lock). Never uses restraint options. |
| Loyal | If a squadmate is being grappled, charges in — creates a 2v1. |
| Haunted | If grapple triggers a stress condition (GM/system defined), roll WIL or freeze 1 turn. Dominance frozen that turn. |
| Disciplined | Always selects tactically optimal action at each Dominance threshold. Never wastes an advantage. |
| Stoic | Holds a grapple position indefinitely. No morale penalty accumulation during grapple. Does not panic when losing. |

### 5.2 Ranged Combat Behaviour

| Personality | Combat Tendency |
|---|---|
| Aggressive | Pushes forward. Favours Full Auto and Burst over aimed fire. Higher risk tolerance. |
| Cautious | Holds position. Prefers Overwatch and Aimed Shot. Fewer casualties, slower progress. |
| Stoic | Holds the line. Less likely to rout. Steady but uninspired fire discipline. |
| Zealous | Fights with intensity. Resistant to morale failure. May pursue past tactical sense. Reluctant to fall back. |
| Disciplined | Follows plan precisely. Effective when plan is sound, vulnerable when conditions change. |
| Ruthless | Efficient. No hesitation on lethal options. May execute prisoners. May ignore wounded squadmates. |
| Loyal | Prioritises squadmate survival. Will break cover position to rescue a downed teammate. |
| Compassionate | Hesitates against non-combatant targets. May hold fire in ambiguous situations. |
| Haunted | Unpredictable under extreme stress. Certain triggers spike or collapse performance. |
| Ambitious | Takes the flashy shot over the tactically sound one. Pushes for visible victories. |

---

## PART 6 — IMPLEMENTATION NOTES & INTEGRATION REQUIREMENTS

### 6.1 State Flags Per Character

Track the following per-character state each turn:

```
character.braced               = bool    # Set by BRACE action, cleared on move
character.grenade_primed       = bool    # Set by PREPARE_GRENADE
character.grenade_prime_turn   = int     # Turn number when primed
character.in_cover             = bool    # Set by TAKE_COVER, cleared on move
character.prone                = bool    # Set/cleared by STAND_OR_PRONE
character.moved_this_turn      = bool    # Set on any movement, cleared at turn start
character.half_actions_spent   = int     # 0, 1, or 2 — reset at turn start
character.blocks_movement      = bool    # Set by FULL_AUTO, AIMED_SHOT, OVERWATCH
character.grapple_stamina      = int     # Current grapple stamina pool
character.in_grapple           = bool    # Active grapple state
character.grapple_partner      = ref     # Reference to grapple opponent
character.dominance            = int     # Grapple dominance (-5 to +5)
character.active_weapon        = ref     # Currently held weapon
character.sprinting            = bool    # Set by SPRINT action
```

### 6.2 Turn Resolution Order

```
1. Roll initiative (AGI + PER) — sort descending
2. For each character in initiative order:
   a. Reset turn-start flags (moved_this_turn, half_actions_spent, blocks_movement, sprinting)
   b. Check grenade detonation condition (see 3.1)
   c. Check grapple stamina state (see 4.4)
   d. Resolve passive perception check (free)
   e. Character takes actions (player-controlled or personality-driven)
   f. Resolve any triggered overwatch reactions
   g. Apply end-of-turn effects (stagger recovery, etc.)
3. Advance turn counter
```

### 6.3 Action Validation

Before processing any action, validate:

```
function validate_action(character, action):
  if action.is_full_action and character.half_actions_spent > 0:
    return INVALID  # Already spent a half action

  if action.is_half_action and character.half_actions_spent >= 2:
    return INVALID  # No slots remaining

  if action.blocks_movement and character.moved_this_turn:
    return INVALID  # Movement already used, action requires stationary

  if action == FULL_AUTO_FIRE and character.moved_this_turn:
    return INVALID  # Full auto never combines with movement

  if action == THROW_GRENADE and not character.grenade_primed:
    return INVALID  # Must prepare first

  if action requires weapon category X and character.active_weapon.category != X:
    return INVALID

  if character.active_weapon == VIGIL and character.moved_this_turn:
    if action in [SINGLE_SHOT, BURST_FIRE, AIMED_SHOT, FULL_AUTO_FIRE]:
      return INVALID  # Vigil cannot fire on the move

  return VALID
```

### 6.4 Connecting to the Overworld System

The battle system should expose the following to `GAMEPLAY_IMPLEMENTATION_PROMPT.md`:

- `start_battle(squad, enemies, terrain)` — initialise combat state
- `resolve_battle(auto=true)` — run full autonomous resolution using personality system
- `get_battle_result()` — returns `{outcome, casualties, wounds, ammo_spent, items_consumed}`
- `apply_post_battle_consequences(squad)` — wound persistence, morale changes, gear loss

Wound persistence rules (per `GAMEPLAY_IMPLEMENTATION_PROMPT.md`): injuries taken in battle persist to subsequent missions. Do not clear wound state on battle end.

---

## QUICK REFERENCE — CORE FORMULAS

```
Initiative          = AGI + PER + d10()
Grapple Roll        = floor((STR + AGI) / 2) + role_modifier + weapon_penalty + d10()
Stamina Pool        = max(floor((TGH + WIL) / 10), 3)
Aimed Shot Bonus    = floor(PER / 10)
Double-Tap Bonus    = +10 flat (second shot, same target only)
Grenade Range       = floor(STR / 10) tiles (baseline — tune during playtesting)
Base Move Distance  = floor(AGI / 10) tiles (baseline — tune during playtesting)

Break Check         = AGI + d10()  vs  opponent STR + d10()
Reach Check         = AGI + d10()  vs  opponent full Grapple Roll
2v1 Grapple         = higher_roll + floor(lower_roll / 2)
Psionic Grapple     = PSY_RATING + d10()  (Limiter breached only)
```

---

*End of Combat Rules Implementation Prompt — Version 1.0*
*Companion to: CHARACTER_GENERATION.md · LORE_BIBLE.md · GAMEPLAY_IMPLEMENTATION_PROMPT.md*
*Last updated: March 2026*
