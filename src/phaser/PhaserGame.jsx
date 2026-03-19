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
//   sceneClass  — Phaser Scene class to use (default: CombatScene)
//   updateEvent — EventBridge event name for grid state updates
//   clickEvent  — EventBridge event name for click forwarding
// ─────────────────────────────────────────────────────────────

const CANVAS_W = 600;
const CANVAS_H = 600;

export default function PhaserGame({ gridState, onGridClick, sceneClass, updateEvent, clickEvent }) {
  const containerRef  = useRef(null);
  const gameRef       = useRef(null);
  // phaserReady is React state so that when phaser-ready fires it causes a
  // re-render, which then reliably fires the gridState effect with the scene ready.
  const [phaserReady, setPhaserReady] = useState(false);

  // ── Mount / unmount Phaser ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const SceneToUse = sceneClass || CombatScene;
    const config = {
      type: Phaser.AUTO,
      width:  CANVAS_W,
      height: CANVAS_H,
      parent: containerRef.current,
      backgroundColor: '#060d18',
      pixelArt: true,
      scene: [SceneToUse],
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
  const clickEvt = clickEvent || 'grid-click';
  useEffect(() => {
    const handleClick = ({ x, y }) => onGridClick?.(x, y);
    eventBridge.on(clickEvt, handleClick);
    return () => eventBridge.off(clickEvt, handleClick);
  }, [onGridClick, clickEvt]);

  // ── Push grid state into Phaser whenever React state changes ─
  const updateEvt = updateEvent || 'update-grid';
  useEffect(() => {
    if (!phaserReady || !gridState) return;
    eventBridge.emit(updateEvt, gridState);
  }, [phaserReady, gridState, updateEvt]);

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
