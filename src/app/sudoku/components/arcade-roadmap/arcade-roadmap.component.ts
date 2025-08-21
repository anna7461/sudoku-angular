import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ArcadeLevel } from '../../models/game-modes';
import { ArcadeService } from '../../services/arcade.service';
import { NewGameService } from '../../services/new-game.service';
import { GameStateService } from '../../services/game-state.service';
import { GameMode } from '../../models/game-modes';

@Component({
  standalone: true,
  selector: 'app-arcade-roadmap',
  templateUrl: './arcade-roadmap.component.html',
  styleUrls: ['./arcade-roadmap.component.scss'],
  imports: [CommonModule]
})
export class ArcadeRoadmapComponent implements OnInit, OnDestroy {
  @Output() closeRoadmap = new EventEmitter<void>();
  
  levels: ArcadeLevel[] = [];
  totalStars = 0;
  completedLevels = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private arcadeService: ArcadeService,
    private newGameService: NewGameService,
    private gameStateService: GameStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to levels and progress updates
    this.arcadeService.levels$
      .pipe(takeUntil(this.destroy$))
      .subscribe(levels => {
        this.levels = levels;
        this.updateStats();
      });

    this.arcadeService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.totalStars = progress.totalStars;
        this.completedLevels = progress.completedLevels.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Start a level
   */
  startLevel(level: ArcadeLevel): void {
    if (!level.isUnlocked) return;
    
    // Set arcade mode and start the game
    this.gameStateService.setCurrentMode(GameMode.ARCADE_MODE);
    this.newGameService.startArcadeGame(level.difficulty as any, level.id);
    
    // Navigate to the game
    this.router.navigate(['/sudoku']);
  }

  /**
   * Get difficulty icon
   */
  getDifficultyIcon(difficulty: string): string {
    const icons: { [key: string]: string } = {
      'easy': '😊',
      'medium': '🤔',
      'hard': '😰',
      'expert': '😱'
    };
    return icons[difficulty] || '❓';
  }

  /**
   * Get difficulty color class
   */
  getDifficultyColor(difficulty: string): string {
    return `difficulty-${difficulty}`;
  }

  /**
   * Get star display for completed levels
   */
  getStarDisplay(level: ArcadeLevel): string {
    if (!level.isCompleted || !level.stars) return '';
    
    const stars = '⭐'.repeat(level.stars);
    return stars;
  }

  /**
   * Get best time display
   */
  getBestTimeDisplay(level: ArcadeLevel): string {
    if (!level.bestTime) return '';
    
    const minutes = Math.floor(level.bestTime / 60000);
    const seconds = Math.floor((level.bestTime % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if level can be played
   */
  canPlayLevel(level: ArcadeLevel): boolean {
    return level.isUnlocked && !level.isCompleted;
  }

  /**
   * Get level status class
   */
  getLevelStatusClass(level: ArcadeLevel): string {
    if (level.isCompleted) return 'completed';
    if (level.isUnlocked) return 'unlocked';
    return 'locked';
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.completedLevels = this.levels.filter(level => level.isCompleted).length;
    this.totalStars = this.levels.reduce((total, level) => total + (level.stars || 0), 0);
  }

  /**
   * Track by function for ngFor
   */
  trackByLevelId(index: number, level: ArcadeLevel): number {
    return level.id;
  }

  /**
   * Close the roadmap and return to dashboard
   */
  onCloseRoadmap(): void {
    this.closeRoadmap.emit();
  }
}
