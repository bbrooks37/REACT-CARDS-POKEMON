// src/PlayingCardList.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import PlayingCard from "./PlayingCard";
import { formatCard } from "./helpers"; // Ensure formatCard is imported
import "./PlayingCardList.css"; // Your main CSS file for the game

// Base URL for the Deck of Cards API
const DECK_API_BASE_URL = "https://deckofcardsapi.com/api/deck/";
const NUM_PAIRS = 6; // Define the number of pairs for the game (6 pairs = 12 cards)

/* PlayingCardList component, refactored into a Memory Matching Game. */
function PlayingCardList() {
  // State for all cards in the game, including their flipped and matched status
  const [gameCards, setGameCards] = useState([]);
  // State to keep track of the two cards currently flipped by the player
  const [flippedCards, setFlippedCards] = useState([]);
  // State to store the IDs of cards that have been successfully matched
  const [matchedCardGameIds, setMatchedCardGameIds] = useState(new Set()); // Renamed for clarity
  // State to control if cards can be clicked (prevents clicking more than 2 at once)
  const [canFlip, setCanFlip] = useState(true);
  // State to track the number of moves/turns
  const [moves, setMoves] = useState(0);
  // State for the game timer
  const [timer, setTimer] = useState(0);
  // Ref to hold the interval ID for the timer, so we can clear it
  const timerRef = useRef(null);
  // State to indicate if the game is won
  const [gameWon, setGameWon] = useState(false);
  // State for the win message (replaces alert())
  const [winMessage, setWinMessage] = useState("");
  // NEW STATE: Tracks if the game timer has started
  const [gameStarted, setGameStarted] = useState(false); // Initialize to false

  /** Function to initialize or reset the game. */
  const initializeGame = async () => {
    // *** RESET ALL GAME-RELATED STATES ***
    setGameCards([]);
    setFlippedCards([]);
    setMatchedCardGameIds(new Set()); // Reset the Set for matched cards
    setCanFlip(true);
    setMoves(0);
    setTimer(0);
    setGameWon(false); // Crucial: Reset gameWon state
    setWinMessage(""); // Clear any previous win message
    setGameStarted(false); // NEW: Reset gameStarted state

    // Clear any existing timer to prevent multiple intervals
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      // 1. Fetch a new shuffled deck to get a deck_id
      const deckResponse = await axios.get(`${DECK_API_BASE_URL}new/shuffle/?deck_count=1`);
      const deckId = deckResponse.data.deck_id;

      // 2. Draw enough unique cards for the game (NUM_PAIRS)
      // We'll draw more than needed and pick unique ones to ensure variety
      let uniqueCards = [];
      const drawnCardCodes = new Set(); // To ensure uniqueness by card code

      let safetyCounter = 0;
      const MAX_DRAW_ATTEMPTS = NUM_PAIRS * 10; // Increased attempts to be very safe

      while (uniqueCards.length < NUM_PAIRS && safetyCounter < MAX_DRAW_ATTEMPTS) {
        safetyCounter++;
        const drawResponse = await axios.get(`${DECK_API_BASE_URL}${deckId}/draw/?count=1`);

        // Log the full response data for debugging
        console.log(`Attempt ${safetyCounter}: Raw API draw response data:`, drawResponse.data);

        // *** MORE ROBUST CHECK FOR API RESPONSE DATA ***
        if (
          drawResponse.data &&
          drawResponse.data.success === true &&
          Array.isArray(drawResponse.data.cards) &&
          drawResponse.data.cards.length > 0 &&
          drawResponse.data.cards[0] &&
          drawResponse.data.cards[0].code // Ensure the card has a code for uniqueness
        ) {
          const newCardData = drawResponse.data.cards[0];
          if (!drawnCardCodes.has(newCardData.code)) {
            // Pass the full drawResponse.data to formatCard, as formatCard expects data.cards
            uniqueCards.push(formatCard(drawResponse.data));
            drawnCardCodes.add(newCardData.code);
          } else {
            console.log(`Attempt ${safetyCounter}: Card with code ${newCardData.code} already drawn, skipping.`);
          }
        } else {
          console.warn(`Attempt ${safetyCounter}: API draw failed or returned invalid card data. Response:`, drawResponse.data);
          // If the API returns invalid data, try reshuffling to get a fresh start
          if (drawResponse.data.remaining === 0 || !drawResponse.data.success) {
              console.log(`Attempt ${safetyCounter}: API response indicates issue or deck empty, reshuffling...`);
              await axios.get(`${DECK_API_BASE_URL}${deckId}/shuffle/`);
          }
        }

        // If we run out of cards in the deck, reshuffle and draw more
        // This check is secondary to the more robust check above
        if (drawResponse.data.remaining === 0 && uniqueCards.length < NUM_PAIRS && drawResponse.data.success) {
            console.log(`Attempt ${safetyCounter}: Deck empty, reshuffling...`);
            await axios.get(`${DECK_API_BASE_URL}${deckId}/shuffle/`);
        }
      }

      if (uniqueCards.length < NUM_PAIRS) {
        console.error("Could not draw enough unique cards. Only drawn:", uniqueCards.length, "out of", NUM_PAIRS);
        setWinMessage("Failed to get enough unique cards. Please try again."); // Display error in UI
        return; // Stop initialization if not enough cards
      }

      // 3. Duplicate cards to create pairs and add game-specific state
      let initialGameCards = [];
      uniqueCards.forEach(card => {
        // When duplicating, assign a NEW unique gameId for each physical card
        // The 'id' from formatCard is the unique identifier for the card TYPE (e.g., "10 of Diamonds")
        // The 'gameId' is unique for each INSTANCE of that card on the board.
        initialGameCards.push({ ...card, isFlipped: false, isMatched: false, gameId: `${card.id}-a` });
        initialGameCards.push({ ...card, isFlipped: false, isMatched: false, gameId: `${card.id}-b` });
      });

      // 4. Shuffle the combined array (Fisher-Yates shuffle)
      for (let i = initialGameCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialGameCards[i], initialGameCards[j]] = [initialGameCards[j], initialGameCards[i]];
      }

      setGameCards(initialGameCards);
      console.log("Game initialized with cards:", initialGameCards); // Log the final gameCards array

      // Timer will now start on first click, not here
      // timerRef.current = setInterval(() => {
      //   setTimer(prevTimer => prevTimer + 1);
      // }, 1000);

    } catch (error) {
      console.error("Error initializing game:", error);
      setWinMessage("Failed to load cards. Check console for details."); // Display error in UI
    }
  };

  // Effect to initialize the game on component mount
  useEffect(() => {
    // This useEffect ensures initializeGame runs only once on mount
    initializeGame();

    // Cleanup function: clear interval when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Effect to handle game win condition
  useEffect(() => {
    // Only trigger win logic if gameCards are loaded, all are matched, and gameWon is not already true
    // We now check against matchedCardGameIds.size because it tracks unique physical cards
    if (gameCards.length > 0 && matchedCardGameIds.size === gameCards.length && !gameWon) {
      setGameWon(true); // Set gameWon to true
      // Stop the timer here when game is won
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setWinMessage(`Congratulations! You matched all cards in ${moves} moves and ${timer} seconds!`);
    }
  }, [matchedCardGameIds, gameCards.length, moves, timer, gameWon]); // Use matchedCardGameIds here

  /** Handle a card click. */
  const handleCardClick = (clickedCardGameId) => {
    // If game has not started, start the timer on the very first click
    if (!gameStarted) {
      setGameStarted(true);
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }

    // Prevent clicking if not allowed or game is won
    if (!canFlip || gameWon) {
      console.log("Click prevented: canFlip:", canFlip, "gameWon:", gameWon);
      return;
    }

    const clickedCard = gameCards.find(c => c.gameId === clickedCardGameId);

    // *** REFINED CLICK PREVENTION LOGIC WITH DEBUGGING ***
    // Log why a click is prevented
    if (!clickedCard) {
        console.log("Click prevented: Card object not found for gameId:", clickedCardGameId);
        return;
    }
    if (matchedCardGameIds.has(clickedCard.gameId)) { // Check against gameId here
        console.log("Click prevented: Card is already matched. Game ID:", clickedCardGameId);
        return;
    }
    // Check if the card is already visually flipped (its isFlipped property is true)
    // This is the most direct way to prevent re-flipping a card that's already face-up
    if (clickedCard.isFlipped) {
        console.log("Click prevented: Card is already visually flipped. Game ID:", clickedCardGameId);
        return;
    }
    // This condition is specifically for preventing clicking a card that is *currently* in the `flippedCards` array
    // (i.e., it's one of the two cards that are currently face-up and awaiting a match check)
    if (flippedCards.some(c => c.gameId === clickedCardGameId)) {
        console.log("Click prevented: Card is already in the currently flipped pair. Game ID:", clickedCardGameId);
        return;
    }
    // *** END REFINED CLICK PREVENTION LOGIC ***

    setGameCards(prevCards =>
      prevCards.map(card =>
        card.gameId === clickedCardGameId ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedCards(prevFlipped => [...prevFlipped, clickedCard]);
  };

  // Effect to handle logic when two cards are flipped
  useEffect(() => {
    if (flippedCards.length === 2) {
      setCanFlip(false); // Disable further clicks
      setMoves(prevMoves => prevMoves + 1); // Increment moves

      const [card1, card2] = flippedCards;

      // *** CRITICAL FIX: Match by both value AND suit ***
      // Also, ensure card1 and card2 are not the exact same physical card instance
      console.log("Comparing cards for match:"); // New log
      console.log("Card 1:", { value: card1.value, suit: card1.suit, gameId: card1.gameId }); // New log
      console.log("Card 2:", { value: card2.value, suit: card2.suit, gameId: card2.gameId }); // New log

      if (card1.gameId !== card2.gameId && card1.value === card2.value && card1.suit === card2.suit) { // Match found!
        // Add BOTH gameIds to the matched set
        setMatchedCardGameIds(prevMatched => new Set(prevMatched.add(card1.gameId).add(card2.gameId)));
        setFlippedCards([]); // Clear flipped cards
        setCanFlip(true); // Re-enable clicks immediately
      } else { // No match
        setTimeout(() => {
          setGameCards(prevCards =>
            prevCards.map(card =>
              (card.gameId === card1.gameId || card.gameId === card2.gameId)
                ? { ...card, isFlipped: false } // Flip back down
                : card
            )
          );
          setFlippedCards([]); // Clear flipped cards
          setCanFlip(true); // Re-enable clicks
        }, 1200); // Short delay before flipping back
      }
    }
  }, [flippedCards, gameCards, matchedCardGameIds]); // Add gameCards and matchedCardGameIds to dependencies for correct closures

  return (
    <div className="PlayingCardList">
      <header>
        <h1 className="CardTable-heading">Memory Match Game</h1>
      </header>
      <div className="game-info">
        <p>Moves: {moves}</p>
        <p>Time: {timer}s</p>
        {/* Display win message directly in UI */}
        {winMessage && <p className="win-message">{winMessage}</p>}
        <button onClick={initializeGame}>New Game</button>
      </div>
      <div className="PlayingCardList-card-area">
        {gameCards.length > 0 ? (
          gameCards.map(card => (
            <PlayingCard
              key={card.gameId} // Use gameId for unique key prop
              front={card.image}
              value={card.value} // Pass value for matching logic
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              onClick={() => handleCardClick(card.gameId)}
            />
          ))
        ) : (
          <p>Loading cards...</p>
        )}
      </div>
    </div>
  );
}

export default PlayingCardList;
