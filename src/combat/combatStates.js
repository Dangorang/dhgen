// combatStates.js — Per-character combat state flags (spec Part 6)

/**
 * Creates a fresh turn state for a combatant.
 * Persistent flags (braced, prone, in_cover) carry across turns.
 * Per-turn flags are reset at turn start via resetTurnFlags().
 */
export function createCombatState(activeWeaponId = null) {
  return {
    // Per-turn flags (reset each turn)
    moved_this_turn: false,
    half_actions_spent: 0,     // 0, 1, or 2
    blocks_movement: false,
    sprinting: false,

    // Persistent flags (carry across turns, cleared by specific actions)
    braced: false,
    prone: false,
    in_cover: false,

    // Grenade state
    grenade_primed: false,
    grenade_prime_turn: -1,

    // Grapple state
    in_grapple: false,
    grapple_partner: null,     // index of grapple opponent
    dominance: 0,              // -5 to +5
    grapple_stamina: 0,

    // Equipment
    active_weapon: activeWeaponId,
  };
}

/**
 * Reset per-turn flags at the start of a character's turn.
 * Persistent flags (braced, prone, in_cover) are NOT reset.
 */
export function resetTurnFlags(state) {
  return {
    ...state,
    moved_this_turn: false,
    half_actions_spent: 0,
    blocks_movement: false,
    sprinting: false,
  };
}

/**
 * Apply movement to combat state.
 * Clears braced status (braced is lost on any movement).
 */
export function applyMovement(state) {
  return {
    ...state,
    moved_this_turn: true,
    braced: false,  // Braced clears on movement per spec 1.4
  };
}

/**
 * Calculate grapple stamina pool from character stats.
 * stamina_pool = max(floor((TGH + WIL) / 10), 3)
 */
export function calculateStaminaPool(toughness, willpower) {
  return Math.max(Math.floor((toughness + willpower) / 10), 3);
}

/**
 * Calculate base movement range from AGI.
 * base_move_tiles = floor(AGI / 10)
 */
export function getBaseMovement(agility) {
  return Math.floor(agility / 10);
}

/**
 * Calculate sprint movement (double base).
 */
export function getSprintMovement(agility) {
  return getBaseMovement(agility) * 2;
}
