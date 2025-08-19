import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DailyChallengeService, DailyChallengeState, CountdownTimer } from '../../services/daily-challenge.service';
import { Subscription } from 'rxjs';

interface CalendarDay {
  date: Date;
  dateString: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  challenge?: DailyChallengeState;
  isAvailable: boolean;
}

@Component({
  standalone: true,
  selector: 'app-daily-challenge-calendar',
  templateUrl: './daily-challenge-calendar.component.html',
  styleUrls: ['./daily-challenge-calendar.component.scss'],
  imports: [CommonModule]
})
export class DailyChallengeCalendarComponent implements OnInit, OnDestroy {
  @Output() closeCalendar = new EventEmitter<void>();
  @Output() startChallenge = new EventEmitter<string>();

  currentDate = new Date();
  currentMonth = new Date();
  calendarDays: CalendarDay[] = [];
  
  todayChallenge?: DailyChallengeState;
  countdown: CountdownTimer = { hours: 0, minutes: 0, seconds: 0 };
  
  private challengesSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  constructor(
    private dailyChallengeService: DailyChallengeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Ensure service is initialized
    this.dailyChallengeService.initialize();
    
    this.loadTodayChallenge();
    this.generateCalendar();
    this.subscribeToChanges();
  }

  ngOnDestroy(): void {
    this.challengesSubscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
  }

  /**
   * Load today's challenge state
   */
  private loadTodayChallenge(): void {
    this.todayChallenge = this.dailyChallengeService.getTodayChallenge() || undefined;
  }

  /**
   * Subscribe to challenge and countdown changes
   */
  private subscribeToChanges(): void {
    this.challengesSubscription = this.dailyChallengeService.challenges$.subscribe(() => {
      this.loadTodayChallenge();
      this.generateCalendar();
    });

    this.countdownSubscription = this.dailyChallengeService.countdown$.subscribe(countdown => {
      this.countdown = countdown;
    });
  }

  /**
   * Generate calendar days for the current month
   */
  private generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of week for the first day of month
    const firstDayOfWeek = firstDay.getDay();
    
    // Get last day of week for the last day of month
    const lastDayOfWeek = lastDay.getDay();
    
    this.calendarDays = [];
    
    // Add days from previous month to fill first week
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i);
      this.addCalendarDay(date, false);
    }
    
    // Add days of current month
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      this.addCalendarDay(new Date(date), true);
    }
    
    // Add days from next month to fill last week
    const nextMonth = new Date(year, month + 1, 1);
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      this.addCalendarDay(date, false);
    }
  }

  /**
   * Add a day to the calendar
   */
  private addCalendarDay(date: Date, isCurrentMonth: boolean): void {
    const dateString = date.toISOString().split('T')[0];
    const today = new Date();
    const isToday = dateString === today.toISOString().split('T')[0];
    
    const challenge = this.dailyChallengeService.getChallengeForDate(dateString) || undefined;
    const isAvailable = this.dailyChallengeService.isDateAvailable(dateString);
    
    this.calendarDays.push({
      date: new Date(date),
      dateString,
      isToday,
      isCurrentMonth,
      challenge,
      isAvailable
    });
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  /**
   * Navigate to current month
   */
  goToCurrentMonth(): void {
    this.currentMonth = new Date();
    this.generateCalendar();
  }

  /**
   * Handle day click
   */
  onDayClick(day: CalendarDay): void {
    if (!day.isAvailable || day.challenge?.isCompleted) {
      return; // Do nothing for unavailable or completed days
    }

    if (day.isCurrentMonth) {
      // Start today's challenge
      this.startChallenge.emit(day.challenge?.difficulty || 'easy');
    } else {
      // Handle past available days (could show a message or allow replay)
      console.log(`Past challenge available for ${day.date.toDateString()}`);
    }
  }

  /**
   * Check if a day should show play button
   */
  shouldShowPlayButton(day: CalendarDay): boolean {
    return day.isAvailable && !day.challenge?.isCompleted && day.isCurrentMonth;
  }

  /**
   * Check if a day should show completed state
   */
  isDayCompleted(day: CalendarDay): boolean {
    return day.challenge?.isCompleted || false;
  }

  /**
   * Get day status text
   */
  getDayStatusText(day: CalendarDay): string {
    if (day.challenge?.isCompleted) {
      return 'Completed';
    }
    if (day.isAvailable && day.isCurrentMonth) {
      return 'Play';
    }
    if (day.isAvailable && !day.isCurrentMonth) {
      return 'Available';
    }
    return 'Unavailable';
  }

  /**
   * Start today's challenge
   */
  startTodayChallenge(): void {
    const result = this.dailyChallengeService.startTodayChallenge();
    this.startChallenge.emit(result.difficulty);
  }

  /**
   * Start challenge for a past date
   */
  startPastChallenge(dateString: string): void {
    // For past dates, we'll create a new challenge with random difficulty
    const difficulty = this.dailyChallengeService.getRandomDifficulty();
    this.startChallenge.emit(difficulty);
  }

  /**
   * Close the calendar
   */
  onClose(): void {
    this.closeCalendar.emit();
  }

  /**
   * Get month name
   */
  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Get day name for header
   */
  getDayNames(): string[] {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  /**
   * Check if today's challenge is completed
   */
  isTodayCompleted(): boolean {
    return this.todayChallenge?.isCompleted || false;
  }

  /**
   * Get countdown text
   */
  getCountdownText(): string {
    const { hours, minutes, seconds } = this.countdown;
    return `Next available game in ${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Get difficulty display text
   */
  getDifficultyText(difficulty: string): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  /**
   * Get the first character of difficulty for the badge
   */
  getDifficultyFirstChar(difficulty: string): string {
    return difficulty ? difficulty.charAt(0).toUpperCase() : '';
  }

  /**
   * Get accessibility label for a calendar day
   */
  getDayAriaLabel(day: CalendarDay): string {
    if (!day.isAvailable) {
      return `${day.date.toLocaleDateString()} - Not available`;
    }
    
    if (day.challenge?.isCompleted) {
      return `${day.date.toLocaleDateString()} - Challenge completed`;
    }
    
    if (day.isToday) {
      return `${day.date.toLocaleDateString()} - Today's challenge available`;
    }
    
    return `${day.date.toLocaleDateString()} - Challenge available`;
  }
}
