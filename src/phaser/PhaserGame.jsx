import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import CombatScene from './scenes/CombatScene.js';
import { eventBridge } from './EventBridge.js';

// ─────────────────────────────────────────────────────────────
// PhaserGame — React host component for the Phaser 3 canvas
//
// Props:
//   gridState   — object with all combat grid data (from React state)
//   onGridClick — callback(x, y) when a grid cell is clicked
// ─────────────────────────────────────────────────────────────

const CANVAS_W = 600;
const CANVAS_H = 600;

export default function PhaserGame({ gridState, onGridClick }) {
  const containerRef  = useRef(null);
  const gameRef       = useRef(null);
  // phaserReady is React state so that when phaser-ready fires it causes a
  // re-render, which then reliably fires the gridState effect with the scene ready.
  const [phaserReady, setPhaserReady] = useState(false);

  // ── Mount / unmount Phaser ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = {
      type: Phaser.AUTO,
      width:  CANVAS_W,
      height: CANVAS_H,
      parent: containerRef.current,
      backgroundColor: '#0a0804',
      pixelArt: true,
      scene: [CombatScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      banner: false,
    };

    gameRef.current = new Phaser.Game(config);

    const onReady = () => setPhaserReady(true);
    eventBridge.on('phaser-ready', onReady);

    return () => {
      eventBridge.off('phaser-ready', onReady);
      setPhaserReady(false);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // ── Forward Phaser grid clicks to React ─────────────────────
  useEffect(() => {
    const handleClick = ({ x, y }) => onGridClick?.(x, y);
    eventBridge.on('grid-click', handleClick);
    return () => eventBridge.off('grid-click', handleClick);
  }, [onGridClick]);

  // ── Push grid state into Phaser whenever React state changes ─
  // Depends on phaserReady so it re-fires the moment the scene signals ready,
  // guaranteeing sprites are drawn even when the player goes first (no other
  // state change would otherwise trigger the first update-grid emission).
  useEffect(() => {
    if (!phaserReady || !gridState) return;
    eventBridge.emit('update-grid', gridState);
  }, [phaserReady, gridState]);

  return (
    <div
      ref={containerRef}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        maxWidth: '100%',
        border: '1px solid #3a2510',
        background: '#0a0804',
        margin: '0 auto',
        display: 'block',
        position: 'relative',
      }}
    />
  );
}
