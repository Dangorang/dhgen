// actionEconomy.js — Action definitions, validation, and cost management (spec Parts 1 & 6)

// ── Action Definitions ──────────────────────────────────────────
// cost: 'free' | 'half' | 'full'
// blocks_movement: if true, cannot be used if character has moved (and movement is locked after use)
export const ACTIONS = {
  // Free actions
  MOVE:              { id: 'MOVE',              cost: 'free', blocks_movement: false, label: 'Move' },
  SPEAK:             { id: 'SPEAK',             cost: 'free', blocks_movement: false, label: 'Speak' },
  DROP_ITEM:         { id: 'DROP_ITEM',         cost: 'free', blocks_movement: false, label: 'Drop Item' },

  // Half actions (ranged)
  SINGLE_SHOT:       { id: 'SINGLE_SHOT',       cost: 'half', blocks_movement: false, label: 'Single Shot' },
  BURST_FIRE:        { id: 'BURST_FIRE',        cost: 'half', blocks_movement: false, label: 'Burst Fire' },

  // Half actions (support)
  BRACE:             { id: 'BRACE',             cost: 'half', blocks_movement: false, label: 'Brace' },
  PREPARE_GRENADE:   { id: 'PREPARE_GRENADE',   cost: 'half', blocks_movement: false, label: 'Prepare Grenade' },
  THROW_GRENADE:     { id: 'THROW_GRENADE',     cost: 'half', blocks_movement: false, label: 'Throw Grenade' },

  // Half actions (utility)
  MELEE_STRIKE:      { id: 'MELEE_STRIKE',      cost: 'half', blocks_movement: false, label: 'Melee Strike' },
  SWITCH_WEAPON:     { id: 'SWITCH_WEAPON',     cost: 'half', blocks_movement: false, label: 'Switch Weapon' },
  RELOAD:            { id: 'RELOAD',             cost: 'half', blocks_movement: false, label: 'Reload' },
  TAKE_COVER:        { id: 'TAKE_COVER',        cost: 'half', blocks_movement: false, label: 'Take Cover' },
  STAND_OR_PRONE:    { id: 'STAND_OR_PRONE',    cost: 'half', blocks_movement: false, label: 'Stand/Prone' },
  USE_ITEM:          { id: 'USE_ITEM',          cost: 'half', blocks_movement: false, label: 'Use Item' },
  INITIATE_GRAPPLE:  { id: 'INITIATE_GRAPPLE',  cost: 'half', blocks_movement: false, label: 'Grapple' },

  // Full actions (consume both half action slots)
  FULL_AUTO_FIRE:    { id: 'FULL_AUTO_FIRE',    cost: 'full', blocks_movement: true,  label: 'Full Auto' },
  AIMED_SHOT:        { id: 'AIMED_SHOT',        cost: 'full', blocks_movement: true,  label: 'Aimed Shot' },
  CHARGE:            { id: 'CHARGE',            cost: 'full', blocks_movement: false, label: 'Charge' },
  OVERWATCH:         { id: 'OVERWATCH',         cost: 'full', blocks_movement: true,  label: 'Overwatch' },
  SPRINT:            { id: 'SPRINT',            cost: 'full', blocks_movement: false, label: 'Sprint' },
  SUPPRESSIVE_FIRE:  { id: 'SUPPRESSIVE_FIRE',  cost: 'full', blocks_movement: true,  label: 'Suppressive Fire' },
};

// ── Validation ──────────────────────────────────────────────────
/**
 * Check if a character can perform the given action based on their current turn state.
 * Returns { valid: boolean, reason?: string }
 */
