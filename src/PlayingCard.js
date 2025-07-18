// src/PlayingCard.js
import React from "react";
// We no longer use useFlip directly here, as parent controls it
import backOfCard from "./back.png";
import "./PlayingCard.css";

/* Renders a single playing card. Its flip state and click handler are
 * now controlled by the parent (PlayingCardList) for the game logic. */
function PlayingCard({ front, back = backOfCard, isFlipped, isMatched, onClick, value }) {
  // isFlipped and isMatched are now props received from the parent
  // onClick is also a prop that the parent passes down

  return (
    <img
      src={isFlipped ? front : back}
      alt={isFlipped ? `playing card ${value}` : "back of card"}
      onClick={onClick} // Use the onClick prop passed from the parent
      className={`PlayingCard Card ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}`}
      style={isMatched ? { opacity: 0.5, pointerEvents: 'none' } : {}} // Simple visual for matched cards
    />
  );
}

export default PlayingCard;
