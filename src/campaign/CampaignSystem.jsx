// CampaignSystem.jsx — Top-level campaign screen router
// Owns the campaign state and renders the appropriate sub-screen.
import { useGameState } from "../systems/gameState";
import SectorMapView from "./SectorMapView";
import SystemView from "./SystemView";
import PlanetView from "./PlanetView";
import ExplorationSystem from "./ExplorationSystem";
import MissionSystem from "../missionSystem";
import { combatEndNarrative } from "../generation/narrativeGenerator";

export default function CampaignSystem({ onNavigate }) {
  const [state, dispatch] = useGameState();

  const handleNavigateHome = () => onNavigate("home");

  const handleCombatEnd = (result) => {
    // Mark the defeated NPC as dead on victory
    if (result.victory && state.combatContext?.sourceEntityId) {
      dispatch({
        type: "KILL_NPC",
        entityId: state.combatContext.sourceEntityId,
        entityType: state.combatContext.sourceEntityType,
      });
    }
    // Apply threat change based on combat outcome
    if (result.victory) {
      dispatch({ type: "UPDATE_THREAT", delta: 3 });
    } else {
      dispatch({ type: "UPDATE_THREAT", delta: 10 });
    }
    // Log combat narrative
    const narr = combatEndNarrative(result.victory, result.partyWounds || 0);
    if (narr) {
      dispatch({ type: "LOG_EVENT", event: { action: "combat_end", details: narr } });
    }
    dispatch({ type: "END_COMBAT" });
  };

  switch (state.screen) {
    case "system_view":
      return <SystemView state={state} dispatch={dispatch} />;

    case "planet_view":
      return <PlanetView state={state} dispatch={dispatch} />;

    case "region":
      return <ExplorationSystem state={state} dispatch={dispatch} />;

    case "combat":
      return (
        <MissionSystem
          initialEncounter={state.combatContext?.encounter}
          initialParty={state.combatContext?.party}
          onCombatEnd={handleCombatEnd}
          skipSelectionPhases
        />
      );

    case "sector_map":
    default:
      return (
        <SectorMapView
          state={state}
          dispatch={dispatch}
          onNavigateHome={handleNavigateHome}
        />
      );
  }
}
