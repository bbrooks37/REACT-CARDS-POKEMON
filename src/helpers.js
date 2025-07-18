// src/helpers.js
import { v4 as uuidv4 } from 'uuid'; // Import the v4 function as uuidv4

/* Select a random element from values array. */
function choice(values) {
  const randIdx = Math.floor(Math.random() * values.length);
  return values[randIdx];
}

/* Format response data from the Deck of Cards API,
 * extracting just the image url, value, and suit. */
function formatCard(data) {
  if (!data || !Array.isArray(data.cards) || data.cards.length === 0) {
    console.error("formatCard received invalid or empty cards array:", data);
    return {
      image: "https://placehold.co/120x170/cccccc/333333?text=Error",
      id: uuidv4(),
      value: "ERROR",
      suit: "ERROR"
    };
  }
  const card = data.cards[0];
  return {
    image: card.image,
    id: uuidv4(),
    value: card.value,
    suit: card.suit
  };
}

// --- NEW: Type Effectiveness Chart ---
const typeChart = {
  normal: {
    rock: 0.5, ghost: 0, steel: 0.5
  },
  fire: {
    grass: 2, ice: 2, bug: 2, steel: 2,
    fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5
  },
  water: {
    fire: 2, ground: 2, rock: 2,
    water: 0.5, grass: 0.5, dragon: 0.5
  },
  grass: {
    water: 2, ground: 2, rock: 2,
    fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5
  },
  electric: {
    water: 2, flying: 2,
    grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0 // Ground immunity
  },
  ice: {
    grass: 2, ground: 2, flying: 2, dragon: 2,
    fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5
  },
  fighting: {
    normal: 2, ice: 2, rock: 2, dark: 2, steel: 2,
    poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 // Ghost immunity
  },
  poison: {
    grass: 2, fairy: 2,
    poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5
  },
  ground: {
    fire: 2, electric: 2, poison: 2, rock: 2, steel: 2,
    grass: 0.5, bug: 0.5, flying: 0 // Flying immunity
  },
  flying: {
    grass: 2, fighting: 2, bug: 2,
    electric: 0.5, rock: 0.5, steel: 0.5
  },
  psychic: {
    fighting: 2, poison: 2,
    psychic: 0.5, steel: 0.5, dark: 0 // Dark immunity
  },
  bug: {
    grass: 2, psychic: 2, dark: 2,
    fighting: 0.5, flying: 0.5, poison: 0.5, ghost: 0.5, steel: 0.5, fire: 0.5, fairy: 0.5
  },
  rock: {
    fire: 2, ice: 2, flying: 2, bug: 2,
    fighting: 0.5, ground: 0.5, steel: 0.5
  },
  ghost: {
    psychic: 2, ghost: 2,
    dark: 0.5, normal: 0, fighting: 0
  },
  dragon: {
    dragon: 2,
    steel: 0.5, fairy: 0 // Fairy immunity
  },
  steel: {
    ice: 2, rock: 2, fairy: 2,
    fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5
  },
  dark: {
    psychic: 2, ghost: 2,
    fighting: 0.5, dark: 0.5, fairy: 0.5
  },
  fairy: {
    fighting: 2, dragon: 2, dark: 2,
    poison: 0.5, steel: 0.5, fire: 0.5
  }
};

// Function to get type effectiveness multiplier
function getTypeEffectiveness(attackType, defenderType) {
  const effectiveness = typeChart[attackType]?.[defenderType];
  return effectiveness !== undefined ? effectiveness : 1; // Default to 1x if no specific rule
}

/* Format response data from the Pokemon API,
 * extracting the front image, back image,
 * and array of relevant stat information.
 *
 * *** ENHANCEMENT: Add default moves, initial status, stat stages, and TYPE ***
 */
