import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type GameDifficulty = 'test' | 'easy' | 'medium' | 'hard' | 'expert';

export interface NewGameOptions {
  difficulty: GameDifficulty;
  clearCurrentGame?: boolean;
  resetTimer?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NewGameService {
  private readonly GAME_STATE_KEY = 'sudoku-game-state';
  
  private newGameSubject = new BehaviorSubject<NewGameOptions | null>(null);
  public newGame$ = this.newGameSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Start a new game with specified difficulty
   */
  startNewGame(options: NewGameOptions): void {
    console.log('NewGameService: startNewGame called with options:', options);
    
    const {
      difficulty,
      clearCurrentGame = true,
      resetTimer = true
    } = options;

    console.log('NewGameService: Extracted difficulty:', difficulty, 'Type:', typeof difficulty);

    // Clear current game state if requested
    if (clearCurrentGame && isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.GAME_STATE_KEY);
    }

    // Emit new game event that components can listen to
    this.newGameSubject.next(options);
    
    // Emit a custom event for broader compatibility
    this.emitNewGameEvent(options);
  }

  /**
   * Start a new game with default difficulty (test)
   */
  startNewGameDefault(): void {
    this.startNewGame({
      difficulty: 'test',
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with easy difficulty
   */
  startNewGameEasy(): void {
    this.startNewGame({
      difficulty: 'easy',
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with medium difficulty
   */
  startNewGameMedium(): void {
    this.startNewGame({
      difficulty: 'medium',
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with hard difficulty
   */
  startNewGameHard(): void {
    this.startNewGame({
      difficulty: 'hard',
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with expert difficulty
   */
  startNewGameExpert(): void {
    this.startNewGame({
      difficulty: 'expert',
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Get the last new game request
   */
  getLastNewGameRequest(): NewGameOptions | null {
    return this.newGameSubject.value;
  }

  /**
   * Emit a new game event that components can listen to
   */
  private emitNewGameEvent(options: NewGameOptions): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('NewGameService: Emitting event with options:', options);
      const newGameEvent = new CustomEvent('sudoku-new-game', {
        detail: { ...options, timestamp: Date.now() }
      });
      window.dispatchEvent(newGameEvent);
      console.log('NewGameService: Event dispatched');
    }
  }

  /**
   * Check if there's a saved game state
   */
  hasSavedGame(): boolean {
    // No longer checking for saved games
    return false;
  }

  /**
   * Get available difficulty levels
   */
  getAvailableDifficulties(): { value: GameDifficulty; label: string }[] {
    return [
      { value: 'test', label: 'Test' },
      { value: 'easy', label: 'Easy' },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
      { value: 'expert', label: 'Expert' }
    ];
  }
}
