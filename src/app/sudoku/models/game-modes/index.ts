export enum GameMode {
  DAILY_CHALLENGE = 'daily-challenge',
  SINGLE_GAME = 'single-game',
  ARCADE_MODE = 'arcade-mode'
}

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  isComingSoon: boolean;
}

export interface ArcadeLevel {
  id: number;
  name: string;
  difficulty: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestTime?: number;
  stars?: number;
}

export interface GameState {
  mode: GameMode;
  difficulty: string;
  boxes: any[];
  solution: number[][];
  fixedCells: boolean[][];
  mistakeCount: number;
  score: number;
  notesMode: boolean;
  numberFirstMode: boolean;
  selectedNumber: number | null;
  moveHistory: any[];
  gameStartTime: number | null;
  totalGameTime: number;
  isGamePaused: boolean;
  isCompleted: boolean;
  completionTime?: number;
  timestamp: number;
  arcadeLevel?: number; // Add arcade level tracking
}

export interface GameModeState {
  [GameMode.DAILY_CHALLENGE]: GameState | null;
  [GameMode.SINGLE_GAME]: GameState | null;
  [GameMode.ARCADE_MODE]: GameState | null;
}
