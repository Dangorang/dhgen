// proficiency.js — Role-weapon proficiency tags and AGI-based move penalties (spec Part 2)

// ── Role Proficiency Tags (spec 2.2) ────────────────────────────
export const ROLE_PROFICIENCY = {
  'Veteran Infantry': ['RIFLE', 'PISTOL', 'LMG'],
  'Infiltrator':      ['PISTOL', 'CARBINE', 'RIFLE'],
  'Corpsman':         ['PISTOL', 'CARBINE'],
  'Demotech':         ['SHOTGUN', 'PISTOL'],
  'Artificer':        ['PISTOL'],
  'Sanctioned':       ['PISTOL'],
};

/**
 * Check if a role has proficiency with a weapon category.
 */
export function hasProficiency(role, weaponCategory) {
  if (!weaponCategory || weaponCategory === 'MELEE') return true; // melee not subject to ranged proficiency
  const tags = ROLE_PROFICIENCY[role];
  if (!tags) return false;
  return tags.includes(weaponCategory);
}

// ── Burst Fire On-The-Move Penalty (spec 2.4, corrected table) ──
/**
 * Returns the accuracy penalty for burst fire while moving.
 */
export function getBurstMovePenalty(agi, hasProf) {
  if (hasProf) {
    if (agi < 30) return -10;
    if (agi < 45) return -5;
    return 0;  // 45+
  }
  // No proficiency
  if (agi < 30) return -20;
  if (agi < 45) return -15;
  if (agi < 55) return -10;
  return -5;  // 55+
}

/**
 * Returns the accuracy penalty for single shot while moving.
 * Uses the same table as burst fire per spec 2.7 note.
 */
export function getSingleShotMovePenalty(agi, hasProf) {
  return getBurstMovePenalty(agi, hasProf);
}

// ── Mauler HMG Special Rules (spec 2.5) ─────────────────────────
/**
 * Check if a character can fire the Mauler HMG without bracing.
 * Only Veteran Infantry with STR >= 50 can fire unbraced.
 */
export function canFireHMGUnbraced(role, strength) {
  return role === 'Veteran Infantry' && strength >= 50;
}

/**
 * Check if a weapon requires stationary firing (Vigil Marksman Rifle).
 */
export function requiresStationary(weaponCategory) {
  return weaponCategory === 'MARKSMAN';
}

// ── Double-Tap Rules (spec 2.7) ──────────────────────────────────
/**
 * Calculate accuracy for a double-tap sequence.
 * Returns { shot1Accuracy, shot2Accuracy }
 */
export function getDoubleTapAccuracy(baseAccuracy, agi, hasProf, movedThisTurn) {
  let movePenalty = 0;
  if (movedThisTurn) {
    movePenalty = getSingleShotMovePenalty(agi, hasProf);
  }

  const shot1 = baseAccuracy + movePenalty;
  const shot2 = baseAccuracy + movePenalty + 10; // +10 follow-through bonus

  return { shot1Accuracy: shot1, shot2Accuracy: shot2 };
}
