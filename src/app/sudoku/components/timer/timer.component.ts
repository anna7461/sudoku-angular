import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PauseService } from '../../services/pause.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss']
})
export class TimerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isGameActive: boolean = true;
  @Input() isGamePaused: boolean = false;
  @Input() isGameCompleted: boolean = false;
  @Input() gameStartTime: number | null = null; // Add input for game start time from parent
  @Input() savedElapsedTime: number = 0; // Add input for saved elapsed time
  @Output() timerUpdate = new EventEmitter<number>();
  @Output() pauseStateChange = new EventEmitter<boolean>();

  private timerInterval: any;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private totalPausedTime: number = 0;
  private readonly TIMER_STORAGE_KEY = 'sudoku-timer-state';
  
  elapsedSeconds: number = 0;
  isPaused: boolean = false;
  hasStarted: boolean = false;
  private isRestored: boolean = false; // Flag to prevent multiple restorations

  constructor(private pauseService: PauseService) {}

  ngOnInit() {
    // Delay restoration slightly to avoid race conditions with parent component
    setTimeout(() => {
      this.restoreTimerState();
    }, 50);
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    if (!this.hasStarted) {
      // Only set startTime if we don't already have one (fresh start)
      if (this.startTime === 0) {
        this.startTime = Date.now();
      }
      this.hasStarted = true;
      this.saveTimerState(); // Save state when starting
    }
    
    if (!this.isPaused && !this.timerInterval) {
      this.timerInterval = setInterval(() => {
        this.updateTimer();
      }, 1000);
    }
  }

  // Public method to start timer externally (called from parent component)
  startGameTimer() {
    if (!this.hasStarted) {
      this.startTimer();
    }
  }

  // Public method to reset timer externally (called from parent component)
  resetGameTimer() {
    this.resetTimer();
  }

  // Public method to restore timer from saved game state
  restoreFromGameState(gameStartTime: number | null, elapsedSeconds: number) {
    if (gameStartTime && gameStartTime > 0) {
      console.log('Restoring timer from game state:', { gameStartTime, elapsedSeconds });
      this.startTime = gameStartTime;
      this.hasStarted = true;
      this.elapsedSeconds = elapsedSeconds;
      
      // Calculate how much time should have passed since game start
      const currentTime = Date.now();
      const expectedElapsed = Math.floor((currentTime - gameStartTime) / 1000);
      
      // If there's a significant difference, adjust totalPausedTime
      if (expectedElapsed > elapsedSeconds) {
        this.totalPausedTime = (expectedElapsed - elapsedSeconds) * 1000;
      }
      
      // Save the restored state
      this.saveTimerState();
      
      // If game is active and not paused, continue the timer
      if (this.isGameActive && !this.isGamePaused && !this.isGameCompleted) {
        this.startTimer();
      }
    }
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.hasStarted && !this.isPaused) {
      this.pausedTime = Date.now();
      this.isPaused = true;
      this.pauseStateChange.emit(true);
      this.saveTimerState(); // Save state when pausing
    }
  }

  continueTimer() {
    if (this.isPaused) {
      this.totalPausedTime += Date.now() - this.pausedTime;
      this.isPaused = false;
      this.pauseStateChange.emit(false);
      this.saveTimerState(); // Save state when continuing
      this.startTimer();
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.elapsedSeconds = 0;
    this.startTime = 0;
    this.pausedTime = 0;
    this.totalPausedTime = 0;
    this.isPaused = false;
    this.hasStarted = false;
    this.isRestored = false; // Reset restoration flag for new games
    this.timerUpdate.emit(0);
    
    // Clear saved timer state
    try {
      localStorage.removeItem(this.TIMER_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear timer state:', error);
    }
  }

  private updateTimer() {
    if (this.startTime > 0) {
      const currentTime = Date.now();
      this.elapsedSeconds = Math.floor((currentTime - this.startTime - this.totalPausedTime) / 1000);
      this.timerUpdate.emit(this.elapsedSeconds);
      
      // Save timer state on each update
      this.saveTimerState();
    }
  }

  private saveTimerState(): void {
    try {
      const timerState = {
        startTime: this.startTime,
        totalPausedTime: this.totalPausedTime,
        elapsedSeconds: this.elapsedSeconds,
        isPaused: this.isPaused,
        hasStarted: this.hasStarted,
        pausedTime: this.isPaused ? this.pausedTime : 0,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch (error) {
      console.warn('Failed to save timer state:', error);
    }
  }

  private restoreTimerState(): void {
    // Prevent multiple restoration attempts
    if (this.isRestored) {
      console.log('Timer already restored, skipping restoration');
      return;
    }

    try {
      // First check if parent component provided game start time
      if (this.gameStartTime && this.gameStartTime > 0) {
        console.log('Restoring timer from parent game start time:', this.gameStartTime);
        this.startTime = this.gameStartTime;
        this.hasStarted = true;
        this.elapsedSeconds = this.savedElapsedTime;
        this.isRestored = true;
        
        // If game is active and not paused, continue the timer
        if (this.isGameActive && !this.isGamePaused && !this.isGameCompleted) {
          this.startTimer();
        }
        return;
      }

      // Check main game state first (same key as sudoku component)
      const mainGameState = localStorage.getItem('sudoku-game-state');
      if (mainGameState) {
        const gameState = JSON.parse(mainGameState);
        console.log('Restoring timer from main game state:', gameState);
        
        if (gameState.gameStartTime && gameState.gameStartTime > 0) {
          this.startTime = gameState.gameStartTime;
          this.hasStarted = true;
          this.elapsedSeconds = gameState.totalGameTime || 0;
          this.isRestored = true;
          
          // Calculate the correct elapsed time based on current time
          const currentTime = Date.now();
          const actualElapsed = Math.floor((currentTime - this.startTime) / 1000);
          
          // If there's a significant difference, it means the game was paused
          if (actualElapsed > this.elapsedSeconds) {
            this.totalPausedTime = (actualElapsed - this.elapsedSeconds) * 1000;
          }
          
          console.log('Timer restored:', {
            startTime: this.startTime,
            elapsedSeconds: this.elapsedSeconds,
            totalPausedTime: this.totalPausedTime,
            actualElapsed
          });
          
          // Emit the current elapsed time to update the parent
          this.timerUpdate.emit(this.elapsedSeconds);
          
          // If game is active and not paused, continue the timer
          if (this.isGameActive && !this.isGamePaused && !this.isGameCompleted) {
            this.startTimer();
          }
          return;
        }
      }

      // Fallback to timer-specific localStorage state
      const savedState = localStorage.getItem(this.TIMER_STORAGE_KEY);
      if (savedState) {
        const timerState = JSON.parse(savedState);
        console.log('Restoring timer from timer localStorage:', timerState);
        
        // Restore timer state
        this.startTime = timerState.startTime || 0;
        this.totalPausedTime = timerState.totalPausedTime || 0;
        this.elapsedSeconds = timerState.elapsedSeconds || 0;
        this.isPaused = timerState.isPaused || false;
        this.hasStarted = timerState.hasStarted || false;
        this.pausedTime = timerState.pausedTime || 0;
        this.isRestored = true;
        
        // Emit the current elapsed time to update the parent
        this.timerUpdate.emit(this.elapsedSeconds);
        
        // If game is active and not paused, continue the timer
        if (this.isGameActive && !this.isGamePaused && !this.isGameCompleted && !this.isPaused) {
          this.startTimer();
        }
      } else {
        console.log('No saved timer state found, starting fresh');
        this.resetTimer();
      }
    } catch (error) {
      console.warn('Failed to restore timer state:', error);
      this.resetTimer();
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.continueTimer();
    } else {
      // Use PauseService to pause the game
      this.pauseService.pauseGame();
      this.pauseTimer();
    }
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Get the most accurate current elapsed time (even when paused)
  getCurrentElapsedTime(): number {
    if (this.startTime > 0) {
      const currentTime = Date.now();
      return Math.floor((currentTime - this.startTime - this.totalPausedTime) / 1000);
    }
    return this.elapsedSeconds;
  }
  
  // Get formatted time using the most accurate current time
  getCurrentFormattedTime(): string {
    const currentSeconds = this.getCurrentElapsedTime();
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Handle external pause state changes
  ngOnChanges(changes: SimpleChanges) {
    // Only handle parent inputs if timer hasn't been restored yet
    if (!this.isRestored) {
      // Handle game start time changes from parent
      if (changes['gameStartTime'] && this.gameStartTime && this.gameStartTime > 0 && !this.hasStarted) {
        console.log('Game start time provided by parent (before restoration):', this.gameStartTime);
        this.restoreTimerState();
      }
      
      // Handle saved elapsed time changes from parent
      if (changes['savedElapsedTime'] && this.savedElapsedTime > 0) {
        this.elapsedSeconds = this.savedElapsedTime;
      }
    }
    
    if (changes['isGameActive'] || changes['isGameCompleted']) {
      if (!this.isGameActive || this.isGameCompleted) {
        this.pauseTimer();
      } else if (this.isGameActive && !this.isGameCompleted && this.hasStarted && !this.isPaused) {
        this.startTimer();
      }
    }
  }
}
