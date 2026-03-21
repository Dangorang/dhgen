// grappleSystem.js — Grapple & Wrestling system (spec Part 4)

const d10 = () => Math.floor(Math.random() * 10) + 1;

// ── Role grapple modifiers (spec 4.2) ───────────────────────────
const ROLE_GRAPPLE_MOD = {
  'Veteran Infantry': 10,
  'Demotech':          8,
  'Corpsman':          5,
  'Infiltrator':       5,
  'Artificer':         0,
  'Sanctioned':       -5,
};

// ── Weapon grapple penalties (spec 4.2) ─────────────────────────
const WEAPON_GRAPPLE_PENALTY = {
  'lmg':             -15,  // Mauler HMG
  'vigil':           -12,  // Vigil Marksman Rifle
  'assault_rifle':   -10,  // Vex-9 Assault Rifle
  'shotgun':          -8,  // Reaver Shotgun
  'carbine':          -5,  // Vex-9C Carbine
  'laspistol':         0,  // Thorn Sidearm
  'bolt_pistol':       0,
  'plasma_pistol':     0,
  'aetheric_aperture': 0,
  'chainknife':        2,  // Ashmark Combat Knife
  'phase_blade':       0,
  'power_sword':       0,
  'shield_arm':        3,  // Stun Baton equivalent
};

export function getRoleGrappleMod(role) {
  return ROLE_GRAPPLE_MOD[role] || 0;
}

export function getWeaponGrapplePenalty(weaponId) {
  return WEAPON_GRAPPLE_PENALTY[weaponId] || 0;
}

// ── Grapple Roll (spec 4.2) ─────────────────────────────────────
/**
 * Calculate a character's grapple roll.
 * base = floor((STR + AGI) / 2) + role_mod + weapon_penalty + messy_mod + d10()
 */
export function grappleRoll(character, options = {}) {
  const str = character.stats?.strength || 20;
  const agi = character.stats?.agility || 20;
  const base = Math.floor((str + agi) / 2);
  const roleMod = getRoleGrappleMod(character.role || '');
  const weaponPen = getWeaponGrapplePenalty(options.activeWeaponId || '');
  const messyMod = options.messyContact ? -2 : 0;
  const staminaMod = options.stamina === 0 ? -5 : 0;
  const halfRoll = options.halfRoll ? 0.5 : 1; // For reach actions, defend at half

  const roll = d10();
  const total = Math.floor((base + roleMod + weaponPen + messyMod + staminaMod) * halfRoll) + roll;

  return { total, roll, base, roleMod, weaponPen, messyMod, staminaMod };
}

// ── Charge Phase (spec 4.1) ─────────────────────────────────────
/**
 * Resolve the charge phase when initiating a grapple from range.
 * Returns { outcome: 'initiator_clean' | 'defender_reacts' | 'messy_contact', log[] }
 */
export function resolveChargePhase(initiator, defender) {
  const iRoll = (initiator.stats?.agility || 20) + d10();
  const dRoll = (defender.stats?.perception || 20) + d10();
  const log = [];

  if (dRoll > iRoll) {
    log.push({ type: 'enemy', text: `${defender.name} reacts to the charge! (${dRoll} vs ${iRoll}) — opportunity action!` });
    return { outcome: 'defender_reacts', log };
  }

  if (iRoll === dRoll) {
    log.push({ type: 'system', text: `Messy contact! Both take -2 to first grapple roll.` });
    return { outcome: 'messy_contact', log };
  }

  log.push({ type: 'player', text: `${initiator.name} closes the distance cleanly! (${iRoll} vs ${dRoll})` });
  return { outcome: 'initiator_clean', log };
}

// ── Dominance resolution (spec 4.3) ─────────────────────────────
/**
 * Resolve one turn of grapple.
 * Returns { dominanceChange, winner, margin, log[] }
 */
export function resolveGrappleTurn(initiator, defender, currentDominance, options = {}) {
  const iResult = grappleRoll(initiator, {
    activeWeaponId: options.initiatorWeaponId,
    messyContact: options.initiatorMessy,
    stamina: options.initiatorStamina,
    halfRoll: options.initiatorHalfRoll,
  });

  const dResult = grappleRoll(defender, {
    activeWeaponId: options.defenderWeaponId,
    messyContact: options.defenderMessy,
    stamina: options.defenderStamina,
    halfRoll: options.defenderHalfRoll,
  });

  const margin = Math.abs(iResult.total - dResult.total);
  const winner = iResult.total > dResult.total ? 'initiator' : iResult.total < dResult.total ? 'defender' : 'tie';

  // Stamina < 0 forces stalemate
  if ((options.initiatorStamina != null && options.initiatorStamina < 0) ||
      (options.defenderStamina != null && options.defenderStamina < 0)) {
    const log = [{ type: 'system', text: 'Exhaustion! Stalemate — no dominance change.' }];
    return { dominanceChange: 0, winner: 'tie', margin: 0, iResult, dResult, log };
  }

  let dominanceChange;
  if (margin === 0) {
    dominanceChange = 0;
  } else if (margin <= 5) {
    dominanceChange = 1;
  } else if (margin <= 10) {
    dominanceChange = 2;
  } else {
    dominanceChange = 3;
  }

  let newDominance = currentDominance;
  if (winner === 'initiator') {
    newDominance = Math.min(currentDominance + dominanceChange, 5);
  } else if (winner === 'defender') {
    newDominance = Math.max(currentDominance - dominanceChange, -5);
  }

  const log = [];
  const winnerName = winner === 'initiator' ? initiator.name : winner === 'defender' ? defender.name : 'Neither';
  log.push({
    type: winner === 'initiator' ? 'player' : winner === 'defender' ? 'enemy' : 'system',
    text: `Grapple: ${initiator.name} (${iResult.total}) vs ${defender.name} (${dResult.total}) — ${winnerName} gains ${dominanceChange} dominance [${newDominance}]`,
  });

  return { dominanceChange, newDominance, winner, margin, iResult, dResult, log };
}

// ── Dominance action thresholds (spec 4.3) ──────────────────────
export const DOMINANCE_ACTIONS = {
  1: ['Shove', 'Reposition', 'Light Strike'],
  2: ['Weapon Grab', 'Pin Attempt', 'Headbutt'],
  3: ['Disarm', 'Choke', 'Joint Lock'],
  4: ['Throw', 'Clean Break', 'Takedown'],
  5: ['Submission', 'Knock Unconscious', 'Execution'],
};

/**
 * Get available grapple actions for the controlling side.
 * @param dominance current dominance value
 * @param isInitiator true if querying for initiator's actions
 * @param stamina current stamina of the acting character
 */
export function getAvailableGrappleActions(dominance, isInitiator, stamina = 1) {
  const effectiveDom = isInitiator ? dominance : -dominance;
  if (effectiveDom <= 0) return []; // Only controlling side gets actions

  // Stamina 0 caps at ±2 threshold
  const maxThreshold = stamina <= 0 ? 2 : 5;
  const actions = [];
  for (let threshold = 1; threshold <= Math.min(effectiveDom, maxThreshold); threshold++) {
    actions.push(...(DOMINANCE_ACTIONS[threshold] || []));
  }
  return actions;
}

// ── Break attempt (spec 4.6) ────────────────────────────────────
/**
 * Attempt to break free from a grapple.
 * Returns { success, log[] }
 */
export function resolveBreakAttempt(breaker, holder) {
  let breakRoll = (breaker.stats?.agility || 20) + d10();
  const holdRoll = (holder.stats?.strength || 20) + d10();

  // Infiltrator break bonus
  if (breaker.role === 'Infiltrator') {
    breakRoll += 10;
  }

  const log = [];
  if (breakRoll > holdRoll) {
    log.push({ type: 'player', text: `${breaker.name} breaks free! (${breakRoll} vs ${holdRoll}) — both stagger back!` });
    return { success: true, log };
  }

  log.push({ type: 'enemy', text: `${breaker.name} fails to break free (${breakRoll} vs ${holdRoll}). Loses 1 dominance.` });
  return { success: false, log };
}

