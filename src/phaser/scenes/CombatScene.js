import Phaser from 'phaser';
import { eventBridge } from '../EventBridge.js';

const TILE_SIZE = 30;
const GRID_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// CombatScene — Phaser Scene that renders the tactical grid
//
// React → Phaser:  eventBridge.emit('update-grid', gridState)
// Phaser → React:  eventBridge.emit('grid-click', { x, y })
//                  eventBridge.emit('phaser-ready', {})
//
// Combat FX events (emitted from MissionSystem.jsx):
//   eventBridge.emit('combat-hit',   { targetType, targetIndex })
//   eventBridge.emit('combat-death', { targetType, targetIndex })
// ─────────────────────────────────────────────────────────────

export default class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatScene' });
    this.partySprites        = [];
    this.enemySprites        = [];
    this._highlightGfx       = null; // movement range overlay
    this._shootingGfx        = null; // shooting target overlay
    this._coneGfx            = null; // shot cone overlay (follows cursor)
    this._updateHandler      = null;
    this._hitHandler         = null;
    this._deathHandler       = null;
    this._shotHandler        = null; // ranged shot animation
    this._shotModeHandler    = null; // shot-mode active/inactive
    this._shotModeData       = null; // { active, fromPos, accuracy }
    this._pointerMoveHandler = null;
  }

  // ── Lifecycle ────────────────────────────────────────────────
  create() {
    this._drawGrid();

    // Register event listeners
    this._updateHandler = (data) => this._onUpdateGrid(data);
    this._hitHandler    = (data) => this._onCombatHit(data);
    this._deathHandler  = (data) => this._onCombatDeath(data);

    eventBridge.on('update-grid',  this._updateHandler);
    eventBridge.on('combat-hit',   this._hitHandler);
    eventBridge.on('combat-death', this._deathHandler);
    this._shotHandler = (data) => this._animateShot(data);
    eventBridge.on('combat-shot',  this._shotHandler);

    // Shot-mode cone overlay
    this._shotModeHandler = (data) => {
      this._shotModeData = data;
      if (!data.active && this._coneGfx) this._coneGfx.clear();
    };
    eventBridge.on('shot-mode', this._shotModeHandler);

    // Pointer input → forward grid clicks to React
    this.input.on('pointerdown', (pointer) => {
      const gx = Math.floor(pointer.x / TILE_SIZE);
      const gy = Math.floor(pointer.y / TILE_SIZE);
      if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        eventBridge.emit('grid-click', { x: gx, y: gy });
      }
    });

    // Pointer move → update cone overlay during targeting
    this._pointerMoveHandler = (pointer) => {
      if (!this._shotModeData?.active) return;
      const tileX = Math.floor(pointer.x / TILE_SIZE);
      const tileY = Math.floor(pointer.y / TILE_SIZE);
      if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
        if (this._coneGfx) this._coneGfx.clear();
        return;
      }
      this._drawCone(this._shotModeData.fromPos, tileX, tileY, this._shotModeData.accuracy);
    };
    this.input.on('pointermove', this._pointerMoveHandler);

    // Tell React the scene is ready
    eventBridge.emit('phaser-ready', {});
  }

  shutdown() {
    // Remove all event listeners when scene shuts down
    if (this._updateHandler)   eventBridge.off('update-grid',  this._updateHandler);
    if (this._hitHandler)      eventBridge.off('combat-hit',   this._hitHandler);
    if (this._deathHandler)    eventBridge.off('combat-death', this._deathHandler);
    if (this._shotHandler)     eventBridge.off('combat-shot',  this._shotHandler);
    if (this._shotModeHandler) eventBridge.off('shot-mode',    this._shotModeHandler);
    this.input.off('pointermove', this._pointerMoveHandler);
  }

  // ── Grid Background ──────────────────────────────────────────
  _drawGrid() {
    const gfx = this.add.graphics();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Checkerboard pattern
        const dark = (x + y) % 2 === 0;
        gfx.fillStyle(dark ? 0x130e08 : 0x1a1208);
        gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        // Subtle grid line
        gfx.lineStyle(1, 0x2a1a0a, 0.4);
        gfx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // ── Grid State Update (from React) ──────────────────────────
  _onUpdateGrid(data) {
    if (!this.sys?.game || !data) return;
    const {
      gridPositions,
      partyWounds,
      enemyWounds,
      currentTurn,
      initiativeOrder,
      party,
      enemies,
    } = data;

    this._drawMovementRange(data.movementHighlight);
    this._drawShootingTargets(data.shootingMode, gridPositions?.enemies, enemyWounds);
    if (gridPositions?.party)   this._updatePartySprites(gridPositions.party,   partyWounds,  currentTurn, initiativeOrder, party);
    if (gridPositions?.enemies) this._updateEnemySprites(gridPositions.enemies, enemyWounds,  currentTurn, initiativeOrder, enemies);
  }

  // ── Shooting Target Highlight ──────────────────────────────────
  _drawShootingTargets(shootingMode, enemyPositions, enemyWounds) {
    if (!this._shootingGfx) {
      this._shootingGfx = this.add.graphics();
      this._shootingGfx.setDepth(0.6); // above movement highlight, below sprites
    }
    this._shootingGfx.clear();
    if (!shootingMode || !enemyPositions) return;

    this._shootingGfx.fillStyle(0xff6600, 0.22);
    this._shootingGfx.lineStyle(2, 0xff8800, 0.75);

    enemyPositions.forEach((pos, i) => {
      if ((enemyWounds?.[i] || 0) > 0) {
        const px = pos.x * TILE_SIZE;
        const py = pos.y * TILE_SIZE;
        this._shootingGfx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        this._shootingGfx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    });
  }

  // ── Movement Range Highlight ──────────────────────────────────
  _drawMovementRange(highlight) {
    // Always clear previous highlights first
    if (this._highlightGfx) {
      this._highlightGfx.clear();
    } else {
      this._highlightGfx = this.add.graphics();
      // Draw below sprites but above grid — set depth between grid (0) and sprites (1)
      this._highlightGfx.setDepth(0.5);
    }

    if (!highlight) return;

    const { actorPos, range } = highlight;
    this._highlightGfx.fillStyle(0x336633, 0.28);
    this._highlightGfx.lineStyle(1, 0x55aa55, 0.45);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist = Math.abs(x - actorPos.x) + Math.abs(y - actorPos.y);
        if (dist > 0 && dist <= range) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          this._highlightGfx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          this._highlightGfx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }
  }

  // ── Party Sprites ────────────────────────────────────────────
  _updatePartySprites(positions, wounds, currentTurn, initiativeOrder, partyData) {
    positions.forEach((pos, i) => {
      const px = pos.x * TILE_SIZE + TILE_SIZE / 2;
      const py = pos.y * TILE_SIZE + TILE_SIZE / 2;

      const maxWounds     = partyData?.[i]?.wounds || 10;
      const currentWounds = wounds?.[i] || 0;
      const isDead        = currentWounds >= maxWounds;
      const initEntry     = (initiativeOrder || []).find(e => e.type === 'party' && e.index === i);
      const isActive      = initEntry != null && (initiativeOrder || []).indexOf(initEntry) === currentTurn;
      const label         = partyData?.[i]?.name ? partyData[i].name.substring(0, 2).toUpperCase() : String(i + 1);

      if (!this.partySprites[i]) {
        // Create sprite at target position immediately (no tween on first spawn)
        const rect = this.add.rectangle(px, py, TILE_SIZE - 4, TILE_SIZE - 4, 0x1a5a1a);
        rect.setStrokeStyle(1, 0x3a8a3a);
        const txt = this.add.text(px, py, label, {
          fontSize: '9px', color: '#5aba5a', fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.partySprites[i] = { rect, txt, gridX: pos.x, gridY: pos.y };
      } else {
        const sprite = this.partySprites[i];
        // Slide to new grid position
        if (sprite.gridX !== pos.x || sprite.gridY !== pos.y) {
          this.tweens.add({
            targets: [sprite.rect, sprite.txt],
            x: px, y: py,
            duration: 220,
            ease: 'Cubic.easeOut',
          });
          sprite.gridX = pos.x;
          sprite.gridY = pos.y;
        }
      }

      // Update visual state
      const sp = this.partySprites[i];
      if (!sp || !sp.rect?.active || !sp.txt?.active) return;

      if (isDead) {
        sp.rect.setFillStyle(0x1a1a1a);
        sp.rect.setStrokeStyle(1, 0x3a2020);
        sp.rect.setAlpha(0.45);
        sp.txt.setColor('#664444');
      } else if (isActive) {
        sp.rect.setFillStyle(0x287a28);
        sp.rect.setStrokeStyle(2, 0x55ff55);
        sp.rect.setAlpha(1);
        sp.txt.setColor('#aaffaa');
        // Pulse glow on active
        if (!sp._pulseTween) {
          sp._pulseTween = this.tweens.add({
            targets: sp.rect,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        // Stop pulse if it was active
        if (sp._pulseTween) { sp._pulseTween.stop(); sp._pulseTween = null; }
        sp.rect.setFillStyle(0x1a5a1a);
        sp.rect.setStrokeStyle(1, 0x3a8a3a);
        sp.rect.setAlpha(1);
        sp.txt.setColor('#5aba5a');
      }
    });

    // Remove sprites for party members no longer in array
    for (let i = positions.length; i < this.partySprites.length; i++) {
      this._destroySprite(this.partySprites, i);
    }
  }

  // ── Enemy Sprites ────────────────────────────────────────────
  _updateEnemySprites(positions, wounds, currentTurn, initiativeOrder, enemies) {
    positions.forEach((pos, i) => {
      const px = pos.x * TILE_SIZE + TILE_SIZE / 2;
      const py = pos.y * TILE_SIZE + TILE_SIZE / 2;

      const isDead    = (wounds?.[i] || 0) <= 0;
      const initEntry = (initiativeOrder || []).find(e => e.type === 'enemy' && e.index === i);
      const isActive  = initEntry != null && (initiativeOrder || []).indexOf(initEntry) === currentTurn;
      const label     = 'E' + (i + 1);

      if (!this.enemySprites[i]) {
        const rect = this.add.rectangle(px, py, TILE_SIZE - 4, TILE_SIZE - 4, 0x5a1a1a);
        rect.setStrokeStyle(1, 0x8a3a3a);
        const txt = this.add.text(px, py, label, {
          fontSize: '9px', color: '#fa5a5a', fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.enemySprites[i] = { rect, txt, gridX: pos.x, gridY: pos.y };
      } else {
        const sprite = this.enemySprites[i];
        if (sprite.gridX !== pos.x || sprite.gridY !== pos.y) {
          this.tweens.add({
            targets: [sprite.rect, sprite.txt],
            x: px, y: py,
            duration: 220,
            ease: 'Cubic.easeOut',
          });
          sprite.gridX = pos.x;
          sprite.gridY = pos.y;
        }
      }

      const sp = this.enemySprites[i];
      if (!sp || !sp.rect?.active || !sp.txt?.active) return;

      if (isDead) {
        if (sp._pulseTween) { sp._pulseTween.stop(); sp._pulseTween = null; }
        sp.rect.setFillStyle(0x0f0808);
        sp.rect.setStrokeStyle(1, 0x2a1515);
        sp.rect.setAlpha(0.35);
        sp.txt.setColor('#553333');
      } else if (isActive) {
        sp.rect.setFillStyle(0x8a2020);
        sp.rect.setStrokeStyle(2, 0xff5050);
        sp.rect.setAlpha(1);
        sp.txt.setColor('#ffaaaa');
        if (!sp._pulseTween) {
          sp._pulseTween = this.tweens.add({
            targets: sp.rect,
            alpha: 0.65,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        if (sp._pulseTween) { sp._pulseTween.stop(); sp._pulseTween = null; }
        sp.rect.setFillStyle(0x5a1a1a);
        sp.rect.setStrokeStyle(1, 0x8a3a3a);
        sp.rect.setAlpha(1);
        sp.txt.setColor('#fa5a5a');
      }
    });

    for (let i = positions.length; i < this.enemySprites.length; i++) {
      this._destroySprite(this.enemySprites, i);
    }
  }

  // ── Combat FX ────────────────────────────────────────────────
  _onCombatHit({ targetType, targetIndex }) {
    if (!this.sys?.isActive()) return;
    const sp = targetType === 'party'
      ? this.partySprites[targetIndex]
      : this.enemySprites[targetIndex];
    if (!sp?.rect) return;

    // Red flash
    const origColor = targetType === 'party' ? 0x1a5a1a : 0x5a1a1a;
    sp.rect.setFillStyle(0xff2020);
    this.time.delayedCall(120, () => {
      if (sp.rect?.active) sp.rect.setFillStyle(origColor);
    });

    // Alpha blink
    this.tweens.add({
      targets: sp.rect,
      alpha: 0.2,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });

    // Camera shake — intensity scales down for party hits (less jarring)
    const intensity = targetType === 'enemy' ? 0.008 : 0.005;
    this.cameras.main.shake(180, intensity);

    // Spawn hit particles (tiny red squares)
    this._spawnHitParticles(sp.rect.x, sp.rect.y, targetType === 'enemy' ? 0xff4444 : 0xffaa44);
  }

  _onCombatDeath({ targetType, targetIndex }) {
    if (!this.sys?.isActive()) return;
    const sp = targetType === 'party'
      ? this.partySprites[targetIndex]
      : this.enemySprites[targetIndex];
    if (!sp?.rect) return;

    if (sp._pulseTween) { sp._pulseTween.stop(); sp._pulseTween = null; }

    // Fade to grey
    sp.rect.setFillStyle(0x333333);
    sp.rect.setStrokeStyle(1, 0x444444);
    this.tweens.add({
      targets: [sp.rect, sp.txt],
      alpha: 0.3,
      duration: 600,
      ease: 'Power2',
    });

    this._spawnHitParticles(sp.rect.x, sp.rect.y, 0xaa2222, 10);
    this.cameras.main.shake(300, 0.012);
  }

  _spawnHitParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const size  = Phaser.Math.Between(2, 5);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(30, 90);
      const vx    = Math.cos(angle) * speed;
      const vy    = Math.sin(angle) * speed;

      const p = this.add.rectangle(x, y, size, size, color, 1);
      this.tweens.add({
        targets: p,
        x: x + vx * 0.5,
        y: y + vy * 0.5,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(250, 500),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Ranged Shot Animation ─────────────────────────────────────
  _animateShot({ fromPos, toPos, count, isHit, weaponClass }) {
    if (!this.sys?.isActive() || !fromPos || !toPos) return;

    // Weapon class → tracer colour
    const COLOR_MAP = {
      'Las':              0x00eeff,
      'Solid Projectile': 0xffdd44,
      'Plasma':           0x8844ff,
      'Bolter':           0xff5500,
      'Flamer':           0xff2200,
      'Psychic':          0xee44ff,
      'Phase':            0x44ffee,
      'Power':            0x4488ff,
      'Chain':            0xffaa44,
      'Mechadendrite':    0x88ff44,
    };
    const projColor = COLOR_MAP[weaponClass] || 0xffdd44;

    const fx = fromPos.x * TILE_SIZE + TILE_SIZE / 2;
    const fy = fromPos.y * TILE_SIZE + TILE_SIZE / 2;
    const tx = toPos.x  * TILE_SIZE + TILE_SIZE / 2;
    const ty = toPos.y  * TILE_SIZE + TILE_SIZE / 2;

    // count=0 = jam/misfire: muzzle flash fires but no projectiles leave the barrel
    // cap at 12 so a full-auto LMG burst is visually distinct but not a performance hit
    const shotCount = count > 0 ? Math.min(count, 12) : 0;

    // Muzzle flash at shooter origin (always fires — even on jam)
    const muzzle = this.add.rectangle(fx, fy, 12, 12, projColor, 1).setDepth(2);
    this.tweens.add({
      targets: muzzle, scaleX: 2.5, scaleY: 2.5, alpha: 0,
      duration: 80, ease: 'Power2',
      onComplete: () => muzzle.destroy(),
    });

    // Staggered projectiles
    for (let i = 0; i < shotCount; i++) {
      this.time.delayedCall(i * 55, () => {
        if (!this.sys?.isActive()) return;

        // Slight spread for burst shots
        const ox = shotCount > 1 ? Phaser.Math.FloatBetween(-5, 5) : 0;
        const oy = shotCount > 1 ? Phaser.Math.FloatBetween(-5, 5) : 0;

        const proj = this.add.rectangle(fx, fy, 4, 4, projColor, 1).setDepth(2);
        this.tweens.add({
          targets: proj,
          x: tx + ox, y: ty + oy,
          duration: 100,
          ease: 'Linear',
          onComplete: () => {
            proj.destroy();
            // Impact flash on first projectile when hit
            if (isHit && i === 0) {
              const flash = this.add.rectangle(tx, ty, TILE_SIZE, TILE_SIZE, projColor, 0.65).setDepth(2);
              this.tweens.add({
                targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6,
                duration: 160, ease: 'Power2',
                onComplete: () => flash.destroy(),
              });
              this._spawnHitParticles(tx, ty, projColor, 5);
            }
          },
        });
      });
    }
  }

  // ── Shot Cone Overlay (follows cursor during targeting) ───────
  _drawCone(fromPos, tileX, tileY, accuracy) {
    if (!this._coneGfx) {
      this._coneGfx = this.add.graphics();
      this._coneGfx.setDepth(0.75); // above shooting targets, below sprites
    }
    this._coneGfx.clear();

    const ax = fromPos.x * TILE_SIZE + TILE_SIZE / 2;
    const ay = fromPos.y * TILE_SIZE + TILE_SIZE / 2;
    const bx = tileX    * TILE_SIZE + TILE_SIZE / 2;
    const by = tileY    * TILE_SIZE + TILE_SIZE / 2;

    const dx  = bx - ax;
    const dy  = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Always draw the shot tracer line
    this._coneGfx.lineStyle(1, 0xffdd44, 0.8);
    this._coneGfx.beginPath();
    this._coneGfx.moveTo(ax, ay);
    this._coneGfx.lineTo(bx, by);
    this._coneGfx.strokePath();

    // If no scatter (single shot or accuracy=0), just show the line
    if (accuracy <= 0 || len < TILE_SIZE * 0.5) return;

    // Perpendicular unit vector (rotated 90°)
    const px = -dy / len;
    const py =  dx / len;

    // Half-width of the cone base at the cursor tile (accuracy in tiles)
    const halfWidth = accuracy * TILE_SIZE;

    // Triangle apex at shooter, base centred on cursor tile
    const x2 = bx + px * halfWidth;
    const y2 = by + py * halfWidth;
    const x3 = bx - px * halfWidth;
    const y3 = by - py * halfWidth;

    // Filled cone
    this._coneGfx.fillStyle(0xff8800, 0.13);
    this._coneGfx.beginPath();
    this._coneGfx.moveTo(ax, ay);
    this._coneGfx.lineTo(x2, y2);
    this._coneGfx.lineTo(x3, y3);
    this._coneGfx.closePath();
    this._coneGfx.fillPath();

    // Cone outline
    this._coneGfx.lineStyle(1, 0xff8800, 0.5);
    this._coneGfx.beginPath();
    this._coneGfx.moveTo(ax, ay);
    this._coneGfx.lineTo(x2, y2);
    this._coneGfx.lineTo(x3, y3);
    this._coneGfx.closePath();
    this._coneGfx.strokePath();
  }

  // ── Helpers ──────────────────────────────────────────────────
  _destroySprite(arr, i) {
    if (!arr[i]) return;
    if (arr[i]._pulseTween) arr[i]._pulseTween.stop();
    arr[i].rect?.destroy();
    arr[i].txt?.destroy();
    arr[i] = null;
  }
}
