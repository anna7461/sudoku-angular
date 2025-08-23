import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { ArcadeLevel } from '../models/game-modes';
import { StorageService } from './storage.service';

export interface ArcadeProgress {
  completedLevels: number[];
  unlockedLevels: number[];
  bestTimes: { [levelId: number]: number };
  totalStars: number;
}

@Injectable({
  providedIn: 'root'
})
export class ArcadeService {
  private readonly STORAGE_KEY = 'sudoku_arcade_progress';
  private readonly MAX_LEVELS = 20; // 4 sets of 5 levels
  
  private progressSubject = new BehaviorSubject<ArcadeProgress>(this.getDefaultProgress());
  public progress$ = this.progressSubject.asObservable();
  
  private levelsSubject = new BehaviorSubject<ArcadeLevel[]>(this.generateLevels());
  public levels$ = this.levelsSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private storageService: StorageService
  ) {
    this.loadProgress();
  }

  /**
   * Get all arcade levels
   */
  getLevels(): ArcadeLevel[] {
    return this.levelsSubject.value;
  }

  /**
   * Get a specific level by ID
   */
  getLevel(levelId: number): ArcadeLevel | undefined {
    return this.levelsSubject.value.find(level => level.id === levelId);
  }

  /**
   * Get the next available level
   */
  getNextAvailableLevel(): ArcadeLevel | null {
    const levels = this.levelsSubject.value;
    return levels.find(level => level.isUnlocked && !level.isCompleted) || null;
  }

  /**
   * Check if a level is unlocked
   */
  isLevelUnlocked(levelId: number): boolean {
    const level = this.getLevel(levelId);
    return level ? level.isUnlocked : false;
  }

  /**
   * Check if a level is completed
   */
  isLevelCompleted(levelId: number): boolean {
    const level = this.getLevel(levelId);
    return level ? level.isCompleted : false;
  }

  /**
   * Complete a level and unlock the next one
   */
  completeLevel(levelId: number, completionTime: number): void {
    const levels = this.levelsSubject.value;
    const levelIndex = levels.findIndex(level => level.id === levelId);
    
    if (levelIndex === -1) return;
    
    // Mark level as completed
    levels[levelIndex].isCompleted = true;
    
    // Update best time if better
    const currentBest = levels[levelIndex].bestTime;
    if (!currentBest || completionTime < currentBest) {
      levels[levelIndex].bestTime = completionTime;
    }
    
    // Award stars based on performance (1-3 stars)
    const difficulty = levels[levelIndex].difficulty;
    const timeThresholds = this.getTimeThresholds(difficulty);
    let stars = 1;
    if (completionTime <= timeThresholds.threeStars) stars = 3;
    else if (completionTime <= timeThresholds.twoStars) stars = 2;
    levels[levelIndex].stars = stars;
    
    // Unlock next level if it exists
    if (levelId < this.MAX_LEVELS) {
      const nextLevelIndex = levels.findIndex(level => level.id === levelId + 1);
      if (nextLevelIndex !== -1) {
        levels[nextLevelIndex].isUnlocked = true;
      }
    }
    
    // Update progress
    this.updateProgress(levels);
    
    // Emit updated levels
    this.levelsSubject.next([...levels]);
  }

  /**
   * Get the current level being played
   */
  getCurrentLevel(): ArcadeLevel | null {
    return this.levelsSubject.value.find(level => level.isUnlocked && !level.isCompleted) || null;
  }

  /**
   * Check if there are more levels to complete
   */
  hasMoreLevels(): boolean {
    return this.levelsSubject.value.some(level => !level.isCompleted);
  }

  /**
   * Reset arcade progress
   */
  resetProgress(): void {
    const levels = this.generateLevels();
    this.levelsSubject.next(levels);
    this.updateProgress(levels);
    
    // Clear any saved game state for arcade mode
    console.log('Arcade progress reset to Level 1');
  }

  /**
   * Get difficulty for a specific level
   */
  getLevelDifficulty(levelId: number): string {
    if (levelId <= 5) return 'easy';
    if (levelId <= 10) return 'medium';
    if (levelId <= 15) return 'hard';
    return 'expert';
  }

  /**
   * Get time thresholds for star rating
   */
  private getTimeThresholds(difficulty: string): { threeStars: number; twoStars: number } {
    const thresholds = {
      'easy': { threeStars: 300000, twoStars: 600000 }, // 5 min, 10 min
      'medium': { threeStars: 600000, twoStars: 1200000 }, // 10 min, 20 min
      'hard': { threeStars: 900000, twoStars: 1800000 }, // 15 min, 30 min
      'expert': { threeStars: 1200000, twoStars: 2400000 } // 20 min, 40 min
    };
    return thresholds[difficulty as keyof typeof thresholds] || thresholds.medium;
  }

  /**
   * Generate all arcade levels
   */
  private generateLevels(): ArcadeLevel[] {
    const levels: ArcadeLevel[] = [];
    
    for (let i = 1; i <= this.MAX_LEVELS; i++) {
      const difficulty = this.getLevelDifficulty(i);
      levels.push({
        id: i,
        name: `Level ${i}`,
        difficulty,
        isUnlocked: i === 1, // Only first level is unlocked initially
        isCompleted: false,
        bestTime: undefined,
        stars: undefined
      });
    }
    
    return levels;
  }

  /**
   * Get default progress
   */
  private getDefaultProgress(): ArcadeProgress {
    return {
      completedLevels: [],
      unlockedLevels: [1],
      bestTimes: {},
      totalStars: 0
    };
  }

  /**
   * Load progress from storage
   */
  private loadProgress(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const progress: ArcadeProgress = JSON.parse(stored);
        this.progressSubject.next(progress);
        this.applyProgressToLevels(progress);
      }
    } catch (error) {
      console.error('Error loading arcade progress:', error);
    }
  }

  /**
   * Save progress to storage
   */
  private saveProgress(progress: ArcadeProgress): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving arcade progress:', error);
    }
  }

  /**
   * Apply stored progress to levels
   */
  private applyProgressToLevels(progress: ArcadeProgress): void {
    const levels = this.levelsSubject.value;
    
    // Apply completed levels
    progress.completedLevels.forEach(levelId => {
      const level = levels.find(l => l.id === levelId);
      if (level) {
        level.isCompleted = true;
        level.bestTime = progress.bestTimes[levelId];
      }
    });
    
    // Apply unlocked levels
    progress.unlockedLevels.forEach(levelId => {
      const level = levels.find(l => l.id === levelId);
      if (level) {
        level.isUnlocked = true;
      }
    });
    
    this.levelsSubject.next([...levels]);
  }

  /**
   * Update progress based on current levels state
   */
  private updateProgress(levels: ArcadeLevel[]): void {
    const completedLevels = levels.filter(l => l.isCompleted).map(l => l.id);
    const unlockedLevels = levels.filter(l => l.isUnlocked).map(l => l.id);
    const bestTimes: { [levelId: number]: number } = {};
    let totalStars = 0;
    
    levels.forEach(level => {
      if (level.bestTime) {
        bestTimes[level.id] = level.bestTime;
      }
      if (level.stars) {
        totalStars += level.stars;
      }
    });
    
    const progress: ArcadeProgress = {
      completedLevels,
      unlockedLevels,
      bestTimes,
      totalStars
    };
    
    this.progressSubject.next(progress);
    this.saveProgress(progress);
  }
}
