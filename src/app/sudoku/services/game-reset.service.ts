import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ResetGameOptions {
  clearHistory?: boolean;
  resetTimer?: boolean;
  resetScore?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameResetService {
  private readonly GAME_STATE_KEY = 'sudoku-game-state';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Reset the current game to its initial state
   */
  resetCurrentGame(options: ResetGameOptions = {}): void {
    const {
      clearHistory = true,
      resetTimer = true,
      resetScore = true
    } = options;

    // Clear game state from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.GAME_STATE_KEY);
    }

    // Emit reset event that components can listen to
    this.emitResetEvent();
  }

  /**
   * Clear only the game history (moves, notes, etc.)
   */
  clearGameHistory(): void {
    // This will be handled by the SudokuComponent when it receives the reset event
    this.emitResetEvent();
  }

  /**
   * Reset only the timer
   */
  resetGameTimer(): void {
    // This will be handled by the TimerComponent when it receives the reset event
    this.emitResetEvent();
  }

  /**
   * Reset only the score
   */
  resetGameScore(): void {
    // This will be handled by the SudokuComponent when it receives the reset event
    this.emitResetEvent();
  }

  /**
   * Emit a reset event that components can listen to
   */
  private emitResetEvent(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Dispatch a custom event that components can listen to
      const resetEvent = new CustomEvent('sudoku-game-reset', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(resetEvent);
    }
  }

  /**
   * Check if there's a saved game state
   */
  hasSavedGame(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem(this.GAME_STATE_KEY);
      return savedState !== null;
    }
    return false;
  }

  /**
   * Get the saved game state data
   */
  getSavedGameState(): any {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem(this.GAME_STATE_KEY);
      if (savedState) {
        try {
          return JSON.parse(savedState);
        } catch (error) {
          console.error('Failed to parse saved game state:', error);
          return null;
        }
      }
    }
    return null;
  }
}
