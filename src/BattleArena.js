// src/BattleArena.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import PokemonCard from "./PokemonCard"; // To display active Pokemon
import { getEffectiveStat, getTypeEffectiveness } from "./helpers"; // Import new helpers
import "./BattleArena.css"; // New CSS file for BattleArena styling

/* BattleArena component: Manages the battle logic and UI between two Pokemon teams. */
function BattleArena({ player1Team, player2Team, onResetGame }) {
  // Internal state to manage the *current battle status* of each team
  // Each Pokemon in these arrays will have 'currentHp', 'originalHp', 'isFainted', 'currentPp', 'status', 'statusTurns', 'statStages'
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

  // State to manage selected move for current player
  const [selectedMove, setSelectedMove] = useState(null);

  // State for visual attack animation trigger
  const [attackingPlayer, setAttackingPlayer] = useState(null); // 1 or 2 for animation

  /** Helper to get a Pokemon's base stat value by name */
  const getBaseStat = (pokemon, statName) => {
    const stat = pokemon.stats.find(s => s.name === statName);
    return stat ? stat.value : 0;
  };

  /**
   * Helper to update a Pokemon's state within its battle team.
   * This is crucial for maintaining immutability and triggering re-renders.
   * @param {object} pokemonToUpdate - The Pokemon object with updated properties.
   * @param {number} playerNum - The player number (1 or 2).
   */
  const updatePokemonInTeam = useCallback((pokemonToUpdate, playerNum) => {
    if (playerNum === 1) {
      setPlayer1BattleTeam(prevTeam =>
        prevTeam.map(p => (p.id === pokemonToUpdate.id ? pokemonToUpdate : p))
      );
      // Ensure active Pokemon reference is also updated if it's the one being modified
      setActivePokemonP1(prevActive => (prevActive && prevActive.id === pokemonToUpdate.id ? pokemonToUpdate : prevActive));
    } else {
      setPlayer2BattleTeam(prevTeam =>
        prevTeam.map(p => (p.id === pokemonToUpdate.id ? pokemonToUpdate : p))
      );
      setActivePokemonP2(prevActive => (prevActive && prevActive.id === pokemonToUpdate.id ? pokemonToUpdate : prevActive));
    }
  }, [activePokemonP1, activePokemonP2]); // Dependencies for useCallback

  /** Function to initialize or reset the battle. */
  const initializeBattle = useCallback(() => {
    if (player1Team.length === 0 || player2Team.length === 0) {
      setBattleLog(["Error: Teams not fully selected!"]);
      return;
    }

    // Initialize battle teams with current HP, original HP, and reset move PP/status/statStages
    const initialP1BattleTeam = player1Team.map(p => ({
      ...p,
      currentHp: p.originalHp,
      isFainted: false,
      moves: p.moves.map(m => ({ ...m, currentPp: m.pp })), // Reset current PP
      status: null,
      statusTurns: 0,
      statStages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 } // Reset stat stages
    }));
    const initialP2BattleTeam = player2Team.map(p => ({
      ...p,
      currentHp: p.originalHp,
      isFainted: false,
      moves: p.moves.map(m => ({ ...m, currentPp: m.pp })), // Reset current PP
      status: null,
      statusTurns: 0,
      statStages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 } // Reset stat stages
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
    setSelectedMove(null); // Ensure no move is pre-selected on new game
    setAttackingPlayer(null); // Reset attacking player animation
  }, [player1Team, player2Team]); // Dependencies for useCallback

  /** Effect to set up initial battle state when component mounts or teams change. */
  useEffect(() => {
    initializeBattle();
  }, [initializeBattle]); // initializeBattle is now a dependency

  /** Effect to scroll battle log to bottom */
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleLog]);

  /** Function to handle a Pokemon fainting. */
  const handleFaint = useCallback((faintedPokemon, playerNum) => {
    let remainingAliveTeam;
    let opponentPlayerNum;

    if (playerNum === 1) {
      remainingAliveTeam = player1BattleTeam.filter(p => p.id !== faintedPokemon.id && !p.isFainted);
      opponentPlayerNum = 2;
    } else {
      remainingAliveTeam = player2BattleTeam.filter(p => p.id !== faintedPokemon.id && !p.isFainted);
      opponentPlayerNum = 1;
    }

    if (remainingAliveTeam.length === 0) {
      // All Pokemon fainted for this player, battle over
      const winningPlayer = opponentPlayerNum === 1 ? "Player 1" : "Player 2";
      setWinner(winningPlayer);
      setBattleOver(true);
      setBattleLog(prevLog => [...prevLog, `${winningPlayer} wins the battle!`]);
    } else {
      // Player has remaining Pokemon, prompt for switch
      setBattleLog(prevLog => [...prevLog, `Player ${playerNum}, your active Pokemon fainted! Choose your next Pokemon!`]);
      setIsSwitching(true);
      setPlayerToSwitch(playerNum); // Set which player needs to switch
      // Do NOT switch turn here. The fainted player gets to choose.
    }
  }, [player1BattleTeam, player2BattleTeam]); // Dependencies for useCallback

  /**
   * Calculates damage based on move type, effective stats, and type effectiveness.
   * @param {object} attacker - The attacking Pokemon.
   * @param {object} defender - The defending Pokemon.
   * @param {object} move - The move being used.
   * @returns {object} { damage: number, isCritical: boolean, typeEffectiveness: number }
   */
  const calculateDamage = useCallback((attacker, defender, move) => {
    let damageStatAttacker, defenseStatDefender;

    // Get effective stats considering stat stages
    if (move.type === 'physical') {
      damageStatAttacker = getEffectiveStat(getBaseStat(attacker, 'attack'), attacker.statStages.attack);
      defenseStatDefender = getEffectiveStat(getBaseStat(defender, 'defense'), defender.statStages.defense);
    } else if (move.type === 'special') {
      damageStatAttacker = getEffectiveStat(getBaseStat(attacker, 'special-attack'), attacker.statStages['special-attack']);
      defenseStatDefender = getEffectiveStat(getBaseStat(defender, 'special-defense'), defender.statStages['special-defense']);
    } else {
      return { damage: 0, isCritical: false, typeEffectiveness: 1 }; // Status moves deal no direct damage
    }

    // Get type effectiveness multiplier
    const typeEffectiveness = getTypeEffectiveness(move.type, defender.type);

    // Simplified damage formula
    let baseDamage = Math.max(1, (move.power * damageStatAttacker) / (defenseStatDefender * 2));
    baseDamage = baseDamage * typeEffectiveness; // Apply type effectiveness

    const isCritical = Math.random() < 0.1; // 10% critical hit chance
    if (isCritical) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }

    const randomFactor = Math.floor(Math.random() * 5) - 2; // -2 to +2 random damage
    const finalDamage = Math.max(1, Math.floor(baseDamage + randomFactor)); // Ensure at least 1 damage

    return { damage: finalDamage, isCritical, typeEffectiveness };
  }, [getBaseStat]); // getBaseStat is a dependency

  /**
   * Applies a stat change to a Pokemon.
   * @param {object} pokemon - The Pokemon to modify.
   * @param {string} stat - The stat to change ('attack', 'defense', etc.).
   * @param {number} stages - How many stages to change (+/-).
   * @returns {object} The updated Pokemon object.
   */
  const applyStatChange = useCallback((pokemon, stat, stages) => {
    const newStatStages = { ...pokemon.statStages };
    newStatStages[stat] = Math.min(6, Math.max(-6, newStatStages[stat] + stages)); // Clamp stages between -6 and +6
    return { ...pokemon, statStages: newStatStages };
  }, []);

  /**
   * Applies a status effect to a Pokemon.
   * @param {object} pokemon - The Pokemon to apply status to.
   * @param {string} type - Type of status ('poisoned', 'paralyzed', 'burned', 'slept', 'confused', 'frozen').
   * @param {number} turns - Duration of the status effect.
   * @returns {object} The updated Pokemon object.
   */
  const applyStatusEffect = useCallback((pokemon, type, turns) => {
    // Prevent applying status if already affected or immune (simplified)
    if (pokemon.status === type) {
      return pokemon; // Already has this status
    }
    // More complex: check for specific immunities or overlapping statuses
    if (type === 'slept' && (pokemon.status === 'paralyzed' || pokemon.status === 'frozen')) return pokemon;
    if (type === 'paralyzed' && (pokemon.status === 'slept' || pokemon.status === 'frozen')) return pokemon;
    if (type === 'frozen' && (pokemon.status === 'slept' || pokemon.status === 'paralyzed')) return pokemon;


    return { ...pokemon, status: type, statusTurns: turns };
  }, []);

  /**
   * Processes status effects at the start of each turn.
   * This useEffect runs when 'turn' changes.
   */
  useEffect(() => {
    // Only run if not battleOver or switching, and active Pokemon are set
    if (battleOver || isSwitching || !activePokemonP1 || !activePokemonP2) return;

    let currentActivePokemon, playerNum;
    if (turn === 1) {
      currentActivePokemon = activePokemonP1;
      playerNum = 1;
    } else {
      currentActivePokemon = activePokemonP2;
      playerNum = 2;
    }

    // Check if the current active Pokemon is already fainted.
    // This handles cases where a Pokemon faints from poison/burn at the end of the opponent's turn.
    if (currentActivePokemon.isFainted) {
      const remainingAliveTeam = (playerNum === 1 ? player1BattleTeam : player2BattleTeam).filter(p => !p.isFainted);
      if (remainingAliveTeam.length > 0) {
        setBattleLog(prevLog => [...prevLog, `Player ${playerNum}, your active Pokemon fainted! Choose your next Pokemon!`]);
        setIsSwitching(true);
        setPlayerToSwitch(playerNum);
      } else {
        // If no remaining Pokemon, battle should already be over
        if (!battleOver) { // Double check to prevent re-triggering win
            const winningPlayer = playerNum === 1 ? "Player 2" : "Player 1";
            setWinner(winningPlayer);
            setBattleOver(true);
            setBattleLog(prevLog => [...prevLog, `${winningPlayer} wins the battle!`]);
        }
      }
      return; // Stop further turn processing for fainted Pokemon
    }

    // Process status effects
    let updatedPokemon = { ...currentActivePokemon };
    let turnSkipped = false;

    if (updatedPokemon.status === 'poisoned' && updatedPokemon.statusTurns > 0) {
      const poisonDamage = Math.max(1, Math.floor(updatedPokemon.originalHp * 0.05));
      const newHp = Math.max(0, updatedPokemon.currentHp - poisonDamage);
      updatedPokemon = { ...updatedPokemon, currentHp: newHp, statusTurns: updatedPokemon.statusTurns - 1, isFainted: newHp <= 0 };
      setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} is hurt by poison for ${poisonDamage} damage!`]);
      if (newHp <= 0) {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} fainted from poison!`]);
        updatePokemonInTeam(updatedPokemon, playerNum); // Update status and HP before handling faint
        handleFaint(updatedPokemon, playerNum);
        return; // Stop turn if fainted
      }
    }

    if (updatedPokemon.status === 'burned' && updatedPokemon.statusTurns > 0) {
      const burnDamage = Math.max(1, Math.floor(updatedPokemon.originalHp * 0.0625)); // 1/16 of max HP
      const newHp = Math.max(0, updatedPokemon.currentHp - burnDamage);
      updatedPokemon = { ...updatedPokemon, currentHp: newHp, statusTurns: updatedPokemon.statusTurns - 1, isFainted: newHp <= 0 };
      setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} is hurt by its burn for ${burnDamage} damage!`]);
      if (newHp <= 0) {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} fainted from burn!`]);
        updatePokemonInTeam(updatedPokemon, playerNum);
        handleFaint(updatedPokemon, playerNum);
        return;
      }
    }

    // Handle frozen status (full turn skip until thawed)
    if (updatedPokemon.status === 'frozen') {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} is frozen solid!`]);
        if (Math.random() < 0.2) { // 20% chance to thaw
            setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} thawed out!`]);
            updatedPokemon.status = null;
            updatedPokemon.statusTurns = 0;
        } else {
            turnSkipped = true;
        }
    }

    if (updatedPokemon.status === 'paralyzed' && Math.random() < 0.25) { // 25% chance to be fully paralyzed
      setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} is paralyzed and can't move!`]);
      turnSkipped = true;
    }

    if (updatedPokemon.status === 'slept') {
      if (updatedPokemon.statusTurns > 0) {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} is fast asleep!`]);
        updatedPokemon.statusTurns -= 1; // Decrement sleep turns
        turnSkipped = true;
      } else {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} woke up!`]);
        updatedPokemon.status = null; // Clear sleep status
      }
    }

    if (updatedPokemon.status === 'confused') {
      if (updatedPokemon.statusTurns > 0) {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} is confused!`]);
        if (Math.random() < 0.5) { // 50% chance to hit self
          setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} hit itself in its confusion!`]);
          const confusionDamage = Math.max(1, Math.floor(getBaseStat(updatedPokemon, 'attack') * 0.2)); // Simplified self-damage
          const newHp = Math.max(0, updatedPokemon.currentHp - confusionDamage);
          updatedPokemon = { ...updatedPokemon, currentHp: newHp, isFainted: newHp <= 0 };
          setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} took ${confusionDamage} damage!`]);
          if (newHp <= 0) {
            setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} fainted from confusion!`]);
            updatePokemonInTeam(updatedPokemon, playerNum);
            handleFaint(updatedPokemon, playerNum);
            return;
          }
          turnSkipped = true; // Confusion self-hit consumes turn
        }
        updatedPokemon.statusTurns -= 1; // Decrement confusion turns
      } else {
        setBattleLog(prevLog => [...prevLog, `${updatedPokemon.name} snapped out of confusion!`]);
        updatedPokemon.status = null; // Clear confusion status
      }
    }

    // Apply any updates to the Pokemon's state in its team
    updatePokemonInTeam(updatedPokemon, playerNum);

    // If turn was skipped due to status, switch turn immediately
    if (turnSkipped) {
      setTurn(prevTurn => (prevTurn === 1 ? 2 : 1));
    }
  }, [turn, battleOver, isSwitching, activePokemonP1, activePokemonP2, player1BattleTeam, player2BattleTeam, updatePokemonInTeam, handleFaint, getBaseStat]); // Added getBaseStat to dependencies


  /**
   * Handles the AI's turn.
   * This function will decide whether to attack or switch, and which move/Pokemon to choose.
   */
  const handleAIAction = useCallback(() => {
    if (battleOver || isSwitching || turn !== 2) return; // Only for Player 2's turn and if not battling/switching

    const aiPokemon = activePokemonP2;
    const opponentPokemon = activePokemonP1;
    const aiTeam = player2BattleTeam;

    if (!aiPokemon || aiPokemon.isFainted) {
        // If AI's active Pokemon fainted, it must switch
        const aliveBenched = aiTeam.filter(p => !p.isFainted && p.id !== aiPokemon?.id);
        if (aliveBenched.length > 0) {
            const pokemonToSwitchTo = aliveBenched[0]; // Simple AI: pick first available
            setTimeout(() => {
                handleSwitchPokemon(pokemonToSwitchTo.id);
            }, 1500); // Simulate thinking time
            return;
        } else {
            // No alive Pokemon left, battle should be over (handled by handleFaint)
            return;
        }
    }

    // Simple AI strategy: If current HP is low (e.g., < 30% of original HP) and has healthy benched Pokemon, switch.
    const lowHpThreshold = aiPokemon.originalHp * 0.3;
    const aliveBenchedPokemon = aiTeam.filter(p => !p.isFainted && p.id !== aiPokemon.id);

    if (aiPokemon.currentHp < lowHpThreshold && aliveBenchedPokemon.length > 0) {
        const pokemonToSwitchTo = aliveBenchedPokemon[0]; // Simple AI: switch to first available
        setBattleLog(prevLog => [...prevLog, `Player 2 is considering a switch...`]);
        setTimeout(() => {
            handleSwitchPokemon(pokemonToSwitchTo.id);
        }, 2000); // Simulate thinking time for switch
        return;
    }

    // Otherwise, attack. Simple AI: pick a random available move that has PP.
    const availableMoves = aiPokemon.moves.filter(move => move.currentPp > 0);
    if (availableMoves.length > 0) {
        const moveChoice = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        setBattleLog(prevLog => [...prevLog, `Player 2 chose ${moveChoice.name}!`]);
        setSelectedMove(moveChoice); // Set the selected move for the AI
        setTimeout(() => {
            handleAttack(); // Execute the attack
        }, 1500); // Simulate thinking time
    } else {
        setBattleLog(prevLog => [...prevLog, `${aiPokemon.name} has no moves left! Player 2 must switch.`]);
        // Force switch if no moves left
        if (aliveBenchedPokemon.length > 0) {
            const pokemonToSwitchTo = aliveBenchedPokemon[0];
            setTimeout(() => {
                handleSwitchPokemon(pokemonToSwitchTo.id);
            }, 1500);
        } else {
            // No moves, no switches, battle over (should be caught by handleFaint)
        }
    }
  }, [battleOver, isSwitching, turn, activePokemonP1, activePokemonP2, player2BattleTeam, handleSwitchPokemon, handleAttack]); // Dependencies for useCallback

  // Effect to trigger AI action when it's Player 2's turn
  useEffect(() => {
    if (turn === 2 && !battleOver && !isSwitching) {
      handleAIAction();
    }
  }, [turn, battleOver, isSwitching, handleAIAction]);


  /** Function to handle an attack. */
  const handleAttack = () => {
    if (battleOver || isSwitching || !selectedMove) return; // Prevent attacks if battle is over, switching, or no move selected

    let attacker, defender;
    let attackerPlayerNum, defenderTeamId;

    if (turn === 1) {
      attacker = activePokemonP1;
      defender = activePokemonP2;
      attackerPlayerNum = 1;
      defenderTeamId = 2;
    } else {
      attacker = activePokemonP2;
      defender = activePokemonP1;
      attackerPlayerNum = 2;
      defenderTeamId = 1;
    }

    if (!attacker || !defender || attacker.isFainted || defender.isFainted) {
      setBattleLog(prevLog => [...prevLog, "Error: Invalid active Pokemon for attack!"]);
      return;
    }

    // Check if move has PP
    if (selectedMove.currentPp <= 0) {
        setBattleLog(prevLog => [...prevLog, `${attacker.name}'s ${selectedMove.name} has no PP left!`]);
        setSelectedMove(null); // Clear selected move
        setTurn(prevTurn => (prevTurn === 1 ? 2 : 1)); // Switch turn
        return;
    }

    // Decrement PP for the used move
    const updatedAttackerMoves = attacker.moves.map(m =>
      m.name === selectedMove.name ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m
    );
    const updatedAttacker = { ...attacker, moves: updatedAttackerMoves };
    updatePokemonInTeam(updatedAttacker, attackerPlayerNum); // Update attacker's state in their team

    // Trigger attack animation
    setAttackingPlayer(attackerPlayerNum);
    setTimeout(() => setAttackingPlayer(null), 500); // Reset animation after 0.5s

    // Check move accuracy (simplified)
    if (selectedMove.accuracy && Math.random() * 100 > selectedMove.accuracy) {
        setBattleLog(prevLog => [...prevLog, `${attacker.name}'s ${selectedMove.name} missed!`]);
        setSelectedMove(null);
        setTurn(prevTurn => (prevTurn === 1 ? 2 : 1));
        return;
    }

    // Handle different move categories
    if (selectedMove.type === 'status') {
        setBattleLog(prevLog => [...prevLog, `${attacker.name} used ${selectedMove.name}!`]);
        // Healing moves
        if (selectedMove.healing > 0) {
            const healingAmount = Math.floor(attacker.originalHp * selectedMove.healing);
            const newHp = Math.min(attacker.originalHp, attacker.currentHp + healingAmount);
            const healedAttacker = { ...updatedAttacker, currentHp: newHp };
            updatePokemonInTeam(healedAttacker, attackerPlayerNum);
            setBattleLog(prevLog => [...prevLog, `${attacker.name} recovered ${healingAmount} HP!`]);
        }
        // Stat change moves
        if (selectedMove.statChange) {
            let targetPokemon = selectedMove.statChange.target === 'self' ? updatedAttacker : defender;
            let targetPlayerNum = selectedMove.statChange.target === 'self' ? attackerPlayerNum : defenderTeamId;
            const newTargetPokemon = applyStatChange(targetPokemon, selectedMove.statChange.stat, selectedMove.statChange.stages);
            updatePokemonInTeam(newTargetPokemon, targetPlayerNum);
            setBattleLog(prevLog => [...prevLog, `${newTargetPokemon.name}'s ${selectedMove.statChange.stat} ${selectedMove.statChange.stages > 0 ? 'rose' : 'fell'}!`]);
        }
        // Status effect moves
        if (selectedMove.statusEffect) {
            if (Math.random() < (selectedMove.statusEffect.chance || 1)) {
                let targetPokemon = selectedMove.statusEffect.target === 'self' ? updatedAttacker : defender;
                let targetPlayerNum = selectedMove.statusEffect.target === 'self' ? attackerPlayerNum : defenderTeamId;
                const newTargetPokemon = applyStatusEffect(targetPokemon, selectedMove.statusEffect.type, selectedMove.statusEffect.turns);
                if (newTargetPokemon !== targetPokemon) { // Only log if status was actually applied
                    updatePokemonInTeam(newTargetPokemon, targetPlayerNum);
                    setBattleLog(prevLog => [...prevLog, `${targetPokemon.name} became ${selectedMove.statusEffect.type}!`]);
                }
            }
        }
        setSelectedMove(null);
        setTurn(prevTurn => (prevTurn === 1 ? 2 : 1));
        return; // Status move, no direct damage calculation
    }

    // Damage calculation for physical/special moves
    const { damage: damageDealt, isCritical, typeEffectiveness } = calculateDamage(attacker, defender, selectedMove);
    const newDefenderHP = Math.max(0, defender.currentHp - damageDealt);

    const updatedDefender = { ...defender, currentHp: newDefenderHP, isFainted: newDefenderHP <= 0 };
    updatePokemonInTeam(updatedDefender, defenderTeamId); // Update defender's state in their team

    let attackMessage = `${attacker.name} used ${selectedMove.name} on ${defender.name} for ${damageDealt} damage!`;
    if (isCritical) {
      attackMessage += " It was a critical hit!";
    }
    if (typeEffectiveness > 1) {
        attackMessage += " It's super effective!";
    } else if (typeEffectiveness < 1 && typeEffectiveness > 0) {
        attackMessage += " It's not very effective...";
    } else if (typeEffectiveness === 0) {
        attackMessage += " It had no effect!";
    }
    setBattleLog(prevLog => [...prevLog, attackMessage]);

    // Apply recoil damage to attacker if applicable
    if (selectedMove.recoil > 0) {
        const recoilDamage = Math.max(1, Math.floor(damageDealt * selectedMove.recoil));
        const newAttackerHp = Math.max(0, updatedAttacker.currentHp - recoilDamage);
        const recoilAttacker = { ...updatedAttacker, currentHp: newAttackerHp, isFainted: newAttackerHp <= 0 };
        updatePokemonInTeam(recoilAttacker, attackerPlayerNum);
        setBattleLog(prevLog => [...prevLog, `${attacker.name} took ${recoilDamage} recoil damage!`]);
        if (newAttackerHp <= 0) {
            handleFaint(recoilAttacker, attackerPlayerNum);
            setSelectedMove(null); // Clear selected move after action
            return; // Attacker fainted, end turn
        }
    }

    // Apply status effect from move if any (after damage)
    if (selectedMove.statusEffect && selectedMove.statusEffect.type !== 'attack-down' && selectedMove.statusEffect.type !== 'defense-down') {
        if (Math.random() < (selectedMove.statusEffect.chance || 1)) {
            const finalDefender = applyStatusEffect(updatedDefender, selectedMove.statusEffect.type, selectedMove.statusEffect.turns);
            if (finalDefender !== updatedDefender) { // Only update if status was actually applied/changed
                updatePokemonInTeam(finalDefender, defenderTeamId);
                setBattleLog(prevLog => [...prevLog, `${defender.name} became ${selectedMove.statusEffect.type}!`]);
            }
        }
    }

    setSelectedMove(null); // Clear selected move after action

    // Check if defender fainted
    if (newDefenderHP <= 0) {
      handleFaint(updatedDefender, defenderTeamId); // Pass the updated defender
    } else {
      // Switch turn if no one fainted and no switch is pending
      setTurn(prevTurn => (prevTurn === 1 ? 2 : 1));
    }
  };

  /** Function to handle switching a Pokemon. */
  const handleSwitchPokemon = (newPokemonId) => {
    if (battleOver || !isSwitching || !playerToSwitch) return;

    let newActivePokemon;
    let teamToSwitchFrom;
    let setActivePokemonFunction;
    let playerNumWhoSwitched = playerToSwitch; // Store this before clearing playerToSwitch

    if (playerToSwitch === 1) {
      teamToSwitchFrom = player1BattleTeam;
      setActivePokemonFunction = setActivePokemonP1;
    } else { // playerToSwitch === 2
      teamToSwitchFrom = player2BattleTeam;
      setActivePokemonFunction = setActivePokemonP2;
    }

    newActivePokemon = teamToSwitchFrom.find(p => p.id === newPokemonId);

    if (newActivePokemon && newActivePokemon.id !== (playerToSwitch === 1 ? activePokemonP1?.id : activePokemonP2?.id)) {
      setActivePokemonFunction(newActivePokemon); // Set the new active Pokemon
      setBattleLog(prevLog => [...prevLog, `Player ${playerNumWhoSwitched} switched to ${newActivePokemon.name}!`]);
    }

    setIsSwitching(false); // Exit switching mode
    setPlayerToSwitch(null);
    setTurn(prevTurn => (prevTurn === 1 ? 2 : 1)); // Switch turn after successful switch
    setSelectedMove(null); // Clear any selected move
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

  // Determine current player's active Pokemon and team for rendering actions
  const currentPlayerActivePokemon = turn === 1 ? activePokemonP1 : activePokemonP2;
  const currentPlayerBattleTeam = turn === 1 ? player1BattleTeam : player2BattleTeam;
  // const otherPlayerBattleTeam = turn === 1 ? player2BattleTeam : player1BattleTeam; // Not directly used in render

  return (
    <div className="BattleArena">
      <h2>Pokemon Battle!</h2>
      <div className="battle-display">
        {/* Player 1's Side */}
        <div className={`player-side player1-side ${turn === 1 && !battleOver && !isSwitching ? 'active-turn' : ''} ${attackingPlayer === 1 ? 'attacking' : ''}`}>
          <h3>Player 1</h3>
          <PokemonCard {...activePokemonP1} /> {/* PokemonCard now handles HP/Fainted/Status internally */}
          <p>{activePokemonP1.name} HP: {activePokemonP1.currentHp}/{activePokemonP1.originalHp}</p>
          {/* Full Team Lineup for Player 1 */}
          <div className="player-team-lineup">
            {player1BattleTeam.map(p => (
              <PokemonCard key={p.id} {...p} isMini={true} />
            ))}
          </div>
        </div>

        {/* VS / Turn Indicator / Actions */}
        <div className="battle-center">
          <p className="turn-indicator">Turn: Player {turn}</p>
          {battleOver && <h3 className="battle-winner">{winner} Wins!</h3>}

          {/* Action Buttons (Move Selection, Execute, Switch) - Only for Player 1 */}
          {!battleOver && !isSwitching && currentPlayerActivePokemon && !currentPlayerActivePokemon.isFainted && turn === 1 && (
            <div className="action-buttons">
              {/* Render move buttons for the current player's active Pokemon */}
              {currentPlayerActivePokemon.moves.map(move => (
                <button
                  key={move.name}
                  onClick={() => setSelectedMove(move)}
                  className={`battle-action-btn move-btn ${selectedMove?.name === move.name ? 'selected' : ''}`}
                  disabled={move.currentPp <= 0}
                >
                  {move.name} ({move.currentPp}/{move.pp} PP)
                </button>
              ))}
              <button onClick={handleAttack} className="battle-action-btn attack-btn" disabled={!selectedMove}>
                Execute Move!
              </button>
              {getAliveBenchedPokemon(currentPlayerBattleTeam, currentPlayerActivePokemon).length > 0 && (
                <button onClick={() => { setIsSwitching(true); setPlayerToSwitch(turn); setBattleLog(prevLog => [...prevLog, `Player ${turn} chose to switch Pokemon.`]); }} className="battle-action-btn switch-btn">Switch</button>
              )}
            </div>
          )}
          {/* Message for Player 2's turn */}
          {!battleOver && !isSwitching && currentPlayerActivePokemon && !currentPlayerActivePokemon.isFainted && turn === 2 && (
            <div className="ai-turn-message">
              <p>Player 2 is deciding...</p>
            </div>
          )}


          {/* Switching UI */}
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
                      {p.name} ({p.currentHp}/{p.originalHp} HP)
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Player 2's Side */}
        <div className={`player-side player2-side ${turn === 2 && !battleOver && !isSwitching ? 'active-turn' : ''} ${attackingPlayer === 2 ? 'attacking' : ''}`}>
          <h3>Player 2</h3>
          <PokemonCard {...activePokemonP2} /> {/* PokemonCard now handles HP/Fainted/Status internally */}
          <p>{activePokemonP2.name} HP: {activePokemonP2.currentHp}/{activePokemonP2.originalHp}</p>
          {/* Full Team Lineup for Player 2 */}
          <div className="player-team-lineup">
            {player2BattleTeam.map(p => (
              <PokemonCard key={p.id} {...p} isMini={true} />
            ))}
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div className="battle-log">
        <h4>Battle Log:</h4>
        <div className="log-messages" ref={battleLogRef}>
          {battleLog.map((msg, idx) => (
            <p key={idx}>{msg}</p>
          ))}
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
