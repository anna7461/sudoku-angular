import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Output() timerUpdate = new EventEmitter<number>();
  @Output() pauseStateChange = new EventEmitter<boolean>();

  private timerInterval: any;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private totalPausedTime: number = 0;
  
  elapsedSeconds: number = 0;
  isPaused: boolean = false;
  hasStarted: boolean = false;

  ngOnInit() {
    this.resetTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    if (!this.hasStarted) {
      this.startTime = Date.now();
      this.hasStarted = true;
    }
    
    if (!this.isPaused) {
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

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.hasStarted && !this.isPaused) {
      this.pausedTime = Date.now();
      this.isPaused = true;
      this.pauseStateChange.emit(true);
    }
  }

  continueTimer() {
    if (this.isPaused) {
      this.totalPausedTime += Date.now() - this.pausedTime;
      this.isPaused = false;
      this.pauseStateChange.emit(false);
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
    this.timerUpdate.emit(0);
  }

  private updateTimer() {
    if (this.startTime > 0) {
      const currentTime = Date.now();
      this.elapsedSeconds = Math.floor((currentTime - this.startTime - this.totalPausedTime) / 1000);
      this.timerUpdate.emit(this.elapsedSeconds);
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.continueTimer();
    } else {
      this.pauseTimer();
    }
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Handle external pause state changes
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isGameActive'] || changes['isGameCompleted']) {
      if (!this.isGameActive || this.isGameCompleted) {
        this.pauseTimer();
      } else if (this.isGameActive && !this.isGameCompleted && this.hasStarted && !this.isPaused) {
        this.startTimer();
      }
    }
  }
}
