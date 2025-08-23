import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { GameMode } from '../models/game-modes';

export interface HeartsState {
  heartsRemaining: number;
  totalHearts: number;
  streak: number;
  bestStreak: number;
}

@Injectable({
  providedIn: 'root'
})
export class HeartsService {
  private readonly STORAGE_KEY = 'sudoku-hearts-state';
  private readonly TOTAL_HEARTS = 3;
  
  private heartsStateSubject = new BehaviorSubject<HeartsState>(this.getDefaultHeartsState());
  public heartsState$: Observable<HeartsState> = this.heartsStateSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHeartsState();
    }
  }

  /**
   * Get current hearts state
   */
  getHeartsState(): HeartsState {
    return this.heartsStateSubject.value;
  }

  /**
   * Get remaining hearts count
   */
  getHeartsRemaining(): number {
    return this.heartsStateSubject.value.heartsRemaining;
  }

  /**
   * Get current streak
   */
  getCurrentStreak(): number {
    return this.heartsStateSubject.value.streak;
  }

  /**
   * Get best streak
   */
  getBestStreak(): number {
    return this.heartsStateSubject.value.bestStreak;
  }

  /**
   * Check if player has hearts remaining
   */
  hasHeartsRemaining(): boolean {
    return this.heartsStateSubject.value.heartsRemaining > 0;
  }

  /**
   * Lose a heart (when game is failed)
   */
  loseHeart(): void {
    const currentState = this.heartsStateSubject.value;
    const newHeartsRemaining = Math.max(0, currentState.heartsRemaining - 1);
    
    const newState: HeartsState = {
      ...currentState,
      heartsRemaining: newHeartsRemaining,
      streak: 0 // Reset streak when heart is lost
    };

    this.heartsStateSubject.next(newState);
    this.saveHeartsState(newState);
    
    console.log(`Heart lost! Hearts remaining: ${newHeartsRemaining}, Streak reset to 0`);
  }

  /**
   * Win a game (increment streak)
   */
  winGame(): void {
    const currentState = this.heartsStateSubject.value;
    const newStreak = currentState.streak + 1;
    const newBestStreak = Math.max(currentState.bestStreak, newStreak);
    
    const newState: HeartsState = {
      ...currentState,
      streak: newStreak,
      bestStreak: newBestStreak
    };

    this.heartsStateSubject.next(newState);
    this.saveHeartsState(newState);
    
    console.log(`Game won! New streak: ${newStreak}, Best streak: ${newBestStreak}`);
  }

  /**
   * Update streak directly (for single game mode)
   */
  updateStreak(newStreak: number, newBestStreak: number): void {
    const currentState = this.heartsStateSubject.value;
    
    const newState: HeartsState = {
      ...currentState,
      streak: newStreak,
      bestStreak: newBestStreak
    };

    this.heartsStateSubject.next(newState);
    this.saveHeartsState(newState);
    
    console.log(`Streak updated! New streak: ${newStreak}, Best streak: ${newBestStreak}`);
  }

  /**
   * Reset streak to 0 (for single game mode failures)
   */
  resetStreak(): void {
    const currentState = this.heartsStateSubject.value;
    
    const newState: HeartsState = {
      ...currentState,
      streak: 0
    };

    this.heartsStateSubject.next(newState);
    this.saveHeartsState(newState);
    
    console.log('Streak reset to 0!');
  }

  /**
   * Reset hearts to full (used when all hearts are lost)
   */
  resetHearts(): void {
    const currentState = this.heartsStateSubject.value;
    const newState: HeartsState = {
      ...currentState,
      heartsRemaining: this.TOTAL_HEARTS,
      streak: 0
    };

    this.heartsStateSubject.next(newState);
    this.saveHeartsState(newState);
    
    console.log('Hearts reset to full! Arcade progress will be reset.');
  }

  /**
   * Check if all hearts are lost
   */
  areAllHeartsLost(): boolean {
    return this.heartsStateSubject.value.heartsRemaining === 0;
  }

  /**
   * Get default hearts state
   */
  private getDefaultHeartsState(): HeartsState {
    return {
      heartsRemaining: this.TOTAL_HEARTS,
      totalHearts: this.TOTAL_HEARTS,
      streak: 0,
      bestStreak: 0
    };
  }

  /**
   * Load hearts state from storage
   */
  private loadHeartsState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const state: HeartsState = JSON.parse(saved);
        this.heartsStateSubject.next(state);
        console.log('Hearts state loaded from storage:', state);
      }
    } catch (error) {
      console.warn('Failed to load hearts state:', error);
    }
  }

  /**
   * Save hearts state to storage
   */
  private saveHeartsState(state: HeartsState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save hearts state to storage:', error);
    }
  }
}
