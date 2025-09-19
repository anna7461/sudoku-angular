import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Box } from '../models/box.model';
import { Cell } from '../models/cell.model';
import { GameDifficulty } from './new-game.service';

export type GameMode = 'classic' | 'daily' | 'arcade';
export type GameStatus = 'in-progress' | 'paused' | 'completed' | 'game-over';

export interface GameState {
  // Core game data
  puzzleGrid: number[][]; // The original unsolved puzzle
  solutionGrid: number[][]; // The complete solution (for validation only)
  userEntries: (number | null)[][]; // User's filled cells
  notes: number[][][]; // Player notes for each cell
  cellStates: ('normal' | 'correct' | 'error' | 'highlight')[][]; // Cell states for each cell

  // Game status
  mistakes: number;
  mistakesLimit: number;
  difficulty: GameDifficulty;
  timer: number; // elapsed time in seconds
  gameStatus: GameStatus;

  // Additional game metadata
  score: number;
  gameStartTime: number;
  lastSaveTime: number;

  // UI state
  selectedBoxIndex: number | null;
  selectedCellIndex: number | null;
  notesMode: boolean;
  numberFirstMode: boolean;
  selectedNumber: number | null;

  // Move history for undo functionality
  moveHistory: any[];
}

export interface SavedGameInfo {
  exists: boolean;
  timeElapsed?: string;
  difficulty?: string;
  gameStatus?: GameStatus;
  mode?: GameMode;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly STORAGE_PREFIX = 'sudoku';

