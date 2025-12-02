import { RoundData, Difficulty } from "../types";
import { getLocalRoundData } from "./wordBank";

// We keep the async signature to maintain compatibility with App.tsx
// but we now use the local dictionary for instant results and better gameplay flow.
export const generateRoundWords = async (
  category: string,
  difficulty: Difficulty
): Promise<RoundData> => {
  // No delay for fast-paced Time Attack mode
  
  try {
    return getLocalRoundData(category, difficulty);
  } catch (error) {
    console.error("Error generating round:", error);
    return {
      categoryWords: ["Error", "Retry", "Check", "Net"],
      intruderWord: "Offline"
    };
  }
};