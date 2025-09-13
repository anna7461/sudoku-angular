import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GameDifficulty } from '../../services/new-game.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';
import { DifficultyDialogComponent } from '../difficulty-dialog/difficulty-dialog.component';

export interface CongratulationsStats {
  timeTaken: string;
  difficulty: string;
  mistakeCount: number;
}

@Component({
  selector: 'app-congratulations-dialog',
  standalone: true,
  imports: [CommonModule, DifficultyDialogComponent],
  templateUrl: './congratulations-dialog.component.html',
  styleUrls: ['./congratulations-dialog.component.scss']
})
export class CongratulationsDialogComponent implements OnChanges {
  @Input() isVisible: boolean = false;
  @Input() puzzleStats: CongratulationsStats | null = null;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<GameDifficulty>();
  @Output() close = new EventEmitter<void>();

  // Difficulty dialog state
  showDifficultyDialog: boolean = false;

  constructor(
    private scrollToTopService: ScrollToTopService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Component no longer needs to track difficulty selection
  }

  onResetGame(): void {
    this.resetGame.emit();
  }

  onNewGameClick(): void {
    this.showDifficultyDialog = true;
    // Prevent body scroll when dialog is open (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  onDifficultySelected(difficulty: GameDifficulty): void {
    this.showDifficultyDialog = false;
    // Restore body scroll (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
    
    // Scroll to top when starting new game
    this.scrollToTopService.scrollToTop();
    this.newGame.emit(difficulty);
  }

  onDifficultyDialogClose(): void {
    this.showDifficultyDialog = false;
    // Restore body scroll (browser only)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  // Prevent clicks inside the dialog from closing it
  onDialogClick(event: Event): void {
    event.stopPropagation();
  }
}
