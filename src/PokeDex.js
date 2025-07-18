// src/PokeDex.js
import React, { useState, useEffect } from "react";
import { useAxios } from "./hooks";
import PokemonSelect from "./PokemonSelect";
import PokemonCard from "./PokemonCard";
import BattleArena from "./BattleArena";
import { formatPokemon } from "./helpers";
import "./PokeDex.css";

function PokeDex() {
  const [fetchedPokemon, fetchPokemon, clearFetchedPokemon] = useAxios(
    "pokemonCards", // localStorageKey
    "https://pokeapi.co/api/v2/pokemon/", // base URL
    formatPokemon // formatter
  );

  const [player1Team, setPlayer1Team] = useState([]);
  const [player2Team, setPlayer2Team] = useState([]);
  const [activePlayer, setActivePlayer] = useState(1); // 1 for Player 1, 2 for Player 2
  const [selectionPhase, setSelectionPhase] = useState(true); // True during team selection, false during battle
  const TEAM_SIZE = 3; // Define the size of each player's team

  /**
   * Handles adding a selected Pokemon to the current active player's team.
   * This function is passed to PokemonSelect.
   */
  const handleAddPokemonToTeam = async (pokemonName) => {
    if (!selectionPhase) return; // Only allow adding during selection phase

    try {
      // Temporarily clear fetchedPokemon to ensure the next fetch is distinct
      clearFetchedPokemon();
      // Fetch the Pokemon data. useAxios will update 'fetchedPokemon' state.
      await fetchPokemon(pokemonName);
    } catch (error) {
      console.error("Error fetching Pokemon:", error);
      alert("Failed to fetch Pokemon. Please try again.");
    }
  };

  /**
   * Effect to process the 'fetchedPokemon' and add it to the correct team.
   * Runs whenever 'fetchedPokemon' changes.
   */
  useEffect(() => {
    // Ensure there's a newly fetched Pokemon and we are in the selection phase
    if (selectionPhase && fetchedPokemon.length > 0) {
      const latestPokemon = fetchedPokemon[fetchedPokemon.length - 1]; // Get the most recently fetched pokemon

      if (latestPokemon && latestPokemon.name) {
        let teamToUpdate, setTeamFunction;
        if (activePlayer === 1) {
          teamToUpdate = player1Team;
          setTeamFunction = setPlayer1Team;
        } else {
          teamToUpdate = player2Team;
          setTeamFunction = setPlayer2Team;
        }

        // Prevent adding duplicates to the current player's team
        if (!teamToUpdate.some(p => p.name === latestPokemon.name)) {
          if (teamToUpdate.length < TEAM_SIZE) {
            setTeamFunction(prevTeam => [...prevTeam, latestPokemon]);
            // Clear fetchedPokemon after successfully adding to team
            clearFetchedPokemon();
          } else {
            alert(`Player ${activePlayer} team is full! Cannot add ${latestPokemon.name}.`);
            clearFetchedPokemon(); // Clear fetched data if team is full
          }
        } else {
          alert(`${latestPokemon.name} is already in Player ${activePlayer}'s team.`);
          clearFetchedPokemon(); // Clear fetched data if duplicate
        }
      }
    }
  }, [fetchedPokemon, activePlayer, player1Team, player2Team, selectionPhase, clearFetchedPokemon]);

  /**
   * Allows a player to remove a Pokemon from their team during selection.
   */
  const handleRemovePokemonFromTeam = (pokemonId, playerNum) => {
    if (!selectionPhase) return;

    if (playerNum === 1) {
      setPlayer1Team(prevTeam => prevTeam.filter(p => p.id !== pokemonId));
    } else if (playerNum === 2) {
      setPlayer2Team(prevTeam => prevTeam.filter(p => p.id !== pokemonId));
    }
  };

  /**
   * Allows reordering Pokemon within a team.
   * @param {string} pokemonId - The ID of the Pokemon to move.
   * @param {number} direction - -1 for up, 1 for down.
   * @param {number} playerNum - The player number (1 or 2).
   */
  const handleReorderPokemon = (pokemonId, direction, playerNum) => {
    let team, setTeamFunction;
    if (playerNum === 1) {
      team = [...player1Team]; // Create a mutable copy
      setTeamFunction = setPlayer1Team;
    } else {
      team = [...player2Team]; // Create a mutable copy
      setTeamFunction = setPlayer2Team;
    }

    const index = team.findIndex(p => p.id === pokemonId);
    if (index === -1) return; // Pokemon not found

    const newIndex = index + direction;

    // Check bounds
    if (newIndex >= 0 && newIndex < team.length) {
      const [movedPokemon] = team.splice(index, 1); // Remove from current position
      team.splice(newIndex, 0, movedPokemon); // Insert at new position
      setTeamFunction(team); // Update state with reordered team
    }
  };

  /**
   * Handles the "Done Selecting" button click.
   */
  const handleDoneSelecting = () => {
    if (activePlayer === 1) {
      if (player1Team.length === TEAM_SIZE) {
        setActivePlayer(2); // Switch to Player 2
        clearFetchedPokemon(); // Ensure no lingering fetched Pokemon for P2's first pick
      } else {
        alert(`Player 1, please select ${TEAM_SIZE} Pokemon for your team.`);
      }
    } else if (activePlayer === 2) {
      if (player2Team.length === TEAM_SIZE) {
        setSelectionPhase(false); // Both teams are full, start battle
        console.log("Team selection complete. Starting battle!");
      } else {
        alert(`Player 2, please select ${TEAM_SIZE} Pokemon for your team.`);
      }
    }
  };

  /**
   * Resets the entire game to the initial selection phase.
   */
  const resetGame = () => {
    clearFetchedPokemon(); // Clear any lingering fetched data
    setPlayer1Team([]);
    setPlayer2Team([]);
    setActivePlayer(1);
    setSelectionPhase(true);
  };

  return (
    <div className="PokeDex">
      {selectionPhase ? (
        <div className="PokeDex-selection-phase">
          <h3>Player {activePlayer}, select your team ({activePlayer === 1 ? player1Team.length : player2Team.length}/{TEAM_SIZE}):</h3>
          <PokemonSelect add={handleAddPokemonToTeam} />
          
          <div className="team-display">
            <div className="player-team-section">
              <h4>Player 1 Team ({player1Team.length}/{TEAM_SIZE}):</h4>
              <div className="team-cards">
                {player1Team.map((p, idx) => (
                  <PokemonCard
                    key={p.id}
                    {...p}
                    onRemove={() => handleRemovePokemonFromTeam(p.id, 1)}
                    isRemovable={true}
                    onMoveUp={idx > 0 ? () => handleReorderPokemon(p.id, -1, 1) : null}
                    onMoveDown={idx < player1Team.length - 1 ? () => handleReorderPokemon(p.id, 1, 1) : null}
                  />
                ))}
              </div>
            </div>
            <div className="player-team-section">
              <h4>Player 2 Team ({player2Team.length}/{TEAM_SIZE}):</h4>
              <div className="team-cards">
                {player2Team.map((p, idx) => (
                  <PokemonCard
                    key={p.id}
                    {...p}
                    onRemove={() => handleRemovePokemonFromTeam(p.id, 2)}
                    isRemovable={true}
                    onMoveUp={idx > 0 ? () => handleReorderPokemon(p.id, -1, 2) : null}
                    onMoveDown={idx < player2Team.length - 1 ? () => handleReorderPokemon(p.id, 1, 2) : null}
                  />
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleDoneSelecting} className="done-selecting-btn">
            {activePlayer === 1 ? "Player 1 Done Selecting" : "Player 2 Done Selecting"}
          </button>
          <button onClick={resetGame} className="reset-game-btn">Reset Selection</button>
        </div>
      ) : (
        // Render BattleArena component during battle phase
        <BattleArena
          player1Team={player1Team}
          player2Team={player2Team}
          onResetGame={resetGame}
        />
      )}
    </div>
  );
}

export default PokeDex;
