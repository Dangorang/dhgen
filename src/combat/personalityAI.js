// personalityAI.js — Personality-driven autonomous combat behaviour (spec Part 5)

// ── Personality combat tendencies (spec 5.1 & 5.2) ─────────────

const RANGED_BEHAVIOUR = {
  Aggressive:    { preferredActions: ['FULL_AUTO_FIRE', 'BURST_FIRE'], moveBias: 'advance', riskTolerance: 0.8 },
  Cautious:      { preferredActions: ['AIMED_SHOT', 'OVERWATCH'],     moveBias: 'hold',    riskTolerance: 0.3 },
  Stoic:         { preferredActions: ['SINGLE_SHOT', 'BURST_FIRE'],   moveBias: 'hold',    riskTolerance: 0.5 },
  Zealous:       { preferredActions: ['BURST_FIRE', 'FULL_AUTO_FIRE'],moveBias: 'advance', riskTolerance: 0.9 },
  Disciplined:   { preferredActions: ['AIMED_SHOT', 'SINGLE_SHOT'],  moveBias: 'tactical',riskTolerance: 0.4 },
  Ruthless:      { preferredActions: ['BURST_FIRE', 'AIMED_SHOT'],   moveBias: 'tactical',riskTolerance: 0.6 },
  Loyal:         { preferredActions: ['SINGLE_SHOT', 'BURST_FIRE'],   moveBias: 'support', riskTolerance: 0.7 },
  Compassionate: { preferredActions: ['SINGLE_SHOT', 'OVERWATCH'],   moveBias: 'hold',    riskTolerance: 0.2 },
  Haunted:       { preferredActions: ['BURST_FIRE', 'SINGLE_SHOT'],  moveBias: 'erratic', riskTolerance: 0.5 },
  Ambitious:     { preferredActions: ['AIMED_SHOT', 'FULL_AUTO_FIRE'],moveBias: 'advance', riskTolerance: 0.7 },
};

const GRAPPLE_BEHAVIOUR = {
  Aggressive:    { tendency: 'initiate',  firstRollBonus: 3, preferredAction: 'damaging' },
  Cautious:      { tendency: 'break',     firstRollBonus: 0, preferredAction: 'distance' },
  Ruthless:      { tendency: 'initiate',  firstRollBonus: 0, preferredAction: 'lethal' },
  Loyal:         { tendency: 'assist',    firstRollBonus: 0, preferredAction: 'support' },
  Haunted:       { tendency: 'erratic',   firstRollBonus: 0, preferredAction: 'variable' },
  Disciplined:   { tendency: 'tactical',  firstRollBonus: 0, preferredAction: 'optimal' },
  Stoic:         { tendency: 'hold',      firstRollBonus: 0, preferredAction: 'maintain' },
  Zealous:       { tendency: 'initiate',  firstRollBonus: 0, preferredAction: 'damaging' },
  Compassionate: { tendency: 'restrain',  firstRollBonus: 0, preferredAction: 'restrain' },
  Ambitious:     { tendency: 'initiate',  firstRollBonus: 0, preferredAction: 'flashy' },
};

/**
 * Get the ranged combat behaviour profile for a personality.
 */
export function getRangedBehaviour(personality) {
  return RANGED_BEHAVIOUR[personality] || RANGED_BEHAVIOUR.Disciplined;
}

/**
 * Get the grapple behaviour profile for a personality.
 */
export function getGrappleBehaviour(personality) {
  return GRAPPLE_BEHAVIOUR[personality] || GRAPPLE_BEHAVIOUR.Disciplined;
}

/**
 * Select the best action for an AI-controlled character based on personality and available actions.
 * @param personality string — character's personality trait
 * @param availableActions array of action definitions from getAvailableActions()
 * @param context { distanceToNearestEnemy, hasLOS, alliesInDanger, ammoRemaining, woundsPercent }
 * @returns the selected action definition
 */
export function selectAIAction(personality, availableActions, context = {}) {
  if (!availableActions.length) return null;

  const behaviour = getRangedBehaviour(personality);
  const actionIds = availableActions.map(a => a.id);

  // Priority: check if personality-preferred actions are available
  for (const preferred of behaviour.preferredActions) {
    if (actionIds.includes(preferred)) {
      return availableActions.find(a => a.id === preferred);
    }
  }

  // Loyal personality: prioritise helping downed allies
  if (personality === 'Loyal' && context.alliesInDanger) {
    if (actionIds.includes('MOVE')) return availableActions.find(a => a.id === 'MOVE');
  }

  // Cautious at low health: take cover or reload
  if (personality === 'Cautious' && context.woundsPercent < 0.3) {
    if (actionIds.includes('TAKE_COVER')) return availableActions.find(a => a.id === 'TAKE_COVER');
  }

  // Aggressive: advance if far from enemy
  if (personality === 'Aggressive' && context.distanceToNearestEnemy > 5) {
    if (actionIds.includes('MOVE')) return availableActions.find(a => a.id === 'MOVE');
  }

  // Haunted: random behaviour under stress
  if (personality === 'Haunted' && context.woundsPercent < 0.5) {
    const randomIdx = Math.floor(Math.random() * availableActions.length);
    return availableActions[randomIdx];
  }

  // Default: pick the first available attack action, then any half action
  const attackActions = ['SINGLE_SHOT', 'BURST_FIRE', 'FULL_AUTO_FIRE', 'AIMED_SHOT', 'MELEE_STRIKE'];
  for (const atk of attackActions) {
    if (actionIds.includes(atk)) return availableActions.find(a => a.id === atk);
  }

  // Fallback: first available action
  return availableActions[0];
}

/**
 * Select grapple action at given dominance threshold.
 * @param personality string
 * @param availableGrappleActions string[] from getAvailableGrappleActions()
 * @returns selected action string
 */
export function selectGrappleAction(personality, availableGrappleActions) {
  if (!availableGrappleActions.length) return null;

  const behaviour = getGrappleBehaviour(personality);

  // Ruthless: always pick the most damaging (highest threshold) action
  if (behaviour.preferredAction === 'lethal') {
    return availableGrappleActions[availableGrappleActions.length - 1];
  }

  // Cautious: prefer break / distance
  if (behaviour.tendency === 'break') {
    if (availableGrappleActions.includes('Clean Break')) return 'Clean Break';
    if (availableGrappleActions.includes('Shove')) return 'Shove';
  }

  // Disciplined: pick the optimal (highest tier available)
  if (behaviour.preferredAction === 'optimal') {
    return availableGrappleActions[availableGrappleActions.length - 1];
  }

  // Default: pick the highest-tier action available
  return availableGrappleActions[availableGrappleActions.length - 1];
}

/**
 * Determine AI movement bias direction.
 * Returns 'advance' | 'hold' | 'retreat' | 'flank'
 */
export function getMoveBias(personality, context = {}) {
  const behaviour = getRangedBehaviour(personality);

  switch (behaviour.moveBias) {
    case 'advance':
      return context.woundsPercent < 0.3 ? 'hold' : 'advance';
    case 'hold':
      return 'hold';
    case 'support':
      return context.alliesInDanger ? 'advance' : 'hold';
    case 'erratic':
      return Math.random() < 0.5 ? 'advance' : 'retreat';
    case 'tactical':
      if (context.distanceToNearestEnemy <= 3) return 'retreat';
      if (context.distanceToNearestEnemy > 8) return 'advance';
      return 'hold';
    default:
      return 'hold';
  }
}