export function validateAction(action, turnState, character, weapon) {
  const def = typeof action === 'string' ? ACTIONS[action] : action;
  if (!def) return { valid: false, reason: 'Unknown action' };

  // Free actions are always valid
  if (def.cost === 'free') return { valid: true };

  // Full action requires no half actions spent yet
  if (def.cost === 'full' && turnState.half_actions_spent > 0) {
    return { valid: false, reason: 'Already spent a half action this turn' };
  }

  // Half action requires fewer than 2 spent
  if (def.cost === 'half' && turnState.half_actions_spent >= 2) {
    return { valid: false, reason: 'No action slots remaining' };
  }

  // blocks_movement actions cannot be used if already moved
  if (def.blocks_movement && turnState.moved_this_turn) {
    return { valid: false, reason: 'Cannot use after moving' };
  }

  // Full auto always requires stationary
  if (def.id === 'FULL_AUTO_FIRE' && turnState.moved_this_turn) {
    return { valid: false, reason: 'Full auto requires stationary position' };
  }

  // Throw grenade requires primed
  if (def.id === 'THROW_GRENADE' && !turnState.grenade_primed) {
    return { valid: false, reason: 'Must prepare grenade first' };
  }

  // Vigil marksman rifle cannot fire if moved
  if (weapon?.category === 'MARKSMAN' && turnState.moved_this_turn) {
    if (['SINGLE_SHOT', 'BURST_FIRE', 'AIMED_SHOT', 'FULL_AUTO_FIRE'].includes(def.id)) {
      return { valid: false, reason: 'Vigil cannot fire after moving' };
    }
  }

  // Sprinting blocks all attacks
  if (turnState.sprinting && ['SINGLE_SHOT', 'BURST_FIRE', 'FULL_AUTO_FIRE', 'AIMED_SHOT', 'MELEE_STRIKE'].includes(def.id)) {
    return { valid: false, reason: 'Cannot attack while sprinting' };
  }

  return { valid: true };
}

/**
 * Apply the action cost to turn state. Returns updated state.
 */
export function spendAction(turnState, action) {
  const def = typeof action === 'string' ? ACTIONS[action] : action;
  if (!def || def.cost === 'free') return turnState;

  const newState = { ...turnState };

  if (def.cost === 'half') {
    newState.half_actions_spent += 1;
  } else if (def.cost === 'full') {
    newState.half_actions_spent = 2;
  }

  if (def.blocks_movement) {
    newState.blocks_movement = true;
  }

  // Action-specific state changes
  switch (def.id) {
    case 'SPRINT':
      newState.sprinting = true;
      break;
    case 'BRACE':
      newState.braced = true;
      break;
    case 'TAKE_COVER':
      newState.in_cover = true;
      break;
    case 'STAND_OR_PRONE':
      newState.prone = !newState.prone;
      break;
  }

  return newState;
}

/**
 * Get list of available actions given current turn state.
 * Returns array of action definitions that are currently valid.
 */
export function getAvailableActions(turnState, character, weapon, rof) {
  const available = [];

  // Always check movement
  if (!turnState.moved_this_turn && !turnState.blocks_movement) {
    available.push(ACTIONS.MOVE);
  }

  const isRanged = weapon && weapon.type !== 'Melee';
  const isMelee = weapon && weapon.type === 'Melee';

  // Half actions (need < 2 spent)
  if (turnState.half_actions_spent < 2) {
    if (isRanged) {
      if (rof?.single) available.push(ACTIONS.SINGLE_SHOT);
      if (rof?.semiAuto > 0) available.push(ACTIONS.BURST_FIRE);
    }
    available.push(ACTIONS.MELEE_STRIKE);
    available.push(ACTIONS.BRACE);
    available.push(ACTIONS.TAKE_COVER);
    available.push(ACTIONS.STAND_OR_PRONE);
    available.push(ACTIONS.SWITCH_WEAPON);
    available.push(ACTIONS.RELOAD);
    available.push(ACTIONS.INITIATE_GRAPPLE);

    if (!turnState.grenade_primed) {
      available.push(ACTIONS.PREPARE_GRENADE);
    }
    if (turnState.grenade_primed) {
      available.push(ACTIONS.THROW_GRENADE);
    }
  }

  // Full actions (need 0 spent)
  if (turnState.half_actions_spent === 0) {
    if (isRanged && rof?.fullAuto > 0) available.push(ACTIONS.FULL_AUTO_FIRE);
    if (isRanged) available.push(ACTIONS.AIMED_SHOT);
    if (isRanged && (rof?.fullAuto > 0 || rof?.semiAuto > 0)) available.push(ACTIONS.SUPPRESSIVE_FIRE);
    available.push(ACTIONS.CHARGE);
    available.push(ACTIONS.OVERWATCH);
    available.push(ACTIONS.SPRINT);
  }

  // Filter by validation
  return available.filter(a => validateAction(a, turnState, character, weapon).valid);
}

/**
 * Check if the turn is complete (both half actions spent or full action used).
 */
export function isTurnComplete(turnState) {
  return turnState.half_actions_spent >= 2;
}

/**
 * Calculate aimed shot bonus from PER.
 * aimed_bonus = floor(PER / 10)
 */
export function getAimedShotBonus(perception) {
  return Math.floor(perception / 10);
}
