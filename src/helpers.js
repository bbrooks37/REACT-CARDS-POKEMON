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

/* Format response data from the Pokemon API,
 * extracting the front image, back image,
 * and array of relevant stat information.
 *
 * *** ENHANCEMENT: Add default moves, initial status, and stat stages ***
 */
function formatPokemon(data) {
  // Define a comprehensive set of generic moves with various effects
  const allGenericMoves = [
    // Physical Attacks
    { name: "Tackle", type: "physical", power: 40, pp: 35, currentPp: 35, accuracy: 100, statusEffect: null, statChange: null, target: "opponent" },
    { name: "Quick Attack", type: "physical", power: 40, pp: 30, currentPp: 30, accuracy: 100, statusEffect: null, statChange: null, target: "opponent" },
    { name: "Poison Jab", type: "physical", power: 80, pp: 20, currentPp: 20, accuracy: 100, statusEffect: { type: "poison", chance: 0.3 }, statChange: null, target: "opponent" },
    { name: "Leaf Blade", type: "physical", power: 90, pp: 15, currentPp: 15, accuracy: 100, statusEffect: null, statChange: null, target: "opponent" },
    { name: "Fire Punch", type: "physical", power: 75, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "burn", chance: 0.1 }, statChange: null, target: "opponent" },
    { name: "Thunder Punch", type: "physical", power: 75, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "paralyze", chance: 0.1 }, statChange: null, target: "opponent" },
    { name: "Ice Punch", type: "physical", power: 75, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "freeze", chance: 0.1 }, statChange: null, target: "opponent" }, // Freeze is harder to implement fully
    { name: "Double Kick", type: "physical", power: 30, pp: 30, currentPp: 30, accuracy: 100, statusEffect: null, statChange: null, target: "opponent", hits: 2 }, // Hits twice

    // Special Attacks
    { name: "Flamethrower", type: "special", power: 90, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "burn", chance: 0.1 }, statChange: null, target: "opponent" },
    { name: "Hydro Pump", type: "special", power: 110, pp: 5, currentPp: 5, accuracy: 80, statusEffect: null, statChange: null, target: "opponent" },
    { name: "Thunderbolt", type: "special", power: 90, pp: 15, currentPp: 15, accuracy: 100, statusEffect: { type: "paralyze", chance: 0.1 }, statChange: null, target: "opponent" },
    { name: "Ice Beam", type: "special", power: 90, pp: 10, currentPp: 10, accuracy: 100, statusEffect: { type: "freeze", chance: 0.1 }, statChange: null, target: "opponent" },
    { name: "Psychic", type: "special", power: 90, pp: 10, currentPp: 10, accuracy: 100, statusEffect: { type: "special-defense-down", chance: 0.1 }, statChange: null, target: "opponent" },

    // Status Moves (no direct damage)
    { name: "Growl", type: "status", power: 0, pp: 40, currentPp: 40, accuracy: 100, statusEffect: null, statChange: { stat: "attack", stages: -1, target: "opponent" }, target: "opponent" },
    { name: "Tail Whip", type: "status", power: 0, pp: 30, currentPp: 30, accuracy: 100, statusEffect: null, statChange: { stat: "defense", stages: -1, target: "opponent" }, target: "opponent" },
    { name: "Swords Dance", type: "status", power: 0, pp: 20, currentPp: 20, accuracy: 100, statusEffect: null, statChange: { stat: "attack", stages: 2, target: "self" }, target: "self" },
    { name: "Amnesia", type: "status", power: 0, pp: 20, currentPp: 20, accuracy: 100, statusEffect: null, statChange: { stat: "special-defense", stages: 2, target: "self" }, target: "self" },
    { name: "Sleep Powder", type: "status", power: 0, pp: 15, currentPp: 15, accuracy: 75, statusEffect: { type: "sleep", turns: 2 }, statChange: null, target: "opponent" },
    { name: "Confuse Ray", type: "status", power: 0, pp: 10, currentPp: 10, accuracy: 100, statusEffect: { type: "confused", turns: 3 }, statChange: null, target: "opponent" },
  ];

  // Function to get a random subset of moves
  const getRandomMoves = (num) => {
    const shuffled = allGenericMoves.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  };

  // Assign 4 random moves to each Pokemon
  const assignedMoves = getRandomMoves(4).map(move => ({ ...move, currentPp: move.pp })); // Ensure currentPp is initialized

  // Initialize stat stages for each Pokemon
  const initialStatStages = {
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0
  };

  return {
    id: uuidv4(), // Unique ID for this specific Pokemon instance
    name: data.name,
    front: data.sprites.front_default,
    back: data.sprites.back_default,
    stats: data.stats.map(stat => ({
      value: stat.base_stat,
      name: stat.stat.name
    })),
    moves: assignedMoves, // Add the assigned moves
    status: null, // Initial status (e.g., null, 'poisoned', 'paralyzed', 'burned', 'slept', 'confused')
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


export { choice, formatCard, formatPokemon, getEffectiveStat };
