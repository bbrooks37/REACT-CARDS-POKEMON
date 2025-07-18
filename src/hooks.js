// src/hooks.js
import { useState, useEffect } from "react";
import axios from "axios";
// Removed uuid import here because your formatters are handling it.
// import { v4 as uuid } from 'uuid'; // <-- THIS LINE SHOULD BE REMOVED

function useFlip(initialFlipState = true) {
  const [isFlipped, setFlipped] = useState(initialFlipState);

  const flip = () => {
    setFlipped(isUp => !isUp);
  };

  return [isFlipped, flip];
}

function useLocalStorage(key, initialValue = []) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from local storage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Refined useAxios: No longer adds 'id' as formatter already handles it
function useAxios(keyInLS, baseUrl, formatter = data => data) { // formatter added as a hook parameter
  const [responses, setResponses] = useLocalStorage(keyInLS, []);

  const addResponseData = async (restOfUrl = "") => {
  try {
    const response = await axios.get(`${baseUrl}${restOfUrl}`);
    setResponses(data => [...data, formatter(response.data)]); // NOT { ...formatter(response.data), id: uuid() }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

  const clearResponses = () => setResponses([]);

  return [responses, addResponseData, clearResponses];
}

export { useFlip, useAxios, useLocalStorage };