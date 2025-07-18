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
      suit: "ERROR" // Ensure suit is also provided for error cards
    };
  }
  const card = data.cards[0];
  return {
    image: card.image,
    id: uuidv4(),
    value: card.value,
    suit: card.suit // *** IMPORTANT: Include suit here ***
  };
}

/* Format response data from the Pokemon API,
 * extracting the front image, back image,
 * and array of relevant stat information. */
function formatPokemon(data) {
  return {
    id: uuidv4(),
    front: data.sprites.front_default,
    back: data.sprites.back_default,
    name: data.name,
    stats: data.stats.map(stat => ({
      value: stat.base_stat,
      name: stat.stat.name
    }))
  };
}

export { choice, formatCard, formatPokemon };
