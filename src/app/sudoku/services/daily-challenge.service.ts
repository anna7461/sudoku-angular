import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD format
  isCompleted: boolean;
  difficulty: string;
  completionTime?: number;
  score?: number;
  mistakes?: number;
}

export interface CountdownTimer {
  hours: number;
  minutes: number;
  seconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class DailyChallengeService {
  private readonly DAILY_CHALLENGE_KEY = 'sudoku-daily-challenges';
  private readonly DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
  
  private challengesSubject = new BehaviorSubject<Map<string, DailyChallengeState>>(new Map());
  public challenges$: Observable<Map<string, DailyChallengeState>> = this.challengesSubject.asObservable();
  
  private countdownSubject = new BehaviorSubject<CountdownTimer>({ hours: 0, minutes: 0, seconds: 0 });
  public countdown$: Observable<CountdownTimer> = this.countdownSubject.asObservable();

  private countdownInterval?: any;
  private isInitialized = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Defer initialization to avoid issues during service construction
    if (isPlatformBrowser(this.platformId) && !this.isInitialized) {
      // Use setTimeout to defer initialization
      setTimeout(() => {
        if (!this.isInitialized) {
          this.loadChallenges();
          this.startCountdown();
          this.isInitialized = true;
        }
      }, 0);
    }
  }

  /**
   * Manually initialize the service if not already initialized
   */
  public initialize(): void {
    if (isPlatformBrowser(this.platformId) && !this.isInitialized) {
      this.loadChallenges();
      this.startCountdown();
      this.isInitialized = true;
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDate(): string {
    try {
      const today = new Date();
      return today.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error getting today date:', error);
      // Return a fallback date
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Get a random difficulty level
   */
  getRandomDifficulty(): string {
    try {
      const randomIndex = Math.floor(Math.random() * this.DIFFICULTIES.length);
      return this.DIFFICULTIES[randomIndex];
    } catch (error) {
      console.warn('Error getting random difficulty:', error);
      return 'medium'; // Default fallback
    }
  }

  /**
   * Check if today's challenge is completed
   */
  isTodayCompleted(): boolean {
    try {
      const today = this.getTodayDate();
      const challenges = this.challengesSubject.value;
      return challenges.has(today) && challenges.get(today)!.isCompleted;
    } catch (error) {
      console.warn('Error checking if today is completed:', error);
      return false;
    }
  }

  /**
   * Check if today's challenge should show puzzle or results view
   */
  shouldShowPuzzleView(): boolean {
    return !this.isTodayCompleted();
  }

  /**
   * Get today's challenge state
   */
  getTodayChallenge(): DailyChallengeState | null {
    try {
      const today = this.getTodayDate();
      const challenges = this.challengesSubject.value;
      return challenges.get(today) || null;
    } catch (error) {
      console.warn('Error getting today challenge:', error);
      return null;
    }
  }

  /**
   * Get challenge state for a specific date
   */
  getChallengeForDate(date: string): DailyChallengeState | null {
    try {
      const challenges = this.challengesSubject.value;
      return challenges.get(date) || null;
    } catch (error) {
      console.warn('Error getting challenge for date:', error);
      return null;
    }
  }

  /**
   * Get all completed challenges for display
   */
  getCompletedChallenges(): DailyChallengeState[] {
    try {
      const challenges = this.challengesSubject.value;
      return Array.from(challenges.values())
        .filter(challenge => challenge.isCompleted)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('Error getting completed challenges:', error);
      return [];
    }
  }

  /**
   * Get current streak count
   */
  getCurrentStreak(): number {
    try {
      const challenges = this.challengesSubject.value;
      const today = this.getTodayDate();
      let streak = 0;
      let currentDate = new Date(today);
      
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const challenge = challenges.get(dateStr);
        
        if (challenge && challenge.isCompleted) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.warn('Error calculating streak:', error);
      return 0;
    }
  }

  /**
   * Start today's challenge
   */
  startTodayChallenge(): { difficulty: string; isNew: boolean } {
    try {
      const today = this.getTodayDate();
      const challenges = this.challengesSubject.value;
      
      if (challenges.has(today)) {
        // Challenge already exists, return existing difficulty
        const existing = challenges.get(today)!;
        return { difficulty: existing.difficulty, isNew: false };
      } else {
        // Create new challenge with random difficulty
        const difficulty = this.getRandomDifficulty();
        const newChallenge: DailyChallengeState = {
          date: today,
          isCompleted: false,
          difficulty: difficulty
        };
        
        challenges.set(today, newChallenge);
        this.saveChallenges(challenges);
        this.challengesSubject.next(challenges);
        
        return { difficulty: difficulty, isNew: true };
      }
    } catch (error) {
      console.warn('Error starting today challenge:', error);
      // Return a default difficulty on error
      return { difficulty: 'medium', isNew: true };
    }
  }

  /**
   * Complete today's challenge
   */
  completeTodayChallenge(completionTime: number, score: number, mistakes: number): void {
    const today = this.getTodayDate();
    const challenges = this.challengesSubject.value;
    
    if (challenges.has(today)) {
      const challenge = challenges.get(today)!;
      challenge.isCompleted = true;
      challenge.completionTime = completionTime;
      challenge.score = score;
      challenge.mistakes = mistakes;
      
      this.saveChallenges(challenges);
      this.challengesSubject.next(challenges);
    }
  }

  /**
   * Get countdown until next daily challenge
   */
  getCountdownUntilNext(): CountdownTimer {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilMidnight % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }

  /**
   * Check if a date is available to play (today or past days)
   */
  isDateAvailable(date: string): boolean {
    const today = this.getTodayDate();
    return date <= today;
  }

  /**
   * Get all challenges for the current month
   */
  getCurrentMonthChallenges(): Map<string, DailyChallengeState> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const challenges = this.challengesSubject.value;
    const monthChallenges = new Map<string, DailyChallengeState>();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (challenges.has(dateStr)) {
        monthChallenges.set(dateStr, challenges.get(dateStr)!);
      }
    }
    
    return monthChallenges;
  }

  /**
   * Start the countdown timer
   */
  private startCountdown(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Update countdown every second
        this.countdownInterval = interval(1000).pipe(
          startWith(0)
        ).subscribe(() => {
          try {
            const countdown = this.getCountdownUntilNext();
            this.countdownSubject.next(countdown);
          } catch (error) {
            console.warn('Error updating countdown:', error);
          }
        });
      } catch (error) {
        console.warn('Failed to start countdown timer:', error);
      }
    }
  }

  /**
   * Load challenges from localStorage
   */
  private loadChallenges(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(this.DAILY_CHALLENGE_KEY);
        if (saved) {
          const challengesArray = JSON.parse(saved);
          const challengesMap = new Map<string, DailyChallengeState>();
          
          challengesArray.forEach((challenge: DailyChallengeState) => {
            challengesMap.set(challenge.date, challenge);
          });
          
          this.challengesSubject.next(challengesMap);
        }
      } catch (error) {
        console.warn('Failed to load daily challenges:', error);
        // Initialize with empty map on error
        this.challengesSubject.next(new Map());
      }
    }
  }

  /**
   * Save challenges to localStorage
   */
  private saveChallenges(challenges: Map<string, DailyChallengeState>): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const challengesArray = Array.from(challenges.values());
        localStorage.setItem(this.DAILY_CHALLENGE_KEY, JSON.stringify(challengesArray));
      } catch (error) {
        console.warn('Failed to save daily challenges:', error);
      }
    }
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
    }
  }
}
