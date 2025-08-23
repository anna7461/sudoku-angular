import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';
import { ThemeService } from '../../services/theme.service';
import { StorageService } from '../../services/storage.service';
import { DailyChallengeService } from '../../services/daily-challenge.service';
import { GameStateService } from '../../services/game-state.service';
import { HeartsService } from '../../services/hearts.service';
import { GameMode, GameModeConfig } from '../../models/game-modes';

import { SettingsOverlayComponent } from '../settings-overlay/settings-overlay.component';
import { HelpOverlayComponent } from '../help-overlay/help-overlay.component';
import { DailyChallengeCalendarComponent } from '../daily-challenge-calendar/daily-challenge-calendar.component';
import { DailyChallengeResultsComponent } from '../daily-challenge-results/daily-challenge-results.component';
import { HeaderService } from '../../services/header.service';
import { Subject, takeUntil } from 'rxjs';

interface SavedGameInfo {
  exists: boolean;
  timeElapsed?: string;
  difficulty?: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule, 
    SettingsOverlayComponent, 
    HelpOverlayComponent,
    DailyChallengeCalendarComponent,
    DailyChallengeResultsComponent,
  ],
  host: {
    '[class]': 'getThemeClass()'
  }
})
export class DashboardComponent implements OnInit, OnDestroy {
  gameModes: GameModeConfig[] = [
    {
      id: GameMode.DAILY_CHALLENGE,
      name: 'Daily Challenge',
      description: 'New puzzle every day',
      icon: '🏆',
      isActive: true,
      isComingSoon: false
    },
    {
      id: GameMode.SINGLE_GAME,
      name: 'Single Game',
      description: 'Classic sudoku puzzle',
      icon: '🎯',
      isActive: true,
      isComingSoon: false
    },
    {
      id: GameMode.ARCADE_MODE,
      name: 'Arcade Mode',
      description: 'Progressive challenges',
      icon: '🛣️',
      isActive: true,
      isComingSoon: false
    }
  ];

  savedGameInfo: SavedGameInfo = { exists: false };
  showDifficultyOverlay = false;
  selectedDifficulty: GameDifficulty = 'medium';
  showSettingsOverlay = false;
  showHelpOverlay = false;
  showDailyChallengeCalendar = false;
  showDailyChallengeResults = false;

  // Hearts and streaks
  heartsRemaining = 3;
  currentStreak = 0;
  bestStreak = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private newGameService: NewGameService,
    private themeService: ThemeService,
    private storageService: StorageService,
    private dailyChallengeService: DailyChallengeService,
    private gameStateService: GameStateService,
    private heartsService: HeartsService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.checkForSavedGames();
    this.updateGameModeButtons();
    
    // Ensure daily challenge service is initialized
    this.dailyChallengeService.initialize();
    
    // Subscribe to hearts service
    this.heartsService.heartsState$.subscribe(state => {
      this.heartsRemaining = state.heartsRemaining;
      this.currentStreak = state.streak;
      this.bestStreak = state.bestStreak;
    });
    
    // Listen for route changes to refresh saved game info when returning to dashboard
    this.router.events.subscribe((event) => {
      if (event.type === 1) { // NavigationEnd event
        this.checkForSavedGames();
        this.updateGameModeButtons();
      }
    });

