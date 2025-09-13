import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { GameService } from './game.service';

export interface PauseDialogData {
  isVisible: boolean;
  message: string;
  currentTime?: string;
  currentDifficulty?: string;
  mistakesLimit?: number;
  currentScore?: number;
  currentMistakes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PauseService {
  private readonly PAUSE_KEY = 'sudoku-game-paused';
  private pauseStateLoaded = false; // Flag to prevent multiple loadPauseState calls
  
  private pauseDialogSubject = new BehaviorSubject<PauseDialogData>({
    isVisible: false,
    message: 'Game is paused'
  });
  
  // New subject for game pause state that components can subscribe to
  private gamePauseStateSubject = new BehaviorSubject<boolean>(false);
  
  public pauseDialog$ = this.pauseDialogSubject.asObservable();
  public gamePauseState$ = this.gamePauseStateSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gameService: GameService
  ) {}

  /**
   * Pause the game and show pause dialog
   */
  pauseGame(): void {
    // Get current game state automatically
    const currentGameState = this.gameService.getCurrentGameState();
    
    this.pauseDialogSubject.next({
      isVisible: true,
      message: 'Game is paused',
      currentTime: currentGameState.currentTime,
      currentDifficulty: currentGameState.currentDifficulty,
      mistakesLimit: currentGameState.mistakesLimit,
      currentScore: currentGameState.currentScore,
      currentMistakes: currentGameState.currentMistakes
    });
    
    // Update game pause state
    this.gamePauseStateSubject.next(true);
    
    // Save pause state to localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.PAUSE_KEY, 'true');
    }

    // Emit custom event for pause state change
    if (isPlatformBrowser(this.platformId)) {
      const pauseEvent = new CustomEvent('sudoku-pause-state-changed', {
        detail: { isPaused: true, timestamp: Date.now() }
      });
      window.dispatchEvent(pauseEvent);
    }
  }

  /**
   * Resume the game and hide pause dialog
   */
  resumeGame(): void {
    console.log('PauseService: Resuming game, clearing pause state');
    
    this.pauseDialogSubject.next({
      isVisible: false,
      message: 'Game is paused'
    });
    
    // Update game pause state
    this.gamePauseStateSubject.next(false);
    
    // Clear pause state from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.PAUSE_KEY);
      console.log('PauseService: Pause state cleared from localStorage');
    }

    // Emit custom event for pause state change
    if (isPlatformBrowser(this.platformId)) {
      const resumeEvent = new CustomEvent('sudoku-pause-state-changed', {
        detail: { isPaused: false, timestamp: Date.now() }
      });
      window.dispatchEvent(resumeEvent);
    }
  }

  /**
   * Reset the pause state loading flag (used when starting a completely new game)
   */
  resetPauseStateLoading(): void {
    this.pauseStateLoaded = false;
    console.log('PauseService: Pause state loading flag reset');
  }

  /**
   * Check if game is currently paused
   */
  isGamePaused(): boolean {
    return this.gamePauseStateSubject.value;
  }

  /**
   * Get current pause dialog state
   */
  getPauseDialogState(): PauseDialogData {
    return this.pauseDialogSubject.value;
  }

  /**
   * Load pause state from localStorage (only called once during app initialization)
   */
  loadPauseState(): void {
    // Prevent multiple calls to loadPauseState
    if (this.pauseStateLoaded) {
      console.log('PauseService: loadPauseState already called, skipping');
      return;
    }
    
    this.pauseStateLoaded = true;
    
    if (isPlatformBrowser(this.platformId)) {
      const isPaused = localStorage.getItem(this.PAUSE_KEY) === 'true';
      console.log('PauseService: Loading pause state from localStorage:', isPaused);
      
      // Only restore pause state if there's actually a game in progress
      // Check if there's a saved game state to determine if we should restore pause
      const hasGameState = localStorage.getItem('sudoku-classic-game-state') !== null;
      console.log('PauseService: Has game state:', hasGameState);
      
      if (isPaused && hasGameState) {
        console.log('PauseService: Restoring pause state for existing game');
        this.pauseGame();
      } else if (isPaused && !hasGameState) {
        console.log('PauseService: Pause state found but no game state, clearing pause state');
        // Clear the pause state if there's no game to resume
        localStorage.removeItem(this.PAUSE_KEY);
      }
    }
  }
}
