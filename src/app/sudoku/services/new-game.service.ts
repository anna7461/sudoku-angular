import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { GameMode } from '../models/game-modes';
import { GameStateService } from './game-state.service';

export type GameDifficulty = 'test' | 'easy' | 'medium' | 'hard' | 'expert';

export interface NewGameOptions {
  difficulty: GameDifficulty;
  mode: GameMode;
  clearCurrentGame?: boolean;
  resetTimer?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NewGameService {
  private newGameSubject = new BehaviorSubject<NewGameOptions | null>(null);
  public newGame$ = this.newGameSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gameStateService: GameStateService
  ) {}

  /**
   * Start a new game with specified difficulty and mode
   */
  startNewGame(options: NewGameOptions): void {
    console.log('NewGameService: startNewGame called with options:', options);
    
    const {
      difficulty,
      mode,
      clearCurrentGame = true,
      resetTimer = true
    } = options;

    console.log('NewGameService: Starting new game:', { difficulty, mode, clearCurrentGame, resetTimer });

    // Use the new GameStateService to manage game states
    this.gameStateService.startNewGame(mode, difficulty);
    
    // Emit new game event that components can listen to
    this.newGameSubject.next(options);
    
    // Emit a custom event for broader compatibility
    this.emitNewGameEvent(options);
  }

  /**
   * Start a new daily challenge game
   */
  startDailyChallenge(difficulty: GameDifficulty): void {
    this.startNewGame({
      difficulty,
      mode: GameMode.DAILY_CHALLENGE,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new single player game
   */
  startSingleGame(difficulty: GameDifficulty): void {
    this.startNewGame({
      difficulty,
      mode: GameMode.SINGLE_GAME,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new arcade mode game
   */
  startArcadeGame(difficulty: GameDifficulty): void {
    this.startNewGame({
      difficulty,
      mode: GameMode.ARCADE_MODE,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with default difficulty (test) and single game mode
   */
  startNewGameDefault(): void {
    this.startNewGame({
      difficulty: 'test',
      mode: GameMode.SINGLE_GAME,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with easy difficulty and single game mode
   */
  startNewGameEasy(): void {
    this.startNewGame({
      difficulty: 'easy',
      mode: GameMode.SINGLE_GAME,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with medium difficulty and single game mode
   */
  startNewGameMedium(): void {
    this.startNewGame({
      difficulty: 'medium',
      mode: GameMode.SINGLE_GAME,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with hard difficulty and single game mode
   */
  startNewGameHard(): void {
    this.startNewGame({
      difficulty: 'hard',
      mode: GameMode.SINGLE_GAME,
      clearCurrentGame: true,
      resetTimer: true
    });
  }

  /**
   * Start a new game with expert difficulty and single game mode
   */
  startNewGameExpert(): void {
    this.startNewGame({
      difficulty: 'expert',
      mode: GameMode.SINGLE_GAME,
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
   * Check if there's a saved game state for a specific mode
   */
  hasSavedGame(mode: GameMode): boolean {
    return this.gameStateService.hasGameState(mode);
  }

  /**
   * Check if there's a saved game state for any mode
   */
  hasAnySavedGame(): boolean {
    return Object.values(GameMode).some(mode => this.gameStateService.hasGameState(mode));
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
