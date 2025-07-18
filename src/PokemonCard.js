// src/PokemonCard.js
import React from "react";
import "./PokemonCard.css";

/* PokemonCard component: Displays individual Pokemon details.
 * Enhanced to show HP, fainted status, status effects, and reorder/remove buttons.
 */
function PokemonCard({
  name,
  front,
  back,
  stats,
  isFainted = false,
  onRemove, // Function to remove card from team (during selection)
  isRemovable = false, // Boolean to show/hide remove button (during selection)
  onMoveUp, // Function to move card up in team order (during selection)
  onMoveDown, // Function to move card down in team order (during selection)
  currentHp, // Current HP (passed from BattleArena or initialized in PokeDex)
  originalHp, // Original HP (passed from BattleArena or initialized in PokeDex)
  status, // Current status effect (e.g., 'poisoned', 'paralyzed', 'burned', 'slept', 'confused')
  statStages, // Object of stat stages (e.g., {attack: 0, defense: 1})
  isMini = false // New prop to render a smaller version for team lineup in battle
}) {
  // Helper to get HP percentage for health bars
  const getHpPercentage = (current, original) => {
    if (original === 0) return 0;
    return (current / original) * 100;
  };

  // Only calculate if HP data is provided
  const hpPercentage = (typeof currentHp === 'number' && typeof originalHp === 'number')
    ? getHpPercentage(currentHp, originalHp)
    : null;

  // Determine HP bar color based on percentage
  const getHpBarColor = (percentage) => {
    if (percentage === null) return '#555'; // Default if no HP data
    if (percentage > 50) return '#00ff00'; // Green
    if (percentage > 20) return '#ffcc00'; // Yellow
    return '#ff4d4d'; // Red
  };

  return (
    <div className={`PokemonCard ${isFainted ? 'fainted' : ''} ${isMini ? 'mini' : ''}`}>
      {/* Remove and Reorder Buttons (only visible during selection phase and if isRemovable) */}
      {isRemovable && (
        <div className="pokemon-card-actions">
          {onMoveUp && <button onClick={onMoveUp} className="reorder-btn up">▲</button>}
          <button onClick={onRemove} className="remove-pokemon-btn">X</button>
          {onMoveDown && <button onClick={onMoveDown} className="reorder-btn down">▼</button>}
        </div>
      )}

      <div className="PokemonCard-image">
        <img src={front} alt={`${name} front`} />
        <img src={back} alt={`${name} back`} />
      </div>
      <h5 className="PokemonCard-name">{name}</h5>
      
      {/* Display HP bar and text if HP data is available */}
      {hpPercentage !== null && (
        <div className="pokemon-hp-display">
          <div className="hp-bar-container">
            <div
              className="hp-bar"
              style={{
                width: `${hpPercentage}%`,
                backgroundColor: getHpBarColor(hpPercentage)
              }}
            ></div>
          </div>
          <p className="pokemon-hp-text">{currentHp}/{originalHp} HP</p>
        </div>
      )}

      {/* Display status effect if present */}
      {status && <p className={`pokemon-status ${status}`}>{status.toUpperCase()}</p>}

      {/* Display stat stages if present and not mini card */}
      {!isMini && statStages && (
        <div className="pokemon-stat-stages">
          {Object.entries(statStages).map(([statName, stage]) => (
            stage !== 0 && (
              <span key={statName} className={`stat-stage ${stage > 0 ? 'boost' : 'drop'}`}>
                {statName.replace('-', ' ')} {stage > 0 ? '▲' : '▼'}{Math.abs(stage)}
              </span>
            )
          ))}
        </div>
      )}

      {/* Only show full stats for non-mini cards */}
      {!isMini && (
        <ul className="PokemonCard-stats">
          {stats.map(stat => (
            <li key={stat.name}>
              {stat.name}: {stat.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PokemonCard;
