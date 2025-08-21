import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyChallengeService, DailyChallengeState, CountdownTimer } from '../../services/daily-challenge.service';
import { GameStateService } from '../../services/game-state.service';
import { GameMode } from '../../models/game-modes';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-daily-challenge-results',
  templateUrl: './daily-challenge-results.component.html',
  styleUrls: ['./daily-challenge-results.component.scss'],
  imports: [CommonModule]
})
export class DailyChallengeResultsComponent implements OnInit, OnDestroy {
  @Output() closeResults = new EventEmitter<void>();
  @Output() viewCalendar = new EventEmitter<void>();
  @Output() continueChallenge = new EventEmitter<void>();

  todayChallenge?: DailyChallengeState;
  countdown: CountdownTimer = { hours: 0, minutes: 0, seconds: 0 };
  completedChallenges: DailyChallengeState[] = [];
  currentStreak: number = 0;
  
  private countdownSubscription?: Subscription;

  constructor(
    private dailyChallengeService: DailyChallengeService,
    private gameStateService: GameStateService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscribeToCountdown();
  }

  ngOnDestroy(): void {
    this.countdownSubscription?.unsubscribe();
  }

  /**
   * Load all necessary data
   */
  private loadData(): void {
    this.todayChallenge = this.dailyChallengeService.getTodayChallenge() || undefined;
    this.completedChallenges = this.dailyChallengeService.getCompletedChallenges();
    this.currentStreak = this.dailyChallengeService.getCurrentStreak();
  }

  /**
   * Subscribe to countdown updates
   */
  private subscribeToCountdown(): void {
    this.countdownSubscription = this.dailyChallengeService.countdown$.subscribe(countdown => {
      this.countdown = countdown;
    });
  }

  /**
   * Close the results view
   */
  onClose(): void {
    this.closeResults.emit();
  }

  /**
   * View the calendar
   */
  onViewCalendar(): void {
    this.viewCalendar.emit();
  }

  /**
   * Continue incomplete daily challenge
   */
  onContinueChallenge(): void {
    this.continueChallenge.emit();
  }

  /**
   * Check if today's challenge is incomplete
   */
  isTodayChallengeIncomplete(): boolean {
    // Check if there's an incomplete daily challenge (has game state but not completed)
    const hasGameState = this.gameStateService.hasGameState(GameMode.DAILY_CHALLENGE);
    const isCompleted = this.dailyChallengeService.isTodayCompleted();
    return hasGameState && !isCompleted;
  }

  /**
   * Get countdown text
   */
  getCountdownText(): string {
    const { hours, minutes, seconds } = this.countdown;
    return `Next challenge unlocks in ${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Get difficulty display text
   */
  getDifficultyText(difficulty: string): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  /**
   * Format completion time
   */
  formatCompletionTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get date display text
   */
  getDateDisplay(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Get streak emoji based on count
   */
  getStreakEmoji(streak: number): string {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    if (streak >= 1) return '✨';
    return '💫';
  }
}
