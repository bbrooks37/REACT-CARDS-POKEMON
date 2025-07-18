// src/PokemonSelect.js
import React, { useState } from "react";
import pokemonList from "./pokemonList"; // Ensure this import path matches your actual filename case (e.g., pokemonList.js)
import { choice } from "./helpers"; // Only import choice, formatPokemon is used in PokeDex
import "./PokemonSelect.css"; // Assuming you have a CSS file for this component

/* Select element to choose from common pokemon for team building. */
function PokemonSelect({ add, pokemon = pokemonList }) {
  // State to store the currently selected Pokemon name string from the dropdown.
  // Initialize with the first Pokemon if the list is not empty, otherwise an empty string.
  const [selectedPokemonName, setSelectedPokemonName] = useState(pokemon.length > 0 ? pokemon[0] : "");

  /** Handles changes in the select dropdown. */
  const handleChange = evt => {
    setSelectedPokemonName(evt.target.value);
  };

  return (
    <div className="PokemonSelect">
      {/* Added id and name attributes for accessibility and form autofill warnings */}
      <select onChange={handleChange} value={selectedPokemonName} id="pokemon-select" name="pokemon-select">
        {/* Add a default empty option for better UX, allowing user to "select" nothing initially */}
        <option value="">Select a Pokemon</option>
        {/* Map over the pokemon list to create options. The value is the actual pokemon name string. */}
        {pokemon.map((p, idx) => (
          <option key={idx} value={p}>
            {p}
          </option>
        ))}
      </select>
      {/* Button to catch the currently selected Pokemon */}
      <button onClick={() => selectedPokemonName && add(selectedPokemonName + "/")} className="pokemon-select-btn">
        Add to Team!
      </button>
      {/* Button to catch a random Pokemon */}
      <button onClick={() => {
        const randomPokemon = choice(pokemon); // Use the choice helper to get a random pokemon name
        if (randomPokemon) { // Ensure a valid pokemon name was returned
          add(randomPokemon + "/"); // Pass the random pokemon name string with a trailing slash for the API
        }
      }} className="pokemon-select-btn">
        Random Pick!
      </button>
    </div>
  );
}

export default PokemonSelect;
