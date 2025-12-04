
import { RoundData, Difficulty, GameMode } from "../types";

interface CategoryData {
  words: string[];
  intruders: string[]; 
}

const WORD_BANK: Record<string, CategoryData> = {
  'Sports': {
    words: ['Football', 'Tennis', 'Rugby', 'Golf', 'Hockey', 'Boxing', 'Judo', 'Swimming', 'Skiing', 'Cricket'],
    intruders: []
  },
  'Sea Animals': {
    words: ['Shark', 'Whale', 'Dolphin', 'Crab', 'Octopus', 'Jellyfish', 'Turtle', 'Seal', 'Starfish', 'Shrimp'],
    intruders: []
  },
  'Vegetables': {
    words: ['Carrot', 'Potato', 'Onion', 'Peas', 'Corn', 'Broccoli', 'Pepper', 'Spinach', 'Garlic', 'Bean'],
    intruders: []
  },
  'Fruit': {
    words: ['Apple', 'Banana', 'Orange', 'Pear', 'Grape', 'Lemon', 'Mango', 'Melon', 'Peach', 'Kiwi'],
    intruders: []
  },
  'Transport': {
    words: ['Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Truck', 'Taxi', 'Boat', 'Metro'],
    intruders: []
  },
  'Clothes': {
    words: ['Shirt', 'Dress', 'Jeans', 'Hat', 'Coat', 'Shoes', 'Socks', 'Scarf', 'Gloves', 'Skirt'],
    intruders: []
  },
  'Weather': {
    words: ['Sun', 'Rain', 'Snow', 'Wind', 'Cloud', 'Storm', 'Fog', 'Ice', 'Hot', 'Cold'],
    intruders: []
  },
  'Animals': {
    words: ['Dog', 'Cat', 'Lion', 'Tiger', 'Bear', 'Horse', 'Cow', 'Sheep', 'Rabbit', 'Monkey'],
    intruders: []
  },
  'Toys': {
    words: ['Doll', 'Ball', 'Robot', 'Lego', 'Kite', 'Yo-yo', 'Puzzle', 'Teddy', 'Blocks', 'Car'],
    intruders: []
  },
  'Food': {
    words: ['Pizza', 'Burger', 'Pasta', 'Rice', 'Soup', 'Bread', 'Cheese', 'Egg', 'Meat', 'Cake'],
    intruders: []
  },
  'School Objects': {
    words: ['Pen', 'Pencil', 'Book', 'Ruler', 'Desk', 'Bag', 'Eraser', 'Paper', 'Glue', 'Map'],
    intruders: []
  },
  'Nature': {
    words: ['Tree', 'Flower', 'Grass', 'River', 'Mountain', 'Lake', 'Forest', 'Sun', 'Moon', 'Star'],
    intruders: []
  },
  'Film': {
    words: ['Actor', 'Scene', 'Camera', 'Action', 'Comedy', 'Drama', 'Horror', 'Star', 'Movie', 'Cinema'],
    intruders: []
  },
  'Body': {
    words: ['Head', 'Arm', 'Leg', 'Hand', 'Foot', 'Eye', 'Ear', 'Nose', 'Mouth', 'Hair'],
    intruders: []
  },
  'Job': {
    words: ['Doctor', 'Teacher', 'Police', 'Cook', 'Pilot', 'Nurse', 'Farmer', 'Artist', 'Singer', 'Vet'],
    intruders: []
  }
};

export const getLocalRoundData = (category: string, difficulty: Difficulty, mode: GameMode): RoundData => {
  const data = WORD_BANK[category] || WORD_BANK['Sports'];
  
  // Determine total bubbles
  let totalBubbles = 4; // Normal
  if (difficulty === Difficulty.EASY) totalBubbles = 3;
  if (difficulty === Difficulty.HARD) totalBubbles = 5;

  const resultWords: { text: string; isTarget: boolean }[] = [];

  // --- HELPER: Get Random Categories ---
  const allCategories = Object.keys(WORD_BANK);
  let otherCategories = allCategories.filter(c => c !== category);

  // CONSTRAINT: If selected category is Food, do NOT allow Fruit or Vegetables as decoys/intruders
  if (category === 'Food') {
    otherCategories = otherCategories.filter(c => c !== 'Fruit' && c !== 'Vegetables');
  }

  const getRandomWordFromOtherCategory = () => {
    const randomCatKey = otherCategories[Math.floor(Math.random() * otherCategories.length)];
    const otherCategoryData = WORD_BANK[randomCatKey];
    return otherCategoryData.words[Math.floor(Math.random() * otherCategoryData.words.length)];
  };

  if (mode === GameMode.FIND_INTRUDER) {
    // MODE 1: Classic. Find the ONE word that DOES NOT belong.
    // Structure: (Total-1) Category Words + 1 Intruder (Target)
    
    // 1. Pick (Total - 1) words from current category
    const availableWords = [...data.words];
    for (let i = 0; i < totalBubbles - 1; i++) {
      if (availableWords.length === 0) break;
      const rIdx = Math.floor(Math.random() * availableWords.length);
      resultWords.push({ text: availableWords[rIdx], isTarget: false });
      availableWords.splice(rIdx, 1);
    }

    // 2. Pick 1 Intruder
    const intruder = getRandomWordFromOtherCategory();
    resultWords.push({ text: intruder, isTarget: true });

  } else {
    // MODE 2: Find Belonging. Find the ONE word that DOES belong.
    // Structure: 1 Category Word (Target) + (Total-1) Decoys from other categories

    // 1. Pick 1 word from current category (The Target)
    const availableWords = [...data.words];
    const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    resultWords.push({ text: targetWord, isTarget: true });

    // 2. Pick (Total - 1) Decoys
    for (let i = 0; i < totalBubbles - 1; i++) {
      const decoy = getRandomWordFromOtherCategory();
      // Simple check to avoid duplicate decoys if possible, though unlikely with large bank
      resultWords.push({ text: decoy, isTarget: false });
    }
  }

  return {
    words: resultWords
  };
};
