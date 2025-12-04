
import { RoundData, Difficulty, GameMode } from "../types";
import { getLocalRoundData } from "./wordBank";

export const generateRoundWords = async (
  category: string,
  difficulty: Difficulty,
  mode: GameMode
): Promise<RoundData> => {
  try {
    return getLocalRoundData(category, difficulty, mode);
  } catch (error) {
    console.error("Error generating round:", error);
    // Fallback data
    return {
        words: [
            { text: "Error", isTarget: false },
            { text: "Retry", isTarget: true },
            { text: "Net", isTarget: false }
        ]
    };
  }
};
