import Phaser from 'phaser';
import { eventBridge } from '../EventBridge.js';

const TILE_SIZE = 30;
const GRID_SIZE = 20;

// ── Terrain color palette ─────────────────────────────────────────────────
const TERRAIN_COLORS = {
  grass:    { fill: 0x2a4a20, line: 0x1e3a18 },
  forest:   { fill: 0x1e3a18, line: 0x162e12 },
  hill:     { fill: 0x3a4a30, line: 0x2e3a28 },
  water:    { fill: 0x1a3a5a, line: 0x142e4a },
  road:     { fill: 0x4a4a3a, line: 0x3a3a2e },
  sand:     { fill: 0x5a4a28, line: 0x4a3a20 },
  rock:     { fill: 0x4a4038, line: 0x3a3028 },
  mesa:     { fill: 0x5a3820, line: 0x4a2818 },
  cracked:  { fill: 0x4a3a20, line: 0x3a2a18 },
  ice:      { fill: 0x3a5a6a, line: 0x2e4a5a },
  snow:     { fill: 0x5a6a7a, line: 0x4a5a6a },
  crevasse: { fill: 0x1a2a3a, line: 0x0e1e2e },
  basalt:   { fill: 0x2a2020, line: 0x1e1818 },
  ash:      { fill: 0x3a3028, line: 0x2e2420 },
  lava:     { fill: 0x6a2010, line: 0x5a1808 },
  obsidian: { fill: 0x1a1a20, line: 0x101018 },
  shallows: { fill: 0x2a4a5a, line: 0x1e3a4a },
  reef:     { fill: 0x2a5a4a, line: 0x1e4a3a },
  deep:     { fill: 0x0e2a4a, line: 0x081e3a },
  platform: { fill: 0x4a4a4a, line: 0x3a3a3a },
  dock:     { fill: 0x4a3a2a, line: 0x3a2a1e },
  bridge:   { fill: 0x5a5040, line: 0x4a4030 },
  canopy:   { fill: 0x1a4a18, line: 0x123a10 },
  vine:     { fill: 0x2a5a20, line: 0x1e4a18 },
  swamp:    { fill: 0x2a3a20, line: 0x1e2e18 },
  clearing: { fill: 0x3a5a28, line: 0x2e4a20 },
  river:    { fill: 0x1a3a4a, line: 0x142e3a },
  path:     { fill: 0x4a4a30, line: 0x3a3a28 },
  installation: { fill: 0x3a3a4a, line: 0x4a4a5a },
  poi:          { fill: 0x2a3a4a, line: 0x3a5a7a },
};

export default class ExplorationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ExplorationScene' });
    this._ready          = false;
    this._terrainGfx     = null;
    this._highlightGfx   = null;
    this._poiGfx         = null;
    this._npcGfx         = null;
    this._playerGfx      = null;
    this._playerLabel    = null;
    this._fogGfx         = null;
    this._updateHandler  = null;
    this._lastGridState  = null;
  }

  create() {
    this._terrainGfx   = this.add.graphics().setDepth(0);
    this._highlightGfx = this.add.graphics().setDepth(0.5);
    this._poiGfx       = this.add.graphics().setDepth(0.8);
    this._npcGfx       = this.add.graphics().setDepth(0.9);
    this._playerGfx    = this.add.graphics().setDepth(1);
    this._playerLabel  = this.add.text(0, 0, "▶", {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#c8a84a', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1.1).setVisible(false);
    this._fogGfx       = this.add.graphics().setDepth(2);

    this._ready = true;

    this._updateHandler = (data) => {
      if (this._ready) this._onUpdate(data);
    };
    eventBridge.on('exploration-update', this._updateHandler);

    // Click handler
    this.input.on('pointerdown', (pointer) => {
      const gx = Math.floor(pointer.x / TILE_SIZE);
      const gy = Math.floor(pointer.y / TILE_SIZE);
      if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        eventBridge.emit('exploration-click', { x: gx, y: gy });
      }
    });

    eventBridge.emit('phaser-ready', {});
  }

  shutdown() {
    this._ready = false;
    if (this._updateHandler) eventBridge.off('exploration-update', this._updateHandler);
  }

  _onUpdate(data) {
    this._lastGridState = data;
    this._drawTerrain(data.grid);
    this._drawPOIs(data.pois);
    this._drawNPCs(data.npcs, data.regionIndex);
    this._drawPlayer(data.playerPosition);
    this._drawMoveRange(data.playerPosition, data.moveRange || 1);
    this._drawFog(data.playerPosition, data.visionRange || 5, data.revealedTiles);
  }

  _drawTerrain(grid) {
    if (!grid) return;
    this._terrainGfx.clear();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = grid[y]?.[x];
        const terrain = tile?.terrain || 'grass';
        const colors = TERRAIN_COLORS[terrain] || TERRAIN_COLORS.grass;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        this._terrainGfx.fillStyle(colors.fill, 1);
        this._terrainGfx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        this._terrainGfx.lineStyle(1, colors.line, 0.4);
        this._terrainGfx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        if (terrain === 'installation') {
          this._terrainGfx.lineStyle(1, 0x6a6a7a, 0.5);
          this._terrainGfx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      }
    }
  }

  _drawPOIs(pois) {
    this._poiGfx.clear();
    if (!pois) return;

    for (const poi of pois) {
      const px = poi.gridX * TILE_SIZE + TILE_SIZE / 2;
      const py = poi.gridY * TILE_SIZE + TILE_SIZE / 2;

      // Circle
      this._poiGfx.fillStyle(poi.investigated ? 0x1e4a7a : 0xc8a84a, 0.7);
      this._poiGfx.fillCircle(px, py, 8);
      this._poiGfx.lineStyle(1, poi.investigated ? 0x2e5a82 : 0xe8d090, 0.9);
      this._poiGfx.strokeCircle(px, py, 8);

      // Simple marker: small dot for investigated, larger for active
      if (!poi.investigated) {
        this._poiGfx.fillStyle(0x06080f, 0.9);
        this._poiGfx.fillCircle(px, py, 3);
      } else {
        this._poiGfx.lineStyle(2, 0x8ab4d4, 0.8);
        this._poiGfx.lineBetween(px - 3, py, px - 1, py + 3);
        this._poiGfx.lineBetween(px - 1, py + 3, px + 4, py - 3);
      }
    }
  }

  _drawNPCs(npcs, regionIndex) {
    this._npcGfx.clear();
    if (!npcs) return;

    const drawEntity = (entity, fillColor, strokeColor, dotColor) => {
      if (!entity.alive) return;
      if (entity.location?.regionIndex !== regionIndex) return;
      const gx = entity.location.gridX;
      const gy = entity.location.gridY;
      const px = gx * TILE_SIZE + TILE_SIZE / 2;
      const py = gy * TILE_SIZE + TILE_SIZE / 2;

      // Outer ring
      this._npcGfx.fillStyle(fillColor, 0.7);
      this._npcGfx.fillCircle(px, py, 7);
      this._npcGfx.lineStyle(2, strokeColor, 0.9);
      this._npcGfx.strokeCircle(px, py, 7);
      // Inner dot
      this._npcGfx.fillStyle(dotColor, 0.9);
      this._npcGfx.fillCircle(px, py, 3);
    };

    // Administrator — green ally (diamond shape)
    if (npcs.administrator) {
      const a = npcs.administrator;
      if (a.alive && a.location?.regionIndex === regionIndex) {
        const px = a.location.gridX * TILE_SIZE + TILE_SIZE / 2;
        const py = a.location.gridY * TILE_SIZE + TILE_SIZE / 2;
        this._npcGfx.fillStyle(0x40a060, 0.8);
        this._npcGfx.fillCircle(px, py, 8);
        this._npcGfx.lineStyle(2, 0x80e0a0, 0.9);
        this._npcGfx.strokeCircle(px, py, 8);
        // Inner cross for ally
        this._npcGfx.lineStyle(2, 0xffffff, 0.8);
        this._npcGfx.lineBetween(px - 3, py, px + 3, py);
        this._npcGfx.lineBetween(px, py - 3, px, py + 3);
      }
    }

    // Loyalist Leader — bright red, larger
    if (npcs.loyalistLeader) {
      const l = npcs.loyalistLeader;
      if (l.alive && l.location?.regionIndex === regionIndex) {
        const px = l.location.gridX * TILE_SIZE + TILE_SIZE / 2;
        const py = l.location.gridY * TILE_SIZE + TILE_SIZE / 2;
        this._npcGfx.fillStyle(0xc03030, 0.8);
        this._npcGfx.fillCircle(px, py, 9);
        this._npcGfx.lineStyle(2, 0xff5050, 0.9);
        this._npcGfx.strokeCircle(px, py, 9);
        // Skull-like X for leader
        this._npcGfx.lineStyle(2, 0xffffff, 0.8);
        this._npcGfx.lineBetween(px - 3, py - 3, px + 3, py + 3);
        this._npcGfx.lineBetween(px + 3, py - 3, px - 3, py + 3);
      }
    }

    // Agents — orange with specialty-colored dot
    if (npcs.agents) {
      for (const agent of npcs.agents) {
        const dotColor = agent.specialty === 'combat' ? 0xff4040
          : agent.specialty === 'infiltration' ? 0xffff40
          : agent.specialty === 'sabotage' ? 0xff8000
          : 0x40c0ff; // intel
        drawEntity(agent, 0xc08030, 0xe0a040, dotColor);
      }
    }

    // Squads — red, slightly larger
    if (npcs.squads) {
      for (const squad of npcs.squads) {
        if (!squad.alive) continue;
        if (squad.location?.regionIndex !== regionIndex) continue;
        const px = squad.location.gridX * TILE_SIZE + TILE_SIZE / 2;
        const py = squad.location.gridY * TILE_SIZE + TILE_SIZE / 2;
        // Squad uses a square marker
        this._npcGfx.fillStyle(0xc05050, 0.7);
        this._npcGfx.fillRect(px - 7, py - 7, 14, 14);
        this._npcGfx.lineStyle(2, 0xff6060, 0.9);
        this._npcGfx.strokeRect(px - 7, py - 7, 14, 14);
        // Inner dot
        this._npcGfx.fillStyle(0xffffff, 0.8);
        this._npcGfx.fillCircle(px, py, 2);
      }
    }

    // Ambushes — yellow/red triangle markers (debug: shows hidden ambush positions)
    if (npcs.loyalistLeader?.ambushesSet) {
      for (const ambush of npcs.loyalistLeader.ambushesSet) {
        if (ambush.triggered) continue;
        if (ambush.regionIndex !== regionIndex) continue;
        const px = ambush.gridX * TILE_SIZE + TILE_SIZE / 2;
        const py = ambush.gridY * TILE_SIZE + TILE_SIZE / 2;
        // Triangle marker for ambush
        this._npcGfx.fillStyle(0xc0a020, 0.6);
        this._npcGfx.fillTriangle(
          px, py - 8,        // top
          px - 7, py + 5,    // bottom-left
          px + 7, py + 5     // bottom-right
        );
        this._npcGfx.lineStyle(2, 0xffd040, 0.9);
        this._npcGfx.strokeTriangle(
          px, py - 8,
          px - 7, py + 5,
          px + 7, py + 5
        );
        // Exclamation mark
        this._npcGfx.fillStyle(0xffffff, 0.8);
        this._npcGfx.fillRect(px - 1, py - 5, 2, 5);
        this._npcGfx.fillRect(px - 1, py + 2, 2, 2);
      }
    }
  }

  _drawPlayer(pos) {
    this._playerGfx.clear();
    if (!pos) { this._playerLabel.setVisible(false); return; }

    const px = pos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pos.y * TILE_SIZE + TILE_SIZE / 2;

    this._playerGfx.fillStyle(0x1e4a7a, 0.9);
    this._playerGfx.fillCircle(px, py, 11);
    this._playerGfx.lineStyle(2, 0xc8a84a, 0.9);
    this._playerGfx.strokeCircle(px, py, 11);

    this._playerLabel.setPosition(px, py).setVisible(true);
  }

  _drawMoveRange(pos, range) {
    this._highlightGfx.clear();
    if (!pos) return;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist = Math.abs(x - pos.x) + Math.abs(y - pos.y);
        if (dist > 0 && dist <= range) {
          const tile = this._lastGridState?.grid?.[y]?.[x];
          const terrain = tile?.terrain;
          if (terrain === 'water' || terrain === 'deep' || terrain === 'lava' || terrain === 'crevasse' || terrain === 'installation') continue;
          this._highlightGfx.fillStyle(0x1e4a7a, 0.2);
          this._highlightGfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  _drawFog(playerPos, visionRange, revealedTiles) {
    this._fogGfx.clear();
    if (!playerPos) return;

    const revealed = new Set(revealedTiles || []);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
        const key = `${x},${y}`;

        if (dist <= visionRange) {
          continue; // visible
        } else if (revealed.has(key)) {
          this._fogGfx.fillStyle(0x030608, 0.5); // dim fog
          this._fogGfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else {
          this._fogGfx.fillStyle(0x030608, 0.85); // full fog
          this._fogGfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }
}
