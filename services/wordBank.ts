

import { RoundData, Difficulty } from "../types";

interface CategoryData {
  words: string[];
  // We no longer strictly need 'intruders' array as we will pull from other categories dynamically
  // but we keep the structure for compatibility if needed.
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

export const getLocalRoundData = (category: string, difficulty: Difficulty): RoundData => {
  const data = WORD_BANK[category] || WORD_BANK['Sports'];
  
  // 1. Determine number of category words based on difficulty
  // Easy: 2 words + 1 intruder = 3 bubbles
  // Normal: 3 words + 1 intruder = 4 bubbles
  // Hard: 4 words + 1 intruder = 5 bubbles
  let numCategoryWords = 3;
  if (difficulty === Difficulty.EASY) numCategoryWords = 2;
  if (difficulty === Difficulty.HARD) numCategoryWords = 4;

  // 1. Get Target Words
  const availableWords = [...data.words];
  const selectedWords: string[] = [];
  
  // Pick unique words
  for(let i=0; i<numCategoryWords; i++) {
    if (availableWords.length === 0) break;
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    selectedWords.push(availableWords[randomIndex]);
    availableWords.splice(randomIndex, 1);
  }

  // 2. Get Random Intruder from DIFFERENT category
  const allCategories = Object.keys(WORD_BANK);
  // Filter out current category
  const otherCategories = allCategories.filter(c => c !== category);
  
  const randomCatKey = otherCategories[Math.floor(Math.random() * otherCategories.length)];
  const otherCategoryData = WORD_BANK[randomCatKey];
  
  const intruderWord = otherCategoryData.words[Math.floor(Math.random() * otherCategoryData.words.length)];

  return {
    categoryWords: selectedWords,
    intruderWord: intruderWord
  };
};