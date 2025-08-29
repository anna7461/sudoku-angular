import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GameState {
  currentTime: string;
  currentDifficulty: string;
  mistakesLimit: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState>({
    currentTime: '00:00',
    currentDifficulty: 'Test',
    mistakesLimit: 3
  });

  public gameState$ = this.gameStateSubject.asObservable();

  /**
   * Update the current game state
   */
  updateGameState(state: Partial<GameState>): void {
    const currentState = this.gameStateSubject.value;
    this.gameStateSubject.next({ ...currentState, ...state });
  }

  /**
   * Get the current game state
   */
  getCurrentGameState(): GameState {
    return this.gameStateSubject.value;
  }
}
