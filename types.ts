
export enum GameState {
  LOGIN = 'LOGIN',
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

export enum GameMode {
  FIND_INTRUDER = 'Find Intruder', // Classic: Find the one that DOESN'T belong
  FIND_BELONGING = 'Find Belonging' // New: Find the one that DOES belong
}

export type Theme = 'TECH' | 'CYBERPUNK' | 'NATURE';

export const CATEGORIES = [
  'Sports', 'Sea Animals', 'Vegetables', 'Fruit', 'Transport', 
  'Clothes', 'Weather', 'Animals', 'Toys', 'Food', 
  'School Objects', 'Nature', 'Film', 'Body', 'Job'
];

export interface WordBubble {
  id: string;
  text: string;
  isTarget: boolean; // Renamed from isIntruder to be generic based on mode
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
  words: { text: string; isTarget: boolean }[];
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
