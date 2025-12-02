

export enum GameState {
  MENU = 'MENU',
  LOADING_ROUND = 'LOADING_ROUND',
  PLAYING = 'PLAYING',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER'
}

export enum Difficulty {
  EASY = 'Easy',
  NORMAL = 'Normal',
  HARD = 'Hard'
}

export const CATEGORIES = [
  'Sports', 'Sea Animals', 'Vegetables', 'Fruit', 'Transport', 
  'Clothes', 'Weather', 'Animals', 'Toys', 'Food', 
  'School Objects', 'Nature', 'Film', 'Body', 'Job'
];

export interface WordBubble {
  id: string;
  text: string;
  isIntruder: boolean;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPopped: boolean;
  scale: number;
  phaseOffset: number;
}

export interface RoundData {
  categoryWords: string[];
  intruderWord: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type?: 'circle' | 'shard' | 'ring';
  rotation?: number;
  vRotation?: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or simple text icon
  unlocked: boolean;
}

export interface PopResult {
  scoreDelta: number;
  label: string;
  color: string;
}
