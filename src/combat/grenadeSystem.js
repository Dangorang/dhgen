// grenadeSystem.js — Grenade prepare, throw, scatter, fumble, blast (spec Part 3)

// ── Dice helpers ────────────────────────────────────────────────
const d100 = () => Math.floor(Math.random() * 100) + 1;
const d4  = () => Math.floor(Math.random() * 4) + 1;
const d6  = () => Math.floor(Math.random() * 6) + 1;

// ── Grenade definitions ─────────────────────────────────────────
export const GRENADE_TYPES = {
  FRAG: {
    id: 'frag',
    name: 'Frag Grenade',
    damage: '2d10',
    pen: 0,
    blastRadius: 3,  // tiles
    description: 'Standard fragmentation grenade. Lethal within blast radius.',
  },
  KRAK: {
    id: 'krak',
    name: 'Krak Grenade',
    damage: '2d10+4',
    pen: 6,
    blastRadius: 1,
    description: 'Shaped-charge anti-armor grenade. Small blast, massive penetration.',
  },
  SMOKE: {
    id: 'smoke',
    name: 'Smoke Grenade',
    damage: '0',
    pen: 0,
    blastRadius: 4,
    description: 'Creates a dense smoke cloud blocking line of sight.',
    isSmoke: true,
  },
};

// ── D8 compass directions ───────────────────────────────────────
const COMPASS = [
  { dx:  0, dy: -1, name: 'North' },     // 1
  { dx:  1, dy: -1, name: 'Northeast' },  // 2
  { dx:  1, dy:  0, name: 'East' },       // 3
  { dx:  1, dy:  1, name: 'Southeast' },  // 4
  { dx:  0, dy:  1, name: 'South' },      // 5
  { dx: -1, dy:  1, name: 'Southwest' },  // 6
  { dx: -1, dy:  0, name: 'West' },       // 7
  { dx: -1, dy: -1, name: 'Northwest' },  // 8
];

function d8Compass() {
  return COMPASS[Math.floor(Math.random() * 8)];
}

// ── Range from STR ──────────────────────────────────────────────
/**
 * Max grenade throw range in tiles = floor(STR / 10)
 */
export function getGrenadeRange(strength) {
  return Math.floor(strength / 10);
}

// ── Scatter offset ──────────────────────────────────────────────
/**
 * Offset a tile position by scatterTiles in a compass direction.
 * Clamps to grid bounds (0–gridSize-1).
 */
export function offsetTile(tile, direction, scatterTiles, gridSize = 20) {
  return {
    x: Math.max(0, Math.min(gridSize - 1, tile.x + direction.dx * scatterTiles)),
    y: Math.max(0, Math.min(gridSize - 1, tile.y + direction.dy * scatterTiles)),
  };
}

/**
 * Get all tiles within blastRadius of center (Manhattan or Chebyshev distance).
 * Uses Chebyshev (king-move) distance for circular-ish blast.
 */
export function getBlastTiles(center, blastRadius, gridSize = 20) {
  const tiles = [];
  for (let dx = -blastRadius; dx <= blastRadius; dx++) {
    for (let dy = -blastRadius; dy <= blastRadius; dy++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}

// ── Grenade throw resolution (spec 3.3) ─────────────────────────
/**
 * Resolve a grenade throw.
 * Returns { landingTile, outcome, scatterDir, scatterDist, log[] }
 *   outcome: 'exact' | 'adjacent' | 'scatter' | 'fumble'
 */
export function resolveGrenadeThrow(attacker, targetTile, grenadeType, gridSize = 20) {
  const per = attacker.stats?.perception || 20;
  const str = attacker.stats?.strength || 20;
  const maxRange = getGrenadeRange(str);
  const dist = Math.max(Math.abs(targetTile.x - attacker.x), Math.abs(targetTile.y - attacker.y));

  let perMod = 0;
  if (dist > maxRange) {
    perMod = -20; // Over-range penalty
  }

  const roll = d100();
  const effectivePer = per + perMod;
  const log = [];

  // Fumble — 91-00
  if (roll >= 91) {
    const scatterDist = d4() + 2; // 3-6 tiles
    const scatterDir = d8Compass();
    const landingTile = offsetTile(targetTile, scatterDir, scatterDist, gridSize);
    log.push({ type: 'system', text: `FUMBLE! (rolled ${roll}) — grenade scatters ${scatterDist} tiles ${scatterDir.name}!` });
    return {
      landingTile,
      outcome: 'fumble',
      scatterDir: scatterDir.name,
      scatterDist,
      roll,
      log,
    };
  }

  // Failure (non-fumble) — roll > PER
  if (roll > effectivePer) {
    const scatterDist = d6();
    const scatterDir = d8Compass();
    const landingTile = offsetTile(targetTile, scatterDir, scatterDist, gridSize);
    log.push({ type: 'system', text: `Miss (rolled ${roll} vs PER ${effectivePer}) — scatters ${scatterDist} tiles ${scatterDir.name}` });
    return {
      landingTile,
      outcome: 'scatter',
      scatterDir: scatterDir.name,
      scatterDist,
      roll,
      log,
    };
  }

  // Success
  const degrees = Math.floor((effectivePer - roll) / 10);

  if (degrees >= 1) {
    // One+ degrees of success — exact tile
    log.push({ type: 'player', text: `Direct hit! (rolled ${roll} vs PER ${effectivePer}, ${degrees} DoS)` });
    return {
      landingTile: { ...targetTile },
      outcome: 'exact',
      scatterDir: null,
      scatterDist: 0,
      roll,
      log,
    };
  }

  // Basic success — random adjacent tile
  const adjacentDir = d8Compass();
  const landingTile = offsetTile(targetTile, adjacentDir, 1, gridSize);
  log.push({ type: 'player', text: `Near miss (rolled ${roll} vs PER ${effectivePer}) — lands 1 tile ${adjacentDir.name}` });
  return {
    landingTile,
    outcome: 'adjacent',
    scatterDir: adjacentDir.name,
    scatterDist: 1,
    roll,
    log,
  };
}

// ── Detonate-in-hand check (spec 3.1) ───────────────────────────
/**
 * Check if a primed grenade detonates in hand at start of turn.
 * Returns true if grenade_prime_turn was 2+ turns ago.
 */
export function shouldDetonateInHand(combatState, currentTurnNumber) {
  if (!combatState.grenade_primed) return false;
  return currentTurnNumber > combatState.grenade_prime_turn + 1;
}

// ── Find characters in blast radius ─────────────────────────────
/**
 * Given blast tiles and character positions, return indices of characters hit.
 */
export function getCharactersInBlast(blastTiles, partyPositions, enemyPositions) {
  const partyHit = [];
  const enemyHit = [];

  for (const tile of blastTiles) {
    partyPositions.forEach((pos, i) => {
      if (pos.x === tile.x && pos.y === tile.y) {
        if (!partyHit.includes(i)) partyHit.push(i);
      }
    });
    enemyPositions.forEach((pos, i) => {
      if (pos.x === tile.x && pos.y === tile.y) {
        if (!enemyHit.includes(i)) enemyHit.push(i);
      }
    });
  }

  return { partyHit, enemyHit };
}
