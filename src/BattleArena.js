// src/BattleArena.js
import React, { useState, useEffect, useRef } from "react";
import PokemonCard from "./PokemonCard"; // To display active Pokemon
import "./BattleArena.css"; // New CSS file for BattleArena styling

/* BattleArena component: Manages the battle logic and UI between two Pokemon teams. */
function BattleArena({ player1Team, player2Team, onResetGame }) {
  // Internal state to manage the *current battle status* of each team
  // Each Pokemon in these arrays will have a 'currentHp' property
  const [player1BattleTeam, setPlayer1BattleTeam] = useState([]);
  const [player2BattleTeam, setPlayer2BattleTeam] = useState([]);

  // State for the currently active Pokemon for each player (references objects from battle teams)
  const [activePokemonP1, setActivePokemonP1] = useState(null);
  const [activePokemonP2, setActivePokemonP2] = useState(null);

  // State to track whose turn it is (1 for Player 1, 2 for Player 2)
  const [turn, setTurn] = useState(1);

  // State for battle messages/log
  const [battleLog, setBattleLog] = useState([]);
  const battleLogRef = useRef(null); // Ref for auto-scrolling battle log

  // State to track if the battle is over
  const [battleOver, setBattleOver] = useState(false);
  const [winner, setWinner] = useState(null); // Stores the winner (Player 1 or Player 2)

  // State to manage the Pokemon switching UI
  const [isSwitching, setIsSwitching] = useState(false);
  const [playerToSwitch, setPlayerToSwitch] = useState(null); // Which player needs to switch (1 or 2)

  /** Helper to get a Pokemon's base stat value by name */
  const getStat = (pokemon, statName) => {
    const stat = pokemon.stats.find(s => s.name === statName);
    return stat ? stat.value : 0;
  };

  /** Helper to calculate HP percentage for health bars and determine color. */
  const getHpPercentage = (currentHp, originalHp) => {
    if (originalHp === 0) return 0;
    const percentage = (currentHp / originalHp) * 100;
    return Math.max(0, percentage); // Ensure it doesn't go below 0
  };

  const getHpBarColor = (percentage) => {
    if (percentage > 50) return '#00ff00'; // Green
    if (percentage > 20) return '#ffcc00'; // Yellow
    return '#ff4d4d'; // Red
  };

  /** Function to initialize or reset the battle. */
  const initializeBattle = () => {
    if (player1Team.length === 0 || player2Team.length === 0) {
      setBattleLog(["Error: Teams not fully selected!"]);
      return;
    }

    // Initialize battle teams with current HP for each Pokemon
    const initialP1BattleTeam = player1Team.map(p => ({
      ...p,
      currentHp: getStat(p, 'hp'),
      originalHp: getStat(p, 'hp'),
      isFainted: false // Add fainted status
    }));
    const initialP2BattleTeam = player2Team.map(p => ({
      ...p,
      currentHp: getStat(p, 'hp'),
      originalHp: getStat(p, 'hp'),
      isFainted: false
    }));

    setPlayer1BattleTeam(initialP1BattleTeam);
    setPlayer2BattleTeam(initialP2BattleTeam);

    // Set initial active Pokemon from the battle teams
    setActivePokemonP1(initialP1BattleTeam[0]);
    setActivePokemonP2(initialP2BattleTeam[0]);

    setTurn(1); // Player 1 starts
    setBattleLog(["Battle begins!"]);
    setBattleOver(false);
    setWinner(null);
    setIsSwitching(false);
    setPlayerToSwitch(null);
  };

  /** Effect to set up initial battle state when component mounts or teams change. */
  useEffect(() => {
    initializeBattle();
  }, [player1Team, player2Team]); // Rerun if teams change (e.g., on new game from PokeDex)

  /** Effect to scroll battle log to bottom */
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleLog]);

  /** Function to handle an attack. */
  const handleAttack = () => {
    if (battleOver || isSwitching) return; // Prevent attacks if battle is over or switching

    let attacker, defender;
    let setDefenderBattleTeam; // State setter for defender's battle team
    let defenderTeam; // Current battle team array
    let defenderTeamId; // To identify which player's team is being attacked

    if (turn === 1) {
      attacker = activePokemonP1;
      defender = activePokemonP2;
      setDefenderBattleTeam = setPlayer2BattleTeam;
      defenderTeam = player2BattleTeam;
      defenderTeamId = 2; // Player 2's team is being attacked
    } else {
      attacker = activePokemonP2;
      defender = activePokemonP1;
      setDefenderBattleTeam = setPlayer1BattleTeam;
      defenderTeam = player1BattleTeam;
      defenderTeamId = 1; // Player 1's team is being attacked
    }

    if (!attacker || !defender) {
      setBattleLog(prevLog => [...prevLog, "Error: Missing active Pokemon!"]);
      return;
    }

    // Get attacker's attack stat and defender's defense stat
    const attackerAttack = getStat(attacker, 'attack');
    const defenderDefense = getStat(defender, 'defense');

    // Damage calculation with critical hit chance (10% chance for 1.5x damage)
    const isCritical = Math.random() < 0.1; // 10% critical hit chance
    let baseDamage = Math.max(1, attackerAttack - defenderDefense / 2);
    if (isCritical) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }
    const randomFactor = Math.floor(Math.random() * 5) - 2; // -2 to +2 random damage
    const damageDealt = Math.max(1, baseDamage + randomFactor); // Ensure at least 1 damage

    // Calculate new HP for the defender
    const newDefenderHP = Math.max(0, defender.currentHp - damageDealt);

    // Update the defender's HP and fainted status in their respective battle team
    // This also updates the active Pokemon reference to ensure UI reflects latest HP
    const updatedDefenderTeam = defenderTeam.map(p =>
        p.id === defender.id ? { ...p, currentHp: newDefenderHP, isFainted: newDefenderHP <= 0 } : p
    );
    setDefenderBattleTeam(updatedDefenderTeam);

    // *** CRITICAL FIX: Ensure activePokemonP1/P2 always points to the latest updated object ***
    // This is done AFTER setDefenderBattleTeam to ensure we're getting the updated object.
    if (defenderTeamId === 1) { // Defender is Player 1's active Pokemon
        setActivePokemonP1(updatedDefenderTeam.find(p => p.id === defender.id));
    } else { // Defender is Player 2's active Pokemon
        setActivePokemonP2(updatedDefenderTeam.find(p => p.id === defender.id));
    }

    const attackMessage = `${attacker.name} attacked ${defender.name} for ${damageDealt} damage!`;
    setBattleLog(prevLog => [...prevLog, attackMessage]);
    if (isCritical) {
      setBattleLog(prevLog => [...prevLog, "It was a critical hit!"]);
    }

    // Check if defender fainted
    if (newDefenderHP <= 0) {
      const faintMessage = `${defender.name} fainted!`;
      setBattleLog(prevLog => [...prevLog, faintMessage]);

      // Filter remaining alive Pokemon from the *updated* defender team
      const remainingAliveTeam = updatedDefenderTeam.filter(p => !p.isFainted);

      if (remainingAliveTeam.length === 0) {
        // All Pokemon fainted for the defender, battle over
        const winningPlayer = turn === 1 ? "Player 1" : "Player 2";
        setWinner(winningPlayer);
        setBattleOver(true);
        setBattleLog(prevLog => [...prevLog, `${winningPlayer} wins the battle!`]);
      } else {
        // Defender has remaining Pokemon, prompt for switch
        setBattleLog(prevLog => [...prevLog, `Player ${defenderTeamId}, choose your next Pokemon!`]);
        setIsSwitching(true);
        setPlayerToSwitch(defenderTeamId); // Set which player needs to switch
      }
    } else {
      // Only switch turn if no one fainted and no switch is pending
      setTurn(prevTurn => (prevTurn === 1 ? 2 : 1));
    }
  };

  /** Function to handle switching a Pokemon. */
  const handleSwitchPokemon = (newPokemonId) => {
    if (battleOver || !isSwitching || !playerToSwitch) return;

    let newActivePokemon;
    let teamToSwitchFrom;

    if (playerToSwitch === 1) {
      teamToSwitchFrom = player1BattleTeam;
      newActivePokemon = teamToSwitchFrom.find(p => p.id === newPokemonId);
      if (newActivePokemon && newActivePokemon.id !== activePokemonP1?.id) {
        setActivePokemonP1(newActivePokemon); // Set the new active Pokemon
        setBattleLog(prevLog => [...prevLog, `Player 1 switched to ${newActivePokemon.name}!`]);
      }
    } else { // playerToSwitch === 2
      teamToSwitchFrom = player2BattleTeam;
      newActivePokemon = teamToSwitchFrom.find(p => p.id === newPokemonId);
      if (newActivePokemon && newActivePokemon.id !== activePokemonP2?.id) {
        // BUG: This line was referencing newPokemonId.name instead of newActivePokemon.name
        setActivePokemonP2(newActivePokemon); // Set the new active Pokemon
        setBattleLog(prevLog => [...prevLog, `Player 2 switched to ${newActivePokemon.name}!`]);
      }
    }

    setIsSwitching(false); // Exit switching mode
    setPlayerToSwitch(null);
    setTurn(prevTurn => (prevTurn === 1 ? 2 : 1)); // Switch turn after successful switch
  };

  // Helper to get currently alive benched Pokemon for switching UI
  const getAliveBenchedPokemon = (team, activePokemon) => {
    // Filter out the active Pokemon and any fainted Pokemon
    return team.filter(p => p.id !== activePokemon?.id && !p.isFainted);
  };

  // Render loading message if teams aren't ready
  if (!activePokemonP1 || !activePokemonP2) {
    return <p className="battle-loading">Preparing for battle...</p>;
  }

  return (
    <div className="BattleArena">
      <h2>Pokemon Battle!</h2>
      <div className="battle-display">
        {/* Player 1's Side */}
        <div className={`player-side player1-side ${turn === 1 && !battleOver && !isSwitching ? 'active-turn' : ''}`}>
          <h3>Player 1</h3>
          <PokemonCard {...activePokemonP1} isFainted={activePokemonP1.currentHp <= 0} currentHp={activePokemonP1.currentHp} originalHp={activePokemonP1.originalHp} />
          <div className="hp-bar-container">
            <div
              className="hp-bar"
              style={{
                width: `${getHpPercentage(activePokemonP1.currentHp, activePokemonP1.originalHp)}%`,
                backgroundColor: getHpBarColor(getHpPercentage(activePokemonP1.currentHp, activePokemonP1.originalHp))
              }}
            ></div>
          </div>
          <p>{activePokemonP1.name} HP: {activePokemonP1.currentHp}/{activePokemonP1.originalHp}</p>
          {!battleOver && turn === 1 && !isSwitching && (
            <div className="action-buttons">
              <button onClick={handleAttack} className="battle-action-btn attack-btn">Attack!</button>
              {getAliveBenchedPokemon(player1BattleTeam, activePokemonP1).length > 0 && (
                <button onClick={() => { setIsSwitching(true); setPlayerToSwitch(1); setBattleLog(prevLog => [...prevLog, "Player 1 chose to switch Pokemon."]); }} className="battle-action-btn switch-btn">Switch</button>
              )}
            </div>
          )}
        </div>

        {/* VS / Turn Indicator */}
        <div className="battle-center">
          <p className="turn-indicator">Turn: Player {turn}</p>
          {battleOver && <h3 className="battle-winner">{winner} Wins!</h3>}
          {!battleOver && isSwitching && playerToSwitch && (
            <div className="switch-pokemon-ui">
              <h4>Player {playerToSwitch}, choose next:</h4>
              <div className="benched-pokemon-list">
                {getAliveBenchedPokemon(playerToSwitch === 1 ? player1BattleTeam : player2BattleTeam, playerToSwitch === 1 ? activePokemonP1 : activePokemonP2)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchPokemon(p.id)}
                      className="benched-pokemon-btn"
                    >
                      {p.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Player 2's Side */}
        <div className={`player-side player2-side ${turn === 2 && !battleOver && !isSwitching ? 'active-turn' : ''}`}>
          <h3>Player 2</h3>
          <PokemonCard {...activePokemonP2} isFainted={activePokemonP2.currentHp <= 0} currentHp={activePokemonP2.currentHp} originalHp={activePokemonP2.originalHp} />
          <div className="hp-bar-container">
            <div
              className="hp-bar"
              style={{
                width: `${getHpPercentage(activePokemonP2.currentHp, activePokemonP2.originalHp)}%`,
                backgroundColor: getHpBarColor(getHpPercentage(activePokemonP2.currentHp, activePokemonP2.originalHp))
              }}
            ></div>
          </div>
          <p>{activePokemonP2.name} HP: {activePokemonP2.currentHp}/{activePokemonP2.originalHp}</p>
          {!battleOver && turn === 2 && !isSwitching && (
            <div className="action-buttons">
              <button onClick={handleAttack} className="battle-action-btn attack-btn">Attack!</button>
              {getAliveBenchedPokemon(player2BattleTeam, activePokemonP2).length > 0 && (
                <button onClick={() => { setIsSwitching(true); setPlayerToSwitch(2); setBattleLog(prevLog => [...prevLog, "Player 2 chose to switch Pokemon."]); }} className="battle-action-btn switch-btn">Switch</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Battle Log */}
      <div className="battle-log">
        <h4>Battle Log:</h4>
        <div className="log-messages" ref={battleLogRef}>
          {battleLog.map((msg, idx) => (
            <p key={idx}>{msg}</p>
          ))}
          {/* Removed the empty div for auto-scroll, now using ref on parent */}
        </div>
      </div>

      {/* Battle End / Reset Buttons */}
      {battleOver && (
        <button onClick={onResetGame} className="reset-game-btn">Play Again</button>
      )}
    </div>
  );
}

export default BattleArena;