    // Listen for header actions
    this.headerService.action$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(action => {
      if (action.source === 'dashboard') {
        if (action.type === 'settings') {
          this.onOpenSettings();
        } else if (action.type === 'help') {
          this.onOpenHelp();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Cleanup if needed
  }

  getThemeClass(): string {
    return this.themeService.getCurrentTheme().className;
  }

  /**
   * Update game mode button states and text
   */
  private updateGameModeButtons(): void {
    // Update daily challenge button
    const dailyChallengeMode = this.gameModes.find(mode => mode.id === GameMode.DAILY_CHALLENGE);
    if (dailyChallengeMode) {
      if (this.dailyChallengeService.isTodayCompleted()) {
        dailyChallengeMode.isActive = true; // Keep active to show results
      } else {
        dailyChallengeMode.isActive = true;
      }
    }

    // Update single game button
    const singleGameMode = this.gameModes.find(mode => mode.id === GameMode.SINGLE_GAME);
    if (singleGameMode) {
      singleGameMode.isActive = this.gameStateService.hasGameState(GameMode.SINGLE_GAME);
    }
  }

  /**
   * Check for saved games across all modes (excluding daily challenge)
   */
  checkForSavedGames(): void {
    // Check for saved game states excluding daily challenge mode
    // Daily challenge should only be continued via the "View Results" button
    if (this.gameStateService.hasGameState(GameMode.SINGLE_GAME)) {
      this.savedGameInfo = this.gameStateService.getSavedGameInfo(GameMode.SINGLE_GAME);
    } else if (this.gameStateService.hasGameState(GameMode.ARCADE_MODE)) {
      this.savedGameInfo = this.gameStateService.getSavedGameInfo(GameMode.ARCADE_MODE);
    } else {
      this.savedGameInfo = { exists: false };
    }
  }

  onContinueGame(): void {
    // Set the appropriate game mode before navigating
    // Priority: Single Game > Arcade Mode (excluding Daily Challenge)
    if (this.gameStateService.hasGameState(GameMode.SINGLE_GAME)) {
      this.gameStateService.setCurrentMode(GameMode.SINGLE_GAME);
      this.router.navigate(['/sudoku']);
    } else if (this.gameStateService.hasGameState(GameMode.ARCADE_MODE)) {
      this.gameStateService.setCurrentMode(GameMode.ARCADE_MODE);
      this.router.navigate(['/arcade/play']);
    }
  }

  onNewGame(): void {
    this.showDifficultyOverlay = true;
  }

  onDifficultySelect(difficulty: string): void {
    console.log(`Dashboard: Difficulty selected: ${difficulty}, Type: ${typeof difficulty}`);
    this.selectedDifficulty = difficulty as GameDifficulty;
    this.showDifficultyOverlay = false;
    
    // Start new single game with selected difficulty
    console.log(`Dashboard: Starting new single game with difficulty: ${difficulty}`);
    this.newGameService.startSingleGame(difficulty as GameDifficulty);

    // Navigate to the game
    this.router.navigate(['/sudoku']);
  }

  closeDifficultyOverlay(): void {
    this.showDifficultyOverlay = false;
  }

  onOverlayClick(event: Event): void {
    // Close overlay if clicking on the backdrop
    if (event.target === event.currentTarget) {
      this.closeDifficultyOverlay();
    }
  }

  onOpenSettings(): void {
    this.showSettingsOverlay = true;
    this.showHelpOverlay = false;
  }

  onOpenHelp(): void {
    this.showHelpOverlay = true;
    this.showSettingsOverlay = false;
  }

  onCloseSettings(): void {
    this.showSettingsOverlay = false;
  }

  onCloseHelp(): void {
    this.showHelpOverlay = false;
  }

  onGameModeClick(mode: GameModeConfig): void {
    if (mode.isComingSoon) {
      // Show coming soon message or handle future development
      console.log(`${mode.name} is coming soon!`);
    } else if (mode.isActive) {
      // Handle active game mode
      if (mode.id === GameMode.DAILY_CHALLENGE) {
        if (this.dailyChallengeService.isTodayCompleted() || this.gameStateService.hasGameState(GameMode.DAILY_CHALLENGE)) {
          // Show results view for both completed and incomplete challenges
          this.showDailyChallengeResults = true;
        } else {
          // Show calendar to start new challenge
          this.showDailyChallengeCalendar = true;
        }
      } else if (mode.id === GameMode.SINGLE_GAME) {
        if (this.gameStateService.hasGameState(GameMode.SINGLE_GAME)) {
          // Set mode and continue existing game
          this.gameStateService.setCurrentMode(GameMode.SINGLE_GAME);
          this.router.navigate(['/sudoku']);
        } else {
          // Start new single game
          this.onNewGame();
        }
      } else if (mode.id === GameMode.ARCADE_MODE) {
        // Navigate to arcade page instead of showing dialog
        this.router.navigate(['/arcade']);
      } else {
        console.log(`Starting ${mode.name}`);
      }
    }
  }

  /**
   * Handle daily challenge calendar close
   */
  onCloseDailyChallengeCalendar(): void {
    this.showDailyChallengeCalendar = false;
  }

  /**
   * Handle daily challenge results close
   */
  onCloseDailyChallengeResults(): void {
    this.showDailyChallengeResults = false;
  }

  /**
   * Handle starting a daily challenge
   */
  onStartDailyChallenge(difficulty: string): void {
    this.showDailyChallengeCalendar = false;
    
    // Start new daily challenge game
    this.newGameService.startDailyChallenge(difficulty as GameDifficulty);

    // Navigate to the game
    this.router.navigate(['/sudoku']);
  }

  /**
   * Handle viewing calendar from results
   */
  onViewCalendarFromResults(): void {
    this.showDailyChallengeResults = false;
    this.showDailyChallengeCalendar = true;
  }

  /**
   * Handle continuing daily challenge from results view
   */
  onContinueDailyChallenge(): void {
    this.showDailyChallengeResults = false;
    
    // Set daily challenge mode and navigate to continue the puzzle
    this.gameStateService.setCurrentMode(GameMode.DAILY_CHALLENGE);
    this.router.navigate(['/sudoku']);
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: { [key: string]: string } = {
      'test': 'Test',
      'easy': 'Easy',
      'medium': 'Medium',
      'hard': 'Hard',
      'expert': 'Expert'
    };
    return labels[difficulty] || difficulty;
  }

  getDifficultyIcon(difficulty: string): string {
    const icons: { [key: string]: string } = {
      'test': '🧪',
      'easy': '😊',
      'medium': '🤔',
      'hard': '😰',
      'expert': '😱'
    };
    return icons[difficulty] || '❓';
  }

  getDifficultyDescription(difficulty: string): string {
    const descriptions: { [key: string]: string } = {
      'test': 'Quick puzzle for testing',
      'easy': 'Perfect for beginners',
      'medium': 'Balanced challenge',
      'hard': 'For experienced players',
      'expert': 'Ultimate challenge'
    };
    return descriptions[difficulty] || 'Select difficulty';
  }

  /**
   * Check if daily challenge is completed
   */
  isDailyChallengeCompleted(): boolean {
    return this.dailyChallengeService.isTodayCompleted();
  }

  /**
   * Get button text for a game mode
   */
  getModeButtonText(mode: GameModeConfig): string {
    if (mode.isComingSoon) {
      return 'Coming Soon';
    }
    
    if (mode.id === GameMode.DAILY_CHALLENGE) {
      if (this.dailyChallengeService.isTodayCompleted() || this.gameStateService.hasGameState(GameMode.DAILY_CHALLENGE)) {
        return 'View Results';
      } else {
        return 'Play';
      }
    }
    
    if (mode.id === GameMode.SINGLE_GAME) {
      if (this.gameStateService.hasGameState(GameMode.SINGLE_GAME)) {
        return 'Continue';
      } else {
        return 'Play';
      }
    }
    
    if (mode.id === GameMode.ARCADE_MODE) {
      if (this.gameStateService.hasGameState(GameMode.ARCADE_MODE)) {
        return 'Continue';
      } else {
        return 'Play';
      }
    }
    
    return 'Play';
  }

  /**
   * Get hearts array for display (filled vs empty)
   */
  getHeartsArray(): boolean[] {
    const hearts: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(i < this.heartsRemaining);
    }
    return hearts;
  }

  /**
   * Check if current mode is arcade mode
   */
  isArcadeMode(): boolean {
    return this.gameStateService.getCurrentMode() === GameMode.ARCADE_MODE;
  }
}
