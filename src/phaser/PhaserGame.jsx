import { useEffect, useRef } from 'react';
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
  const containerRef = useRef(null);
  const gameRef      = useRef(null);
  const readyRef     = useRef(false);
  const pendingRef   = useRef(null); // holds gridState emitted before scene was ready

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
      // Disable Phaser's default banner spam
      banner: false,
    };

    gameRef.current = new Phaser.Game(config);

    // Listen for scene ready → flush any pending grid state
    const onReady = () => {
      readyRef.current = true;
      if (pendingRef.current) {
        eventBridge.emit('update-grid', pendingRef.current);
        pendingRef.current = null;
      }
    };
    eventBridge.on('phaser-ready', onReady);

    return () => {
      eventBridge.off('phaser-ready', onReady);
      readyRef.current = false;
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
  useEffect(() => {
    if (!gridState) return;
    if (readyRef.current) {
      eventBridge.emit('update-grid', gridState);
    } else {
      // Cache for emission once scene is ready
      pendingRef.current = gridState;
    }
  }, [gridState]);

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
