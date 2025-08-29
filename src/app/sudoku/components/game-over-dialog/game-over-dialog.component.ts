import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameDifficulty } from '../../services/new-game.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';

export interface GameOverStats {
  mistakeCount: number;
  finalTime: string;
  finalScore: number;
  difficulty: string;
}

@Component({
  selector: 'app-game-over-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-over-dialog.component.html',
  styleUrls: ['./game-over-dialog.component.scss']
})
export class GameOverDialogComponent implements OnChanges, OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() gameStats: GameOverStats | null = null;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<GameDifficulty>();
  @Output() close = new EventEmitter<void>();

  selectedDifficulty: GameDifficulty = 'easy';
  private escapeKeyHandler: (event: KeyboardEvent) => void;

  constructor(private scrollToTopService: ScrollToTopService) {
    // Create the escape key handler
    this.escapeKeyHandler = (event: KeyboardEvent) => {
      if (this.isVisible && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        // Do nothing - prevent dialog from closing
      }
    };
  }

  ngOnInit(): void {
    // Add event listener for escape key
    document.addEventListener('keydown', this.escapeKeyHandler);
  }

  ngOnDestroy(): void {
    // Remove event listener
    document.removeEventListener('keydown', this.escapeKeyHandler);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Pre-fill difficulty selection with current game's difficulty
    if (changes['gameStats'] && this.gameStats?.difficulty) {
      const difficulty = this.gameStats.difficulty.toLowerCase() as GameDifficulty;
      if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard' || difficulty === 'expert') {
        this.selectedDifficulty = difficulty;
      }
    }
  }

  onResetGame(): void {
    this.resetGame.emit();
  }

  onNewGame(): void {
    // Scroll to top when starting new game
    this.scrollToTopService.scrollToTop();
    this.newGame.emit(this.selectedDifficulty);
  }

  onClose(): void {
    this.close.emit();
  }

  onDifficultyChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDifficulty = target.value as GameDifficulty;
  }

  // Prevent clicks inside the dialog from closing it
  onDialogClick(event: Event): void {
    event.stopPropagation();
  }
}
