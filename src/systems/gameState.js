// gameState.js — Campaign state management with useReducer + localStorage
import { useReducer, useEffect, useRef } from "react";

const STORAGE_KEY = "dhgen_campaign";

// ── Persistence ─────────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

// ── Initial state ───────────────────────────────────────────────────────────
export const INITIAL_STATE = {
  // Sector level
  sector: {
    stars: [],        // generated star systems
    currentStarId: null,
  },

  // Planet level (generated when entering a star system)
  planet: null,       // full planet data with regions

  // Exploration state (active during regional grid play)
  exploration: {
    currentRegionId: null,
    playerPosition: null,
    actionTick: 0,
    discoveredClues: [],
    eventLog: [],
    revealedTiles: [],
  },

  // NPC system
  npcs: {
    administrator: null,
    loyalistLeader: null,
    agents: [],
    squads: [],
  },

  // Threat system
  threat: {
    level: 0,
    tier: "Unaware",
  },

  // Navigation
  screen: "sector_map",
  previousScreen: null,

  // Deployed squad (up to 8 characters from roster)
  deployedSquad: [],

  // Combat context (for battle transitions)
  combatContext: null,
};

// ── Threat tier calculation ─────────────────────────────────────────────────
function getThreatTier(level) {
  if (level <= 20) return "Unaware";
  if (level <= 40) return "Cautious";
  if (level <= 60) return "Alerted";
  if (level <= 80) return "Threatened";
  return "Critical";
}

// ── Reducer ─────────────────────────────────────────────────────────────────
function gameReducer(state, action) {
  switch (action.type) {

    case "SET_SECTOR":
      return { ...state, sector: { ...state.sector, stars: action.stars } };

    case "SELECT_STAR":
      return {
        ...state,
        sector: { ...state.sector, currentStarId: action.starId },
        screen: "system_view",
      };

    case "BACK_TO_SECTOR":
      return {
        ...state,
        sector: { ...state.sector, currentStarId: null },
        screen: "sector_map",
      };

    case "SET_PLANET":
      return { ...state, planet: action.planet, screen: "planet_view" };

    case "SELECT_REGION":
      return {
        ...state,
        exploration: {
          ...state.exploration,
          currentRegionId: action.regionId,
          playerPosition: action.startPosition || { x: 10, y: 18 },
          actionTick: state.exploration.actionTick,
          revealedTiles: [],
        },
        screen: "region",
      };

    case "BACK_TO_PLANET":
      return { ...state, screen: "planet_view" };

    case "BACK_TO_SYSTEM":
      return { ...state, screen: "system_view" };

    case "MOVE_PLAYER":
      return {
        ...state,
        exploration: {
          ...state.exploration,
          playerPosition: action.position,
          actionTick: state.exploration.actionTick + 1,
        },
      };

    case "REVEAL_TILES":
      return {
        ...state,
        exploration: {
          ...state.exploration,
          revealedTiles: [
            ...new Set([...state.exploration.revealedTiles, ...action.tiles]),
          ],
        },
      };

    case "ADD_CLUE":
      return {
        ...state,
        exploration: {
          ...state.exploration,
          discoveredClues: [...state.exploration.discoveredClues, action.clue],
        },
      };

    case "LOG_EVENT":
      return {
        ...state,
        exploration: {
          ...state.exploration,
          eventLog: [
            ...state.exploration.eventLog,
            { tick: state.exploration.actionTick, ...action.event },
          ],
        },
      };

    case "UPDATE_THREAT": {
      const newLevel = Math.max(0, Math.min(100, state.threat.level + action.delta));
      return {
        ...state,
        threat: { level: newLevel, tier: getThreatTier(newLevel) },
      };
    }

    case "SET_NPCS":
      return { ...state, npcs: action.npcs };

    case "UPDATE_PLANET":
      return { ...state, planet: action.planet };

    case "START_COMBAT":
      return {
        ...state,
        previousScreen: state.screen,
        screen: "combat",
        combatContext: action.context,
      };

    case "END_COMBAT":
      return {
        ...state,
        screen: state.previousScreen || "region",
        previousScreen: null,
        combatContext: null,
      };

    case "KILL_NPC": {
      const { entityId, entityType } = action;
      const npcs = { ...state.npcs };
      if (entityType === "agent") {
        npcs.agents = npcs.agents.map(a =>
          a.id === entityId ? { ...a, alive: false, hidden: false } : a
        );
      } else if (entityType === "squad") {
        npcs.squads = npcs.squads.map(s =>
          s.id === entityId ? { ...s, alive: false, hidden: false } : s
        );
      } else if (entityType === "ambush" && npcs.loyalistLeader) {
        // Remove triggered ambush from leader's list
        npcs.loyalistLeader = {
          ...npcs.loyalistLeader,
          ambushesSet: (npcs.loyalistLeader.ambushesSet || []).map(a =>
            a.id === entityId ? { ...a, triggered: true } : a
          ),
        };
      } else if (entityType === "leader" && npcs.loyalistLeader?.id === entityId) {
        npcs.loyalistLeader = { ...npcs.loyalistLeader, alive: false, hidden: false };
      }
      return { ...state, npcs };
    }

    case "DEPLOY_SQUAD":
      return { ...state, deployedSquad: action.squad };

    case "NAVIGATE":
      return { ...state, screen: action.screen };

    case "NEW_CAMPAIGN":
      return { ...INITIAL_STATE, sector: { stars: action.stars || [], currentStarId: null } };

    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useGameState() {
  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    () => loadState() || INITIAL_STATE
  );

  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  return [state, dispatch];
}
