// src/PokemonCard.js
import React from "react";
import "./PokemonCard.css";

function PokemonCard({ name, front, back, stats, isFainted = false, onRemove, isRemovable = false }) { // Add onRemove and isRemovable props
  return (
    <div className={`PokemonCard ${isFainted ? 'fainted' : ''}`}>
      {isRemovable && (
        <button className="remove-pokemon-btn" onClick={onRemove}>X</button> // Remove button
      )}
      <div className="PokemonCard-image">
        <img src={front} alt={`${name} front`} />
        <img src={back} alt={`${name} back`} />
      </div>
      <h5 className="PokemonCard-name">{name}</h5>
      <ul className="PokemonCard-stats">
        {stats.map(stat => (
          <li key={stat.name}>
            {stat.name}: {stat.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PokemonCard;
