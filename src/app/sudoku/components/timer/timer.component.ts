import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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

  private timerInterval: any;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private totalPausedTime: number = 0;
  private readonly TIMER_STORAGE_KEY = 'sudoku-timer-state';
  
  elapsedSeconds: number = 0;
  isPaused: boolean = false;
  hasStarted: boolean = false;
  private isRestored: boolean = false; // Flag to prevent multiple restorations

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
      this.saveTimerState(); // Save state when pausing
    }
  }

  continueTimer() {
    if (this.isPaused) {
      this.totalPausedTime += Date.now() - this.pausedTime;
      this.isPaused = false;
      this.saveTimerState(); // Save state when continuing
      this.startTimer();
    }
  }

  // Public method to resume timer when game is unpaused
  resumeGameTimer() {
    if (this.isPaused) {
      this.continueTimer();
    } else if (this.hasStarted && !this.timerInterval) {
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
    
    // Clear saved timer state (browser only)
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(this.TIMER_STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to clear timer state:', error);
      }
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
    if (isPlatformBrowser(this.platformId)) {
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
        // Restoring timer from parent game start time
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

      // No longer loading from main game state - start fresh

      // Fallback to timer-specific localStorage state (browser only)
      const savedState = isPlatformBrowser(this.platformId) ? localStorage.getItem(this.TIMER_STORAGE_KEY) : null;
      if (savedState) {
        const timerState = JSON.parse(savedState);
        // Restoring timer from timer localStorage
        
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
        // No saved timer state found, starting fresh
        this.resetTimer();
      }
    } catch (error) {
      console.warn('Failed to restore timer state:', error);
      this.resetTimer();
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
    
    if (changes['isGameActive'] || changes['isGameCompleted'] || changes['isGamePaused']) {
      if (!this.isGameActive || this.isGameCompleted || this.isGamePaused) {
        this.pauseTimer();
      } else if (this.isGameActive && !this.isGameCompleted && !this.isGamePaused && this.hasStarted) {
        // Resume timer when game becomes active and not paused
        if (this.isPaused) {
          this.continueTimer();
        } else if (!this.timerInterval) {
          this.startTimer();
        }
      }
    }
  }
}
