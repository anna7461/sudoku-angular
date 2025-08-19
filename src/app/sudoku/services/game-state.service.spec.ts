import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { GameMode } from '../models/game-modes';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStateService]
    });
    service = TestBed.inject(GameStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with SINGLE_GAME as default mode', () => {
    expect(service.getCurrentMode()).toBe(GameMode.SINGLE_GAME);
  });

  it('should be able to change game mode', () => {
    service.setCurrentMode(GameMode.DAILY_CHALLENGE);
    expect(service.getCurrentMode()).toBe(GameMode.DAILY_CHALLENGE);
  });

  it('should start with no saved game states', () => {
    expect(service.hasGameState(GameMode.SINGLE_GAME)).toBe(false);
    expect(service.hasGameState(GameMode.DAILY_CHALLENGE)).toBe(false);
    expect(service.hasGameState(GameMode.ARCADE_MODE)).toBe(false);
  });

  it('should be able to start a new game', () => {
    service.startNewGame(GameMode.SINGLE_GAME, 'easy');
    expect(service.getCurrentMode()).toBe(GameMode.SINGLE_GAME);
    expect(service.hasGameState(GameMode.SINGLE_GAME)).toBe(true);
  });

  it('should maintain separate states for different modes', () => {
    // Start a single game
    service.startNewGame(GameMode.SINGLE_GAME, 'easy');
    
    // Start a daily challenge
    service.startNewGame(GameMode.DAILY_CHALLENGE, 'medium');
    
    // Both should have states
    expect(service.hasGameState(GameMode.SINGLE_GAME)).toBe(true);
    expect(service.hasGameState(GameMode.DAILY_CHALLENGE)).toBe(true);
    
    // States should be different
    const singleGameState = service.getGameState(GameMode.SINGLE_GAME);
    const dailyChallengeState = service.getGameState(GameMode.DAILY_CHALLENGE);
    
    expect(singleGameState?.difficulty).toBe('easy');
    expect(dailyChallengeState?.difficulty).toBe('medium');
  });
});