// ── Reach for sidearm (spec 4.5) ────────────────────────────────
/**
 * Attempt to draw sidearm during grapple.
 * Returns { outcome: 'clean_draw' | 'contested_draw' | 'failed' | 'arm_grabbed' | 'exposed', dominanceShift, log[] }
 */
export function resolveReachAction(grappler, opponent, opponentOptions = {}) {
  const reachRoll = (grappler.stats?.agility || 20) + d10();
  const opponentResult = grappleRoll(opponent, opponentOptions);
  const margin = reachRoll - opponentResult.total;

  const log = [];

  if (margin >= 6) {
    log.push({ type: 'player', text: `${grappler.name} draws sidearm cleanly! (${reachRoll} vs ${opponentResult.total})` });
    return { outcome: 'clean_draw', dominanceShift: 0, log };
  }
  if (margin >= 1) {
    log.push({ type: 'system', text: `Contested draw — both hands on the sidearm! (${reachRoll} vs ${opponentResult.total})` });
    return { outcome: 'contested_draw', dominanceShift: 0, log };
  }
  if (margin === 0) {
    log.push({ type: 'enemy', text: `${grappler.name} fails to reach sidearm. -1 dominance.` });
    return { outcome: 'failed', dominanceShift: -1, log };
  }
  if (margin >= -5) {
    log.push({ type: 'enemy', text: `${grappler.name}'s arm is grabbed! -2 dominance.` });
    return { outcome: 'arm_grabbed', dominanceShift: -2, log };
  }
  // margin <= -6
  log.push({ type: 'enemy', text: `${grappler.name} is exposed! Takes a hit and loses 3 dominance.` });
  return { outcome: 'exposed', dominanceShift: -3, log };
}

// ── 2v1 grapple (spec 4.7) ──────────────────────────────────────
/**
 * Combine two allied grapple rolls for 2v1.
 * higher + floor(lower / 2)
 */
export function twoVsOneRoll(rollA, rollB) {
  const higher = Math.max(rollA, rollB);
  const lower = Math.min(rollA, rollB);
  return higher + Math.floor(lower / 2);
}

// ── Psionic grapple (spec 4.8) ──────────────────────────────────
/**
 * Psionic grapple roll for Sanctioned characters with breached Limiter.
 */
export function psionicGrappleRoll(psyRating) {
  return psyRating + d10();
}

/**
 * Determine psionic grapple outcome based on margin of victory.
 */
export function getPsionicOutcome(margin) {
  if (margin >= 11) return { effect: 'psychic_grip', description: 'Target psychically gripped — immobilised!' };
  if (margin >= 6)  return { effect: 'flung', description: 'Target flung away — knocked prone!' };
  if (margin >= 1)  return { effect: 'shoved', description: 'Target shoved back — staggered 1 turn.' };
  return { effect: 'none', description: 'Psionic grapple failed.' };
}

// ── Stamina management (spec 4.4) ───────────────────────────────
/**
 * Calculate stamina pool from stats.
 */
export function calculateStaminaPool(toughness, willpower) {
  return Math.max(Math.floor((toughness + willpower) / 10), 3);
}

/**
 * Get stamina effect description.
 */
export function getStaminaEffect(stamina) {
  if (stamina >= 1) return { penalty: 0, maxThreshold: 5, description: 'Fresh' };
  if (stamina === 0) return { penalty: -5, maxThreshold: 2, description: 'Winded — -5 to grapple rolls, max ±2 actions' };
  return { penalty: 0, maxThreshold: 0, description: 'Exhausted — automatic stalemate' };
}
