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
  
  public pauseDialog$ = this.pauseDialogSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Pause the game and show pause dialog
   */
  pauseGame(): void {
    this.pauseDialogSubject.next({
      isVisible: true,
      message: 'Game is paused'
    });
    
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
    
    // Clear pause state from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.PAUSE_KEY);
    }
  }

  /**
   * Check if game is currently paused
   */
  isGamePaused(): boolean {
    return this.pauseDialogSubject.value.isVisible;
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
