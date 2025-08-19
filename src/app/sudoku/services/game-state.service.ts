import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { GameMode, GameState, GameModeState } from '../models/game-modes';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private readonly STORAGE_KEY = 'sudoku-game-mode-states';
  
  private gameModeStatesSubject = new BehaviorSubject<GameModeState>({
    [GameMode.DAILY_CHALLENGE]: null,
    [GameMode.SINGLE_GAME]: null,
    [GameMode.ARCADE_MODE]: null
  });
  
  public gameModeStates$: Observable<GameModeState> = this.gameModeStatesSubject.asObservable();
  
  private currentModeSubject = new BehaviorSubject<GameMode>(GameMode.SINGLE_GAME);
  public currentMode$: Observable<GameMode> = this.currentModeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGameModeStates();
    }
  }

  /**
   * Get the current game mode
   */
  getCurrentMode(): GameMode {
    return this.currentModeSubject.value;
  }

  /**
   * Set the current game mode
   */
  setCurrentMode(mode: GameMode): void {
    this.currentModeSubject.next(mode);
    console.log(`Game mode changed to: ${mode}`);
  }

  /**
   * Get the current game state for the active mode
   */
  getCurrentGameState(): GameState | null {
    const currentMode = this.getCurrentMode();
    return this.getGameState(currentMode);
  }

  /**
   * Get game state for a specific mode
   */
  getGameState(mode: GameMode): GameState | null {
    const states = this.gameModeStatesSubject.value;
    return states[mode];
  }

  /**
   * Save game state for the current mode
   */
  saveGameState(gameState: Partial<GameState>): void {
    const currentMode = this.getCurrentMode();
    this.saveGameStateForMode(currentMode, gameState);
  }

  /**
   * Save game state for a specific mode
   */
  saveGameStateForMode(mode: GameMode, gameState: Partial<GameState>): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const states = this.gameModeStatesSubject.value;
      const existingState = states[mode];
      
      // Merge with existing state or create new one
      const updatedState: GameState = {
        mode,
        difficulty: gameState.difficulty || existingState?.difficulty || 'medium',
        boxes: gameState.boxes || existingState?.boxes || [],
        solution: gameState.solution || existingState?.solution || [],
        fixedCells: gameState.fixedCells || existingState?.fixedCells || [],
        mistakeCount: gameState.mistakeCount ?? existingState?.mistakeCount ?? 0,
        score: gameState.score ?? existingState?.score ?? 0,
        notesMode: gameState.notesMode ?? existingState?.notesMode ?? false,
        numberFirstMode: gameState.numberFirstMode ?? existingState?.numberFirstMode ?? false,
        selectedNumber: gameState.selectedNumber ?? existingState?.selectedNumber ?? null,
        moveHistory: gameState.moveHistory || existingState?.moveHistory || [],
        gameStartTime: gameState.gameStartTime ?? existingState?.gameStartTime ?? null,
        totalGameTime: gameState.totalGameTime ?? existingState?.totalGameTime ?? 0,
        isGamePaused: gameState.isGamePaused ?? existingState?.isGamePaused ?? false,
        isCompleted: gameState.isCompleted ?? existingState?.isCompleted ?? false,
        completionTime: gameState.completionTime ?? existingState?.completionTime,
        timestamp: Date.now()
      };

      states[mode] = updatedState;
      this.gameModeStatesSubject.next(states);
      this.saveToStorage(states);
      
      console.log(`Game state saved for ${mode}:`, updatedState);
    } catch (error) {
      console.error(`Failed to save game state for ${mode}:`, error);
    }
  }

  /**
   * Clear game state for a specific mode
   */
  clearGameState(mode: GameMode): void {
    const states = this.gameModeStatesSubject.value;
    states[mode] = null;
    this.gameModeStatesSubject.next(states);
    this.saveToStorage(states);
    console.log(`Game state cleared for ${mode}`);
  }

  /**
   * Clear all game states
   */
  clearAllGameStates(): void {
    const states = this.gameModeStatesSubject.value;
    Object.keys(states).forEach(key => {
      states[key as GameMode] = null;
    });
    this.gameModeStatesSubject.next(states);
    this.saveToStorage(states);
    console.log('All game states cleared');
  }

  /**
   * Check if a mode has a saved game state
   */
  hasGameState(mode: GameMode): boolean {
    const state = this.getGameState(mode);
    return state !== null && state.boxes && state.boxes.length > 0;
  }

  /**
   * Check if any mode has a saved game state
   */
  hasAnySavedGame(): boolean {
    return Object.values(GameMode).some(mode => this.hasGameState(mode));
  }

  /**
   * Get saved game info for a mode
   */
  getSavedGameInfo(mode: GameMode): { exists: boolean; timeElapsed?: string; difficulty?: string } {
    const state = this.getGameState(mode);
    if (!state || !state.boxes || state.boxes.length === 0) {
      return { exists: false };
    }

    return {
      exists: true,
      timeElapsed: this.formatTime(state.totalGameTime),
      difficulty: state.difficulty
    };
  }

  /**
   * Complete a game for the current mode
   */
  completeGame(completionTime: number, score: number, mistakes: number): void {
    const currentMode = this.getCurrentMode();
    const currentState = this.getGameState(currentMode);
    
    if (currentState) {
      this.saveGameStateForMode(currentMode, {
        ...currentState,
        isCompleted: true,
        completionTime,
        score,
        mistakeCount: mistakes
      });
    }
  }

  /**
   * Start a new game for a specific mode
   */
  startNewGame(mode: GameMode, difficulty: string): void {
    // Clear existing state for this mode
    this.clearGameState(mode);
    
    // Set as current mode
    this.setCurrentMode(mode);
    
    // Initialize empty state
    const newState: GameState = {
      mode,
      difficulty,
      boxes: [],
      solution: [],
      fixedCells: [],
      mistakeCount: 0,
      score: 0,
      notesMode: false,
      numberFirstMode: false,
      selectedNumber: null,
      moveHistory: [],
      gameStartTime: null,
      totalGameTime: 0,
      isGamePaused: false,
      isCompleted: false,
      timestamp: Date.now()
    };
    
    this.saveGameStateForMode(mode, newState);
    console.log(`New game started for ${mode} with difficulty ${difficulty}`);
  }

  /**
   * Format time in MM:SS format
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Load game mode states from storage
   */
  private loadGameModeStates(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const states = JSON.parse(saved);
        this.gameModeStatesSubject.next(states);
        console.log('Game mode states loaded from storage:', states);
      }
    } catch (error) {
      console.warn('Failed to load game mode states:', error);
    }
  }

  /**
   * Save game mode states to storage
   */
  private saveToStorage(states: GameModeState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Failed to save game mode states to storage:', error);
    }
  }
}
