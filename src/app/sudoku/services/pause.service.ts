import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface PauseDialogData {
  isVisible: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PauseService {
  private readonly PAUSE_KEY = 'sudoku-game-paused';
  
  private pauseDialogSubject = new BehaviorSubject<PauseDialogData>({
    isVisible: false,
    message: 'Game is paused'
  });
  
  // New subject for game pause state that components can subscribe to
  private gamePauseStateSubject = new BehaviorSubject<boolean>(false);
  
  public pauseDialog$ = this.pauseDialogSubject.asObservable();
  public gamePauseState$ = this.gamePauseStateSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Pause the game and show pause dialog
   */
  pauseGame(): void {
    this.pauseDialogSubject.next({
      isVisible: true,
      message: 'Game is paused'
    });
    
    // Update game pause state
    this.gamePauseStateSubject.next(true);
    
    // Save pause state to localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.PAUSE_KEY, 'true');
    }
  }

  /**
   * Resume the game and hide pause dialog
   */
  resumeGame(): void {
    this.pauseDialogSubject.next({
      isVisible: false,
      message: 'Game is paused'
    });
    
    // Update game pause state
    this.gamePauseStateSubject.next(false);
    
    // Clear pause state from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.PAUSE_KEY);
    }
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
   * Load pause state from localStorage
   */
  loadPauseState(): void {
    if (isPlatformBrowser(this.platformId)) {
      const isPaused = localStorage.getItem(this.PAUSE_KEY) === 'true';
      if (isPaused) {
        this.pauseGame();
      }
    }
  }
}
