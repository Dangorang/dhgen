// worldData.js — Sector and world definitions for the Golgenna Reach
// This is pure data — no React. All mutable state (currentPhase, discovered flags)
// is persisted separately in localStorage under "dhgen_worlds".

export const SECTOR = {
  name: "The Golgenna Reach",
  worlds: [
    // ── VANTIS PRIME — active, explorable ─────────────────────────────────────
    {
      id: "vantis-prime",
      name: "Vantis Prime",
      type: "hive world",
      climate: "Toxic Industrial / Perpetual Smog",
      accessible: true,
      sectorPosition: { x: 42, y: 38 },

      biomes: [
        "Underhive",
        "Manufactorium",
        "Noble Spire",
        "Wastelands",
        "Starport District",
      ],

      locationsOfInterest: [
        {
          id: "loc-sump-market",
          name: "The Sump Market",
          description:
            "A sprawling black market beneath Hive Vantis where information and contraband change hands freely. Cult activity has been confirmed among the stall-keepers.",
          discovered: true,
        },
        {
          id: "loc-shrine-of-cogs",
          name: "Shrine of the Omnissiah",
          description:
            "A Mechanicus wayshrine within the Manufactorium belt. Tech-adepts report machine-spirits behaving erratically near the eastern annex — possible warp taint.",
          discovered: true,
        },
        {
          id: "loc-spire-court",
          name: "Court of the Spire",
          description:
            "The palatial residence of Planetary Governor Helvara. Intelligence suggests cult members have infiltrated the aristocracy. Access requires a cover identity.",
          discovered: false,
        },
        {
          id: "loc-terminus-bay9",
          name: "Terminus Docking Bay 9",
          description:
            "A restricted cargo bay where Inquisition agents intercepted encoded transmissions of unknown origin. The source remains unidentified.",
          discovered: false,
        },
      ],

      villain: {
        name: "Malachar Voss",
        title: "Demagogue of the Weeping Eye",
        affiliation: "Tzeentchian Cult — The Shadow Congregation",
        description:
          "A former Ecclesiarch turned heretic demagogue. Voss preaches a doctrine of inevitable change, drawing the desperate underhive masses into rituals of forbidden knowledge. He moves between the hive spires and the depths with uncanny ease, always one step ahead of Imperial pursuit. His true face has never been confirmed; he is believed to wear many guises.",
        threat: "Extremis Diabolicus",
      },

      storyArc: {
        name: "The Shadow Congregation",
        phases: [
          {
            id: 1,
            label: "Investigation",
            description:
              "Gather intelligence on cult operations across the hive. Identify key locations, rank-and-file cultists, and the hierarchy feeding reports to Voss.",
          },
          {
            id: 2,
            label: "Confrontation",
            description:
              "Disrupt the cult's ritual schedule. Eliminate lieutenants, expose noble-tier corruption, and deny Voss his sanctuaries.",
          },
          {
            id: 3,
            label: "Endgame",
            description:
              "Locate Malachar Voss and end him before the Great Ritual reaches completion. The fate of Vantis Prime hangs in the balance.",
          },
        ],
        currentPhase: 1,
      },

      missions: [
        {
          id: "msn-dead-drop",
          name: "Dead Drop at the Sump Market",
          type: "Infiltration",
          description:
            "An Inquisitorial asset went silent three days ago. Recover their final data-slate from a dead drop beneath the Sump Market before cult agents claim it.",
          unlockPhase: 1,
          discovered: true,
        },
        {
          id: "msn-errant-spirit",
          name: "The Errant Machine-Spirit",
          type: "Retrieval",
          description:
            "Mechanicus adepts have quarantined the eastern annex of the Omnissiah Shrine. Recover corrupted data-cores before the tech-priests purge them — they may contain evidence of Voss's rituals.",
          unlockPhase: 1,
          discovered: false,
        },
        {
          id: "msn-masks-of-spire",
          name: "Masks of the Spire",
          type: "Infiltration",
          description:
            "The Governor hosts a masked gala in three days. Intelligence suggests Voss's lieutenants will attend. Identify them among the nobility without breaking cover.",
          unlockPhase: 2,
          discovered: false,
        },
        {
          id: "msn-weeping-eye",
          name: "The Weeping Eye Revealed",
          type: "Purge",
          description:
            "CLASSIFIED — Inquisition Eyes Only. Ordo Hereticus authorisation required to access operational details.",
          unlockPhase: 3,
          discovered: false,
        },
      ],
    },

    // ── LOCKED WORLDS — placeholder, not yet explorable ───────────────────────
    {
      id: "hephaeron-secundus",
      name: "Hephaeron Secundus",
      type: "forge world",
      climate: "CLASSIFIED",
      accessible: false,
      sectorPosition: { x: 68, y: 25 },
    },
    {
      id: "pale-ossuary",
      name: "The Pale Ossuary",
      type: "cemetery world",
      climate: "CLASSIFIED",
      accessible: false,
      sectorPosition: { x: 20, y: 62 },
    },
    {
      id: "vorruk-fen",
      name: "Vorruk-Fen",
      type: "feral world",
      climate: "CLASSIFIED",
      accessible: false,
      sectorPosition: { x: 78, y: 68 },
    },
    {
      id: "sanctum-aurelius",
      name: "Sanctum Aurelius",
      type: "shrine world",
      climate: "CLASSIFIED",
      accessible: false,
      sectorPosition: { x: 50, y: 80 },
    },
  ],
};
