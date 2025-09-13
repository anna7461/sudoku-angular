import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';
import { ThemeService } from '../../services/theme.service';
import { StorageService } from '../../services/storage.service';
import { LocalStorageService, SavedGameInfo } from '../../services/local-storage.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';
import { DifficultyDialogComponent } from '../difficulty-dialog/difficulty-dialog.component';
import {GameBoardAnimationComponent} from '../game-board-animation/game-board-animation';

interface GameMode {
  id: string;
  icon: string;
  label: string;
  description: string;
  buttonText: string;
  isActive: boolean;
  isComingSoon: boolean;
}

// Remove local interface since we're using the one from LocalStorageService

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, DifficultyDialogComponent, GameBoardAnimationComponent],
})
export class DashboardComponent implements OnInit, OnDestroy {
  gameModes: GameMode[] = [
    {
      id: 'daily-challenge',
      icon: '🏆',
      label: 'Daily Challenge',
      description: 'New puzzle every day',
      buttonText: 'Coming Soon',
      isActive: false,
      isComingSoon: true
    },
    {
      id: 'arcade-mode',
      icon: '🛣️',
      label: 'Arcade Mode',
      description: 'Endless challenges',
      buttonText: 'Coming Soon',
      isActive: false,
      isComingSoon: true
    }
  ];

  savedGameInfo: SavedGameInfo = { exists: false };

  showDifficultyDialog: boolean = false;

  constructor(
    private router: Router,
    private newGameService: NewGameService,
    private themeService: ThemeService,
    private storageService: StorageService,
    private localStorageService: LocalStorageService,
    private scrollToTopService: ScrollToTopService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Ensure body scroll is enabled when dashboard loads (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }

    this.checkForSavedGame();

    // Scroll to top when dashboard initializes
    this.scrollToTopService.scrollToTop();

    // Listen for route changes to refresh saved game info when returning to dashboard
    this.router.events.subscribe((event) => {
      if (event.type === 1) { // NavigationEnd event
        this.checkForSavedGame();
      }
    });
  }

  ngOnDestroy(): void {
    // Restore body scroll if component is destroyed while dialog is open (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }



  checkForSavedGame(): void {
    // Check for saved game in classic mode
    this.savedGameInfo = this.localStorageService.getSavedGameInfo('classic');
    
    // Log for debugging
    if (this.savedGameInfo.exists) {
      // Found saved game
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  onContinueGame(): void {
    // Ensure body scroll is restored (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }

    // Scroll to top before navigating to ensure clean start
    this.scrollToTopService.scrollToTopInstant();

    // Navigate to the main game component
    this.router.navigate(['/sudoku']);
  }

  onNewGameClick(): void {
    this.showDifficultyDialog = true;
    // Prevent body scroll when dialog is open (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  onDifficultySelected(difficulty: GameDifficulty): void {
    // Dashboard: Starting new game

    // Close the dialog
    this.showDifficultyDialog = false;
    // Restore body scroll (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }

    // Start new game with selected difficulty
    this.newGameService.startNewGame({
      difficulty: difficulty,
      clearCurrentGame: true,
      resetTimer: true
    });

    // Ensure body scroll is restored before navigation (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }

    // Scroll to top before navigating to ensure clean start
    this.scrollToTopService.scrollToTopInstant();

    // Navigate to the game
    this.router.navigate(['/sudoku']);
  }

  onDifficultyDialogClose(): void {
    this.showDifficultyDialog = false;
    // Restore body scroll (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  onGameModeClick(mode: GameMode): void {
    if (mode.isComingSoon) {
      // Show coming soon message or handle future development
      console.log(`${mode.label} is coming soon!`);
    } else if (mode.isActive) {
      // Handle active game mode
      console.log(`Starting ${mode.label}`);
    }
  }

  private getDifficultyLabelFromString(difficulty: string): string {
    const labels: { [key: string]: string } = {
      'test': 'Test',
      'easy': 'Easy',
      'medium': 'Medium',
      'hard': 'Hard',
      'expert': 'Expert'
    };
    return labels[difficulty] || difficulty;
  }


}
