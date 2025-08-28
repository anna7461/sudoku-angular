import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';
import { ThemeService } from '../../services/theme.service';
import { StorageService } from '../../services/storage.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';

interface GameMode {
  id: string;
  icon: string;
  label: string;
  description: string;
  buttonText: string;
  isActive: boolean;
  isComingSoon: boolean;
}

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
  imports: [CommonModule],
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
  showDifficultyOverlay = false;
  selectedDifficulty: GameDifficulty = 'medium';

  constructor(
    private router: Router,
    private newGameService: NewGameService,
    private themeService: ThemeService,
    private storageService: StorageService,
    private scrollToTopService: ScrollToTopService
  ) {}

  ngOnInit(): void {
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
    // Cleanup if needed
  }



  checkForSavedGame(): void {
    // Check if there's a saved game in localStorage
    const savedGame = localStorage.getItem('sudoku-game-state');
    if (savedGame) {
      try {
        const gameData = JSON.parse(savedGame);
        if (gameData && gameData.boxes && gameData.boxes.length > 0) {
          // Prefer timer's saved state for exact parity with in-game timer
          let currentElapsedTime = 0;
          const savedTimer = localStorage.getItem('sudoku-timer-state');
          if (savedTimer) {
            try {
              const timerState = JSON.parse(savedTimer);
              const startTime: number = timerState.startTime || 0; // ms
              const totalPausedTime: number = timerState.totalPausedTime || 0; // ms
              const elapsedSeconds: number = timerState.elapsedSeconds || 0; // s
              const hasStarted: boolean = !!timerState.hasStarted;

              if (hasStarted && startTime > 0) {
                const now = Date.now();
                currentElapsedTime = Math.max(
                  0,
                  Math.floor((now - startTime - totalPausedTime) / 1000)
                );
              } else {
                currentElapsedTime = elapsedSeconds;
              }
            } catch {
              // Fallback to game state if timer state parsing fails
              currentElapsedTime = gameData.totalGameTime || 0;
              if (!gameData.isGamePaused && gameData.gameStartTime) {
                const now = Date.now();
                const startTime = gameData.gameStartTime;
                const additionalTime = Math.floor((now - startTime) / 1000);
                currentElapsedTime += additionalTime;
              }
            }
          } else {
            // Fallback to game state if no timer state exists
            currentElapsedTime = gameData.totalGameTime || 0;
            if (!gameData.isGamePaused && gameData.gameStartTime) {
              const now = Date.now();
              const startTime = gameData.gameStartTime;
              const additionalTime = Math.floor((now - startTime) / 1000);
              currentElapsedTime += additionalTime;
            }
          }

          // Get difficulty from the correct field
          const difficulty = gameData.difficulty || 'Unknown';

          this.savedGameInfo = {
            exists: true,
            timeElapsed: this.formatTime(currentElapsedTime),
            difficulty: this.getDifficultyLabel(difficulty)
          };
        } else {
          this.savedGameInfo = { exists: false };
        }
      } catch (error) {
        console.warn('Error parsing saved game data:', error);
        this.savedGameInfo = { exists: false };
      }
    } else {
      this.savedGameInfo = { exists: false };
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  onContinueGame(): void {
    // Scroll to top before navigating to ensure clean start
    this.scrollToTopService.scrollToTopInstant();
    
    // Navigate to the main game component
    this.router.navigate(['/sudoku']);
  }

  onNewGame(): void {
    this.showDifficultyOverlay = true;
  }

  onDifficultySelect(difficulty: string): void {
    console.log(`Dashboard: Difficulty selected: ${difficulty}, Type: ${typeof difficulty}`);
    this.selectedDifficulty = difficulty as GameDifficulty;
    this.showDifficultyOverlay = false;
    
    // Start new game with selected difficulty
    console.log(`Dashboard: Starting new game with difficulty: ${difficulty}`);
    this.newGameService.startNewGame({
      difficulty: difficulty as GameDifficulty,
      clearCurrentGame: true,
      resetTimer: true
    });

    // Scroll to top before navigating to ensure clean start
    this.scrollToTopService.scrollToTopInstant();

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

  onGameModeClick(mode: GameMode): void {
    if (mode.isComingSoon) {
      // Show coming soon message or handle future development
      console.log(`${mode.label} is coming soon!`);
    } else if (mode.isActive) {
      // Handle active game mode
      console.log(`Starting ${mode.label}`);
    }
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
}