function formatPokemon(data) {
  // Define a comprehensive set of generic moves with various effects
  const allGenericMoves = [
    // Physical Attacks
    { name: "Tackle", type: "normal", power: 40, pp: 35, currentPp: 35, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Quick Attack", type: "normal", power: 40, pp: 30, currentPp: 30, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Poison Jab", type: "poison", power: 80, pp: 20, currentPp: 20, accuracy: 100, statusEffect: { type: "poisoned", chance: 0.3 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Leaf Blade", type: "grass", power: 90, pp: 15, currentPp: 15, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Fire Punch", type: "fire", power: 75, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "burned", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Thunder Punch", type: "electric", power: 75, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "paralyzed", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Ice Punch", type: "ice", power: 75, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "frozen", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 }, // Freeze is harder to implement fully
    { name: "Double Kick", type: "fighting", power: 30, pp: 30, currentPp: 30, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", hits: 2, recoil: 0, healing: 0 }, // Hits twice
    { name: "Brave Bird", type: "flying", power: 120, pp: 15, currentPp: 15, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", recoil: 0.33, healing: 0 }, // Recoil move

    // Special Attacks
    { name: "Flamethrower", type: "fire", power: 90, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "burned", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Hydro Pump", type: "water", power: 110, pp: 5, currentPp: 5, accuracy: 80, statusEffect: null, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Thunderbolt", type: "electric", power: 90, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "paralyzed", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Ice Beam", type: "ice", power: 90, pp: 10, currentPp: 10, accuracy: 100, statusEffect: { type: "frozen", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Psychic", type: "psychic", power: 90, pp: 10, currentPp: 10, accuracy: 100, statusEffect: { type: "special-defense-down", chance: 0.1 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Energy Ball", type: "grass", power: 90, pp: 10, currentPp: 10, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", recoil: 0, healing: 0 },

    // Status Moves (no direct damage)
    { name: "Growl", type: "normal", power: 0, pp: 40, currentPp: 40, accuracy: 100, statusEffect: null, statChange: { stat: "attack", stages: -1, target: "opponent" }, target: "opponent", recoil: 0, healing: 0 },
    { name: "Tail Whip", type: "normal", power: 0, pp: 30, currentPp: 30, accuracy: 100, statusEffect: null, statChange: { stat: "defense", stages: -1, target: "opponent" }, target: "opponent", recoil: 0, healing: 0 },
    { name: "Swords Dance", type: "normal", power: 0, pp: 20, currentPp: 20, accuracy: 100, statusEffect: null, statChange: { stat: "attack", stages: 2, target: "self" }, target: "self", recoil: 0, healing: 0 },
    { name: "Amnesia", type: "psychic", power: 0, pp: 20, currentPp: 20, accuracy: 100, statusEffect: null, statChange: { stat: "special-defense", stages: 2, target: "self" }, target: "self", recoil: 0, healing: 0 },
    { name: "Sleep Powder", type: "grass", power: 0, pp: 15, currentPp: 15, accuracy: 75, statusEffect: { type: "slept", turns: 2 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Confuse Ray", type: "ghost", power: 0, pp: 10, currentPp: 10, accuracy: 100, statusEffect: { type: "confused", turns: 3 }, statChange: null, target: "opponent", recoil: 0, healing: 0 },
    { name: "Recover", type: "normal", power: 0, pp: 10, currentPp: 10, accuracy: 100, statusEffect: null, statChange: null, target: "self", recoil: 0, healing: 0.5 } // Healing move (50% of max HP)
  ];

  // Function to get a random subset of moves
  const getRandomMoves = (num) => {
    const shuffled = allGenericMoves.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  };

  // Assign 4 random moves to each Pokemon.
  const assignedMoves = getRandomMoves(4).map(move => ({ ...move, currentPp: move.pp })); // Ensure currentPp is initialized

  // Initialize stat stages for each Pokemon
  const initialStatStages = {
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0
  };

  // Extract the primary type from the Pokemon data.
  // Assuming the first type in the 'types' array is the primary one.
  const primaryType = data.types && data.types.length > 0 ? data.types[0].type.name : 'normal';


  return {
    id: uuidv4(), // Unique ID for this specific Pokemon instance
    name: data.name,
    front: data.sprites.front_default,
    back: data.sprites.back_default,
    type: primaryType, // Add the Pokemon's primary type
    stats: data.stats.map(stat => ({
      value: stat.base_stat,
      name: stat.stat.name
    })),
    moves: assignedMoves, // Add the assigned moves
    status: null, // Initial status (e.g., null, 'poisoned', 'paralyzed')
    statusTurns: 0, // Duration of status effect
    statStages: initialStatStages, // Initialize stat stages
    originalHp: data.stats.find(s => s.stat.name === 'hp')?.base_stat || 0 // Original HP
  };
}

// Stat stage multipliers (simplified for now)
const statStageMultipliers = {
  '-6': 0.25, '-5': 0.28, '-4': 0.33, '-3': 0.4, '-2': 0.5, '-1': 0.66,
  '0': 1,
  '1': 1.5, '2': 2, '3': 2.5, '4': 3, '5': 3.5, '6': 4
};

// Function to calculate effective stat based on stages
function getEffectiveStat(baseStat, stage) {
  const multiplier = statStageMultipliers[stage] || 1;
  return Math.floor(baseStat * multiplier);
}


export { choice, formatCard, formatPokemon, getEffectiveStat, getTypeEffectiveness };
