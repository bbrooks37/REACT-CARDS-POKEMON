import React from "react";
import { useFlip } from "./hooks";
import backOfCard from "./back.png"; // Image is already pre-loaded
import "./PlayingCard.css";

function PlayingCard({ front, back = backOfCard }) {
  const [isFacingUp, flip] = useFlip();
  return (
    <img
      src={isFacingUp ? front : back}
      alt="playing card"
      onClick={flip}
      className={`PlayingCard Card ${isFacingUp ? "flipped" : ""}`}
    />
  );
}

export default PlayingCard;