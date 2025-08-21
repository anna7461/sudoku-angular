import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameDifficulty } from '../../services/new-game.service';
import { GameMode } from '../../models/game-modes';

export interface CongratulationsStats {
  timeTaken: string;
  difficulty: string;
  mistakeCount: number;
  gameMode?: GameMode;
  arcadeLevel?: number;
}

@Component({
  selector: 'app-congratulations-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './congratulations-dialog.component.html',
  styleUrls: ['./congratulations-dialog.component.scss']
})
export class CongratulationsDialogComponent implements OnChanges {
  @Input() isVisible: boolean = false;
  @Input() puzzleStats: CongratulationsStats | null = null;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<GameDifficulty>();
  @Output() close = new EventEmitter<void>();
  @Output() continueArcade = new EventEmitter<void>();

  selectedDifficulty: GameDifficulty = 'easy';

  ngOnChanges(changes: SimpleChanges): void {
    // Pre-fill difficulty selection with current puzzle's difficulty
    if (changes['puzzleStats'] && this.puzzleStats?.difficulty) {
      const difficulty = this.puzzleStats.difficulty.toLowerCase() as GameDifficulty;
      if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard' || difficulty === 'expert') {
        this.selectedDifficulty = difficulty;
      }
    }
  }

  onResetGame(): void {
    this.resetGame.emit();
  }

  onNewGame(): void {
    this.newGame.emit(this.selectedDifficulty);
  }

  onClose(): void {
    this.close.emit();
  }

  onContinueArcade(): void {
    this.continueArcade.emit();
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