  // BehaviorSubjects to track state changes for each mode
  private gameStateSubjects: Map<GameMode, BehaviorSubject<GameState | null>> = new Map();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize BehaviorSubjects for each game mode
    const modes: GameMode[] = ['classic', 'daily', 'arcade'];
    modes.forEach(mode => {
      this.gameStateSubjects.set(mode, new BehaviorSubject<GameState | null>(null));
    });
  }

  /**
   * Get the localStorage key for a specific game mode
   */
  private getStorageKey(mode: GameMode): string {
    return `${this.STORAGE_PREFIX}-${mode}`;
  }

  /**
   * Check if localStorage is available (browser environment)
   */
  private isStorageAvailable(): boolean {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined';
  }

  /**
   * Initialize a new game state for a specific mode
   */
  initializeNewGameState(mode: GameMode, options: {
    puzzleGrid: number[][];
    solutionGrid: number[][];
    difficulty: GameDifficulty;
    mistakesLimit?: number;
  }): GameState {
    const { puzzleGrid, solutionGrid, difficulty, mistakesLimit = 3 } = options;

    // Initialize empty user entries and notes grids
    const userEntries: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    const notes: number[][][] = Array(9).fill(null).map(() =>
      Array(9).fill(null).map(() => [])
    );

    const newState: GameState = {
      puzzleGrid: JSON.parse(JSON.stringify(puzzleGrid)), // Deep copy
      solutionGrid: JSON.parse(JSON.stringify(solutionGrid)), // Deep copy
      userEntries,
      notes,
      cellStates: Array(9).fill(null).map(() => Array(9).fill('normal')),
      mistakes: 0,
      mistakesLimit,
      difficulty,
      timer: 0,
      gameStatus: 'in-progress',
      score: 0,
      gameStartTime: Date.now(),
      lastSaveTime: Date.now(),
      selectedBoxIndex: null,
      selectedCellIndex: null,
      notesMode: false,
      numberFirstMode: false,
      selectedNumber: null,
      moveHistory: []
    };

    this.saveGameState(mode, newState);
    return newState;
  }

  /**
   * Save game state to localStorage for a specific mode
   */
  saveGameState(mode: GameMode, state: GameState): void {
    if (!this.isStorageAvailable()) {
      console.warn('LocalStorage not available');
      return;
    }

    try {
      const stateToSave = {
        ...state,
        lastSaveTime: Date.now()
      };

      const key = this.getStorageKey(mode);
      localStorage.setItem(key, JSON.stringify(stateToSave));

      // Update the BehaviorSubject
      const subject = this.gameStateSubjects.get(mode);
      if (subject) {
        subject.next(stateToSave);
      }

      console.log(`Game state saved for ${mode} mode`);
    } catch (error) {
      console.error(`Failed to save game state for ${mode}:`, error);
    }
  }

  /**
   * Load game state from localStorage for a specific mode
   */
  loadGameState(mode: GameMode): GameState | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const key = this.getStorageKey(mode);
      const savedData = localStorage.getItem(key);

      if (!savedData) {
        return null;
      }

      const state = JSON.parse(savedData) as GameState;

      // Update the BehaviorSubject
      const subject = this.gameStateSubjects.get(mode);
      if (subject) {
        subject.next(state);
      }

      return state;
    } catch (error) {
      console.error(`Failed to load game state for ${mode}:`, error);
      return null;
    }
  }

  /**
   * Get an observable for game state changes for a specific mode
   */
  getGameState$(mode: GameMode) {
    return this.gameStateSubjects.get(mode)?.asObservable() || new BehaviorSubject<GameState | null>(null).asObservable();
  }

  /**
   * Update specific fields in the game state
   */
  updateGameState(mode: GameMode, updates: Partial<GameState>): void {
    const currentState = this.loadGameState(mode);
    if (!currentState) {
      console.warn(`No existing game state found for ${mode} mode`);
      return;
    }

    const updatedState = {
      ...currentState,
      ...updates,
      lastSaveTime: Date.now()
    };

    this.saveGameState(mode, updatedState);
  }

  /**
   * Update user entry for a specific cell
   */
  updateUserEntry(mode: GameMode, row: number, col: number, value: number | null): void {
    const currentState = this.loadGameState(mode);
    if (!currentState) return;

    currentState.userEntries[row][col] = value;
    this.saveGameState(mode, currentState);
  }

  /**
   * Update notes for a specific cell
   */
  updateCellNotes(mode: GameMode, row: number, col: number, notes: number[]): void {
    const currentState = this.loadGameState(mode);
    if (!currentState) return;

    currentState.notes[row][col] = [...notes]; // Create a copy
    this.saveGameState(mode, currentState);
  }

  /**
   * Update mistakes count
   */
  updateMistakes(mode: GameMode, mistakes: number): void {
    this.updateGameState(mode, { mistakes });
  }

  /**
   * Update timer
   */
  updateTimer(mode: GameMode, timer: number): void {
    this.updateGameState(mode, { timer });
  }

  /**
   * Update game status
   */
  updateGameStatus(mode: GameMode, gameStatus: GameStatus): void {
    this.updateGameState(mode, { gameStatus });
  }

  /**
   * Update UI state (selection, modes, etc.)
   */
  updateUIState(mode: GameMode, uiState: {
    selectedBoxIndex?: number | null;
    selectedCellIndex?: number | null;
    notesMode?: boolean;
    numberFirstMode?: boolean;
    selectedNumber?: number | null;
  }): void {
    this.updateGameState(mode, uiState);
  }

  /**
   * Add a move to the history
   */
  addMoveToHistory(mode: GameMode, move: any): void {
    const currentState = this.loadGameState(mode);
    if (!currentState) return;

    const MAX_HISTORY = 50;
    const newHistory = [...currentState.moveHistory, move];

    // Keep only the last MAX_HISTORY moves
    if (newHistory.length > MAX_HISTORY) {
      newHistory.splice(0, newHistory.length - MAX_HISTORY);
    }

    this.updateGameState(mode, { moveHistory: newHistory });
  }

  /**
   * Clear move history
   */
  clearMoveHistory(mode: GameMode): void {
    this.updateGameState(mode, { moveHistory: [] });
  }

  /**
   * Check if a saved game exists for a specific mode
   */
  hasSavedGame(mode: GameMode): boolean {
    const state = this.loadGameState(mode);
    return state !== null && state.gameStatus === 'in-progress';
  }

  /**
   * Get saved game information for a specific mode
   */
  getSavedGameInfo(mode: GameMode): SavedGameInfo {
    const state = this.loadGameState(mode);

    if (!state) {
      return { exists: false };
    }

    // Only consider it a saved game if it's in progress
    if (state.gameStatus !== 'in-progress') {
      return { exists: false };
    }

    return {
      exists: true,
      timeElapsed: this.formatTime(state.timer),
      difficulty: state.difficulty,
      gameStatus: state.gameStatus,
      mode
    };
  }

  /**
   * Get saved game information for all modes
   */
  getAllSavedGamesInfo(): Record<GameMode, SavedGameInfo> {
    const modes: GameMode[] = ['classic', 'daily', 'arcade'];
    const result: Record<GameMode, SavedGameInfo> = {} as Record<GameMode, SavedGameInfo>;

    modes.forEach(mode => {
      result[mode] = this.getSavedGameInfo(mode);
    });

    return result;
  }

  /**
   * Clear saved game for a specific mode
   */
  clearSavedGame(mode: GameMode): void {
    if (!this.isStorageAvailable()) return;

    try {
      const key = this.getStorageKey(mode);
      localStorage.removeItem(key);

      // Update the BehaviorSubject
      const subject = this.gameStateSubjects.get(mode);
      if (subject) {
        subject.next(null);
      }

      console.log(`Cleared saved game for ${mode} mode`);
    } catch (error) {
      console.error(`Failed to clear saved game for ${mode}:`, error);
    }
  }

  /**
   * Clear all saved games
   */
  clearAllSavedGames(): void {
    const modes: GameMode[] = ['classic', 'daily', 'arcade'];
    modes.forEach(mode => this.clearSavedGame(mode));
  }

  /**
   * Convert boxes array to 2D grid format
   */
  boxesToGrid(boxes: Box[]): (number | null)[][] {
    const grid: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));

    console.log('boxesToGrid called with boxes count:', boxes.length);

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const box = boxes[boxIndex];
      const boxRow = Math.floor(boxIndex / 3);
      const boxCol = boxIndex % 3;

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = box.cells[cellIndex];
        const cellRow = Math.floor(cellIndex / 3);
        const cellCol = cellIndex % 3;

        const globalRow = boxRow * 3 + cellRow;
        const globalCol = boxCol * 3 + cellCol;

        grid[globalRow][globalCol] = cell.value;

        // Debug logging for first few cells
        if (boxIndex === 0 && cellIndex < 3) {
          console.log(`Saving cell [${globalRow}][${globalCol}]:`, {
            cellValue: cell.value,
            isGiven: cell.isGiven,
            isFixed: cell.isFixed,
            notes: cell.notes
          });
        }
      }
    }

    console.log('boxesToGrid completed, sample grid:', grid[0]?.slice(0, 3));
    return grid;
  }

  /**
   * Convert boxes array to notes grid format
   */
  boxesToNotesGrid(boxes: Box[]): number[][][] {
    const notesGrid: number[][][] = Array(9).fill(null).map(() =>
      Array(9).fill(null).map(() => [])
    );

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const box = boxes[boxIndex];
      const boxRow = Math.floor(boxIndex / 3);
      const boxCol = boxIndex % 3;

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = box.cells[cellIndex];
        const cellRow = Math.floor(cellIndex / 3);
        const cellCol = cellIndex % 3;

        const globalRow = boxRow * 3 + cellRow;
        const globalCol = boxCol * 3 + cellCol;

        notesGrid[globalRow][globalCol] = [...cell.notes];
      }
    }

    return notesGrid;
  }

  /**
   * Convert boxes array to cell states grid format
   */
  boxesToCellStatesGrid(boxes: Box[]): ('normal' | 'correct' | 'error' | 'highlight')[][] {
    const cellStatesGrid: ('normal' | 'correct' | 'error' | 'highlight')[][] = Array(9).fill(null).map(() =>
      Array(9).fill('normal')
    );

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const box = boxes[boxIndex];
      const boxRow = Math.floor(boxIndex / 3);
      const boxCol = boxIndex % 3;

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = box.cells[cellIndex];
        const cellRow = Math.floor(cellIndex / 3);
        const cellCol = cellIndex % 3;

        const globalRow = boxRow * 3 + cellRow;
        const globalCol = boxCol * 3 + cellCol;

        cellStatesGrid[globalRow][globalCol] = cell.state;
      }
    }

    return cellStatesGrid;
  }

  /**
   * Convert 2D grid to boxes array format
   */
  gridToBoxes(userGrid: (number | null)[][], puzzleGrid: number[][], notesGrid: number[][][], cellStatesGrid?: ('normal' | 'correct' | 'error' | 'highlight')[][]): Box[] {
    const boxes: Box[] = [];

    console.log('gridToBoxes called with:');
    console.log('puzzleGrid sample:', puzzleGrid[0]?.slice(0, 3));
    console.log('userGrid sample:', userGrid[0]?.slice(0, 3));

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const boxRow = Math.floor(boxIndex / 3);
      const boxCol = boxIndex % 3;
      const cells: Cell[] = [];

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cellRow = Math.floor(cellIndex / 3);
        const cellCol = cellIndex % 3;

        const globalRow = boxRow * 3 + cellRow;
        const globalCol = boxCol * 3 + cellCol;

        const isGiven = puzzleGrid[globalRow][globalCol] !== 0;
        const userValue = userGrid[globalRow][globalCol];

        // Fix: Properly handle null values for empty cells
        let cellValue: number | null;
        if (isGiven) {
          // This is a given cell from the original puzzle
          cellValue = puzzleGrid[globalRow][globalCol];
        } else {
          // This is a user-filled cell - use the user value (which can be null for empty cells)
          // userValue should only contain user entries, not given cells
          cellValue = userValue;
        }

        // Determine cell state - use saved state if available, otherwise determine from validation
        let cellState: 'normal' | 'correct' | 'error' | 'highlight' = 'normal';
        if (cellStatesGrid && cellStatesGrid[globalRow] && cellStatesGrid[globalRow][globalCol]) {
          // Use saved cell state - cast to ensure type safety
          const savedState = cellStatesGrid[globalRow][globalCol];
          if (savedState === 'normal' || savedState === 'correct' || savedState === 'error' || savedState === 'highlight') {
            cellState = savedState;
          }
        } else if (!isGiven && cellValue !== null) {
          // For user-filled cells without saved state, validate against solution
          // This handles backward compatibility for existing saved games
          const solutionValue = puzzleGrid[globalRow][globalCol];
          if (solutionValue !== 0 && cellValue === solutionValue) {
            cellState = 'correct';
          } else if (solutionValue !== 0 && cellValue !== solutionValue) {
            cellState = 'error';
          }
        }

        const cell: Cell = {
          value: cellValue,
          isGiven: isGiven,
          isFixed: isGiven,
          notes: [...notesGrid[globalRow][globalCol]],
          state: cellState
        };

        // Debug logging for first few cells
        if (boxIndex === 0 && cellIndex < 3) {
          console.log(`Reconstructing cell [${globalRow}][${globalCol}]:`, {
            isGiven,
            puzzleValue: puzzleGrid[globalRow][globalCol],
            userValue,
            finalValue: cellValue,
            notes: notesGrid[globalRow][globalCol]
          });
        }

        // Debug logging for empty cells
        if (!isGiven && userValue === null) {
          console.log(`Empty cell [${globalRow}][${globalCol}]: isGiven=${isGiven}, userValue=${userValue}, finalValue=${cellValue}`);
        }

        cells.push(cell);
      }

      boxes.push({ cells });
    }

    console.log('gridToBoxes completed, boxes count:', boxes.length);
    return boxes;
  }

  /**
   * Format time in mm:ss format
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { [mode: string]: number } {
    if (!this.isStorageAvailable()) {
      return {};
    }

    const info: { [mode: string]: number } = {};
    const modes: GameMode[] = ['classic', 'daily', 'arcade'];

    modes.forEach(mode => {
      const key = this.getStorageKey(mode);
      const data = localStorage.getItem(key);
      info[mode] = data ? data.length : 0;
    });

    return info;
  }

  /**
   * Validate saved game state integrity
   */
  validateGameState(state: GameState): boolean {
    try {
      // Check required properties exist
      if (!state.puzzleGrid || !state.solutionGrid || !state.userEntries || !state.notes) {
        return false;
      }

      // Check grid dimensions
      if (state.puzzleGrid.length !== 9 || state.solutionGrid.length !== 9 ||
          state.userEntries.length !== 9 || state.notes.length !== 9) {
        return false;
      }

      // Check cellStates if it exists (for backward compatibility)
      if (state.cellStates && state.cellStates.length !== 9) {
        return false;
      }

      // Check each row
      for (let i = 0; i < 9; i++) {
        if (state.puzzleGrid[i].length !== 9 || state.solutionGrid[i].length !== 9 ||
            state.userEntries[i].length !== 9 || state.notes[i].length !== 9) {
          return false;
        }
      }

      // Check required properties have valid values
      if (typeof state.mistakes !== 'number' || typeof state.timer !== 'number' ||
          typeof state.score !== 'number') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating game state:', error);
      return false;
    }
  }
}
