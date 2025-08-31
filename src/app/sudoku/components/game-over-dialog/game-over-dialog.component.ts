import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameDifficulty } from '../../services/new-game.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';
import { DifficultyDialogComponent } from '../difficulty-dialog/difficulty-dialog.component';

export interface GameOverStats {
  mistakeCount: number;
  finalTime: string;
  finalScore: number;
  difficulty: string;
}

@Component({
  selector: 'app-game-over-dialog',
  standalone: true,
  imports: [CommonModule, DifficultyDialogComponent],
  templateUrl: './game-over-dialog.component.html',
  styleUrls: ['./game-over-dialog.component.scss']
})
export class GameOverDialogComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() gameStats: GameOverStats | null = null;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<GameDifficulty>();
  @Output() close = new EventEmitter<void>();
  
  // Difficulty dialog state
  showDifficultyDialog: boolean = false;
  
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
    // Restore body scroll if component is destroyed while dialog is open
    document.body.style.overflow = '';
  }

  onResetGame(): void {
    this.resetGame.emit();
  }

  onNewGameClick(): void {
    this.showDifficultyDialog = true;
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';
  }

  onDifficultySelected(difficulty: GameDifficulty): void {
    this.showDifficultyDialog = false;
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Scroll to top when starting new game
    this.scrollToTopService.scrollToTop();
    this.newGame.emit(difficulty);
  }

  onDifficultyDialogClose(): void {
    this.showDifficultyDialog = false;
    // Restore body scroll
    document.body.style.overflow = '';
  }

  onClose(): void {
    this.close.emit();
  }

  // Prevent clicks inside the dialog from closing it
  onDialogClick(event: Event): void {
    event.stopPropagation();
  }
}
