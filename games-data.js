(function () {
  "use strict";

  // Every title in this catalogue is fictional and exists only for this static demo.
  const genres = [
    {
      slug: "action",
      name: "Action",
      icon: "âš¡",
      description: "Fast-paced missions built around movement, timing, and cinematic set pieces."
    },
    {
      slug: "rpg",
      name: "RPG",
      icon: "ðŸ§™",
      description: "Character-driven adventures with exploration, progression, and meaningful choices."
    },
    {
      slug: "strategy",
      name: "Strategy",
      icon: "â™Ÿï¸",
      description: "Tactical challenges that reward planning, adaptation, and careful resource use."
    },
    {
      slug: "horror",
      name: "Horror",
      icon: "ðŸ‘»",
      description: "Atmospheric mysteries shaped by suspense, survival, and unsettling discoveries."
    },
    {
      slug: "racing",
      name: "Racing",
      icon: "ðŸ",
      description: "High-speed competition across city streets, circuits, and rough terrain."
    },
    {
      slug: "puzzle",
      name: "Puzzle",
      icon: "ðŸ§©",
      description: "Inventive problems that test logic, observation, and spatial reasoning."
    },
    {
      slug: "platformer",
      name: "Platformer",
      icon: "ðŸŽ®",
      description: "Precision movement through colorful worlds filled with secrets and obstacles."
    },
    {
      slug: "sports",
      name: "Sports",
      icon: "ðŸ†",
      description: "Arcade and simulation-inspired competition for solo and team play."
    },
    {
      slug: "shooter",
      name: "Shooter",
      icon: "ðŸŽ¯",
      description: "Target-focused challenges combining quick reactions with tactical positioning."
    },
    {
      slug: "sci-fi",
      name: "Sci-Fi",
      icon: "ðŸš€",
      description: "Futuristic journeys through distant worlds, strange technology, and deep space."
    },
    {
      slug: "fantasy",
      name: "Fantasy",
      icon: "ðŸ‰",
      description: "Mythic quests populated by ancient magic, legendary heroes, and hidden realms."
    },
    {
      slug: "rhythm",
      name: "Rhythm",
      icon: "ðŸŽµ",
      description: "Music-led challenges where every move, note, and obstacle follows the beat."
    }
  ];

  const games = [
    {
      id: "shadow-protocol",
      title: "Shadow Protocol",
      genre: "action",
      icon: "ðŸ¥·",
      description: "Slip through a neon megacity using stealth, parkour, and carefully timed takedowns.",
      rating: 9.2,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo highlight"
    },
    {
      id: "rogue-agent",
      title: "Rogue Agent",
      genre: "action",
      icon: "ðŸ•µï¸",
      description: "Uncover a fictional spy conspiracy through compact missions with branching objectives.",
      rating: 8.9,
      year: 2024,
      platforms: ["PC", "PlayStation"],
      badge: "Curated pick"
    },
    {
      id: "titan-assault",
      title: "Titan Assault",
      genre: "action",
      icon: "ðŸ¤–",
      description: "Pilot a towering mech through explosive encounters on distant colony worlds.",
      rating: 8.7,
      year: 2026,
      platforms: ["PC", "Xbox"],
      badge: "New concept"
    },
    {
      id: "realm-of-eternity",
      title: "Realm of Eternity",
      genre: "rpg",
      icon: "ðŸ§™",
      description: "Shape a wandering mage's story across a lore-rich realm of rival kingdoms.",
      rating: 9.5,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo favorite"
    },
    {
      id: "cursed-legacy",
      title: "Cursed Legacy",
      genre: "rpg",
      icon: "âš”ï¸",
      description: "Guide three generations of adventurers through a dark family prophecy.",
      rating: 8.9,
      year: 2026,
      platforms: ["PC", "PlayStation"],
      badge: "New concept"
    },
    {
      id: "wasteland-chronicles",
      title: "Wasteland Chronicles",
      genre: "rpg",
      icon: "ðŸœï¸",
      description: "Build alliances and make difficult choices in a hopeful post-collapse frontier.",
      rating: 9.0,
      year: 2024,
      platforms: ["PC", "Xbox"],
      badge: "Curated pick"
    },
    {
      id: "iron-citadel",
      title: "Iron Citadel",
      genre: "strategy",
      icon: "ðŸ°",
      description: "Build a fortified capital and coordinate armies across a shifting campaign map.",
      rating: 9.1,
      year: 2025,
      platforms: ["PC"],
      badge: "Demo favorite"
    },
    {
      id: "warlords-eternal",
      title: "Warlords Eternal",
      genre: "strategy",
      icon: "ðŸ›¡ï¸",
      description: "Balance diplomacy and turn-based battles as neighboring kingdoms compete for influence.",
      rating: 8.9,
      year: 2024,
      platforms: ["PC", "Switch"],
      badge: "Demo highlight"
    },
    {
      id: "galactic-dominion",
      title: "Galactic Dominion",
      genre: "strategy",
      icon: "ðŸª",
      description: "Research new technologies and negotiate with fictional civilizations among the stars.",
      rating: 9.0,
      year: 2026,
      platforms: ["PC"],
      badge: "New concept"
    },
    {
      id: "dread-manor",
      title: "Dread Manor",
      genre: "horror",
      icon: "ðŸ‘»",
      description: "Search an abandoned Victorian estate while its rooms quietly change around you.",
      rating: 8.8,
      year: 2026,
      platforms: ["PC", "PlayStation"],
      badge: "New concept"
    },
    {
      id: "silent-shadows",
      title: "Silent Shadows",
      genre: "horror",
      icon: "ðŸŒ«ï¸",
      description: "Navigate fog-covered streets and piece together a town's vanished history.",
      rating: 9.0,
      year: 2024,
      platforms: ["PC", "Xbox"],
      badge: "Demo favorite"
    },
    {
      id: "the-last-ritual",
      title: "The Last Ritual",
      genre: "horror",
      icon: "ðŸ•¯ï¸",
      description: "Investigate an occult mystery where each clue changes the possible ending.",
      rating: 8.6,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo highlight"
    },
    {
      id: "nitro-drift-x",
      title: "Nitro Drift X",
      genre: "racing",
      icon: "ðŸŽï¸",
      description: "Drift through neon circuits and gravity-bending exhibition tracks around the world.",
      rating: 8.7,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo highlight"
    },
    {
      id: "chrome-racer",
      title: "Chrome Racer",
      genre: "racing",
      icon: "ðŸš—",
      description: "Compete in a bright anti-gravity league with reactive tracks and bold electronic music.",
      rating: 8.3,
      year: 2026,
      platforms: ["PC", "Switch"],
      badge: "New concept"
    },
    {
      id: "rally-legends",
      title: "Rally Legends",
      genre: "racing",
      icon: "ðŸš™",
      description: "Master changing road surfaces across a fictional championship rally calendar.",
      rating: 8.8,
      year: 2024,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Curated pick"
    },
    {
      id: "quantum-breakpoint",
      title: "Quantum Breakpoint",
      genre: "puzzle",
      icon: "ðŸ§©",
      description: "Bend gravity and momentum to reconnect rooms split across fractured dimensions.",
      rating: 8.4,
      year: 2026,
      platforms: ["PC", "Switch"],
      badge: "New concept"
    },
    {
      id: "portal-paradox",
      title: "Portal Paradox",
      genre: "puzzle",
      icon: "ðŸŒ€",
      description: "Link impossible spaces and find creative routes through a surreal research complex.",
      rating: 9.3,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo favorite"
    },
    {
      id: "mind-maze",
      title: "Mind Maze",
      genre: "puzzle",
      icon: "ðŸ§ ",
      description: "Decode visual patterns in a dreamlike labyrinth that responds to each solution.",
      rating: 8.7,
      year: 2024,
      platforms: ["PC", "Mobile"],
      badge: "Curated pick"
    },
    {
      id: "pixel-jump",
      title: "Pixel Jump",
      genre: "platformer",
      icon: "ðŸŽ®",
      description: "Leap through compact retro-inspired stages with precise controls and hidden routes.",
      rating: 8.6,
      year: 2026,
      platforms: ["PC", "Switch"],
      badge: "New concept"
    },
    {
      id: "sky-runner",
      title: "Sky Runner",
      genre: "platformer",
      icon: "â˜ï¸",
      description: "Climb a chain of floating islands where wind changes every jump.",
      rating: 8.8,
      year: 2025,
      platforms: ["PC", "PlayStation", "Switch"],
      badge: "Curated pick"
    },
    {
      id: "neon-dash",
      title: "Neon Dash",
      genre: "platformer",
      icon: "âœ¨",
      description: "Race across glowing obstacle courses that pulse in time with an original soundtrack.",
      rating: 8.7,
      year: 2024,
      platforms: ["PC", "Xbox"],
      badge: "Demo highlight"
    },
    {
      id: "soccer-legends-26",
      title: "Soccer Legends 26",
      genre: "sports",
      icon: "âš½",
      description: "Manage a fictional club and take it through a fast, accessible league season.",
      rating: 8.5,
      year: 2026,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo highlight"
    },
    {
      id: "court-dynasty",
      title: "Court Dynasty",
      genre: "sports",
      icon: "ðŸ€",
      description: "Draft a custom basketball roster and guide it through a fictional pro circuit.",
      rating: 8.8,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo favorite"
    },
    {
      id: "ultimate-tennis",
      title: "Ultimate Tennis",
      genre: "sports",
      icon: "ðŸŽ¾",
      description: "Learn timing and placement across colorful courts in solo and doubles matches.",
      rating: 8.4,
      year: 2024,
      platforms: ["PC", "Switch"],
      badge: "Curated pick"
    },
    {
      id: "warzone-elite",
      title: "Warzone Elite",
      genre: "shooter",
      icon: "ðŸŽ¯",
      description: "Coordinate a fictional squad through objective-based arenas with destructible cover.",
      rating: 9.0,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo highlight"
    },
    {
      id: "apex-squad",
      title: "Apex Squad",
      genre: "shooter",
      icon: "ðŸ’¥",
      description: "Combine distinct abilities in quick team challenges built for replayable sessions.",
      rating: 8.9,
      year: 2024,
      platforms: ["PC", "Xbox"],
      badge: "Demo favorite"
    },
    {
      id: "frontline-assault",
      title: "Frontline Assault",
      genre: "shooter",
      icon: "ðŸª–",
      description: "Capture objectives across large fictional battlefields with vehicles and squad commands.",
      rating: 8.7,
      year: 2026,
      platforms: ["PC", "PlayStation"],
      badge: "New concept"
    },
    {
      id: "stellar-void",
      title: "Stellar Void",
      genre: "sci-fi",
      icon: "ðŸŒŒ",
      description: "Command a survey fleet, forge alliances, and investigate a silent region of the galaxy.",
      rating: 9.4,
      year: 2026,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Featured",
      featured: true
    },
    {
      id: "nebula-quest",
      title: "Nebula Quest",
      genre: "sci-fi",
      icon: "ðŸš€",
      description: "Explore unfamiliar planets and decode the remains of an ancient fictional culture.",
      rating: 8.7,
      year: 2025,
      platforms: ["PC", "Switch"],
      badge: "New concept"
    },
    {
      id: "colony-zero",
      title: "Colony Zero",
      genre: "sci-fi",
      icon: "ðŸ›¸",
      description: "Keep a remote settlement alive while studying the unusual world beneath it.",
      rating: 8.8,
      year: 2024,
      platforms: ["PC", "Xbox"],
      badge: "Curated pick"
    },
    {
      id: "dragon-kingdoms",
      title: "Dragon Kingdoms",
      genre: "fantasy",
      icon: "ðŸ‰",
      description: "Befriend mythical creatures and restore magic to a divided island realm.",
      rating: 9.2,
      year: 2025,
      platforms: ["PC", "PlayStation", "Xbox"],
      badge: "Demo favorite"
    },
    {
      id: "elven-chronicles",
      title: "Elven Chronicles",
      genre: "fantasy",
      icon: "ðŸ¹",
      description: "Protect an ancient forest by scouting trails, solving disputes, and confronting corruption.",
      rating: 8.8,
      year: 2024,
      platforms: ["PC", "Switch"],
      badge: "Curated pick"
    },
    {
      id: "wizard-academy",
      title: "Wizard Academy",
      genre: "fantasy",
      icon: "ðŸ“š",
      description: "Learn spells, make friends, and investigate a mystery beneath a school of magic.",
      rating: 8.7,
      year: 2026,
      platforms: ["PC", "PlayStation"],
      badge: "New concept"
    },
    {
      id: "beat-master",
      title: "Beat Master",
      genre: "rhythm",
      icon: "ðŸŽµ",
      description: "Follow original tracks across a colorful set of timing and pattern challenges.",
      rating: 8.8,
      year: 2025,
      platforms: ["PC", "Switch", "Mobile"],
      badge: "Demo highlight"
    },
    {
      id: "dance-floor-pro",
      title: "Dance Floor Pro",
      genre: "rhythm",
      icon: "ðŸ’ƒ",
      description: "Match upbeat routines in a playful local dance competition.",
      rating: 8.6,
      year: 2026,
      platforms: ["PlayStation", "Xbox", "Switch"],
      badge: "New concept"
    },
    {
      id: "synth-strike",
      title: "Synth Strike",
      genre: "rhythm",
      icon: "ðŸŽ¹",
      description: "Build electronic loops while clearing beat-driven stages in a virtual soundscape.",
      rating: 8.9,
      year: 2024,
      platforms: ["PC", "PlayStation"],
      badge: "Demo favorite"
    }
  ];

  window.NEXUS_DATA = { genres, games };
}());
