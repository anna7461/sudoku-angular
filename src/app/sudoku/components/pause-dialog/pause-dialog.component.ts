import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PauseService } from '../../services/pause.service';
import { GameResetService } from '../../services/game-reset.service';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';
import { DifficultyDialogComponent } from '../difficulty-dialog/difficulty-dialog.component';

@Component({
  standalone: true,
  selector: 'app-pause-dialog',
  templateUrl: './pause-dialog.component.html',
  styleUrls: ['./pause-dialog.component.scss'],
  imports: [CommonModule, FormsModule, DifficultyDialogComponent]
})
export class PauseDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  message = '';
  
  // Game state information
  currentTime: string = '';
  currentDifficulty: string = '';
  mistakesLimit: number = 3;

  // Difficulty dialog state
  showDifficultyDialog: boolean = false;

  constructor(
    private pauseService: PauseService,
    private gameResetService: GameResetService,
    private newGameService: NewGameService,
    private scrollToTopService: ScrollToTopService
  ) {}

  ngOnInit(): void {
    // Subscribe to pause dialog state changes
    this.pauseService.pauseDialog$.subscribe(dialogData => {
      this.isVisible = dialogData.isVisible;
      this.message = dialogData.message;
      this.currentTime = dialogData.currentTime || '';
      this.currentDifficulty = dialogData.currentDifficulty || '';
      this.mistakesLimit = dialogData.mistakesLimit || 3;
      
      // Prevent body scroll when pause dialog is open
      if (this.isVisible) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnDestroy(): void {
    // Restore body scroll if component is destroyed while dialogs are open
    document.body.style.overflow = '';
  }

  /**
   * Resume the game
   */
  onResume(): void {
    // Restore body scroll
    document.body.style.overflow = '';
    this.pauseService.resumeGame();
  }

  /**
   * Reset the current game
   */
  onResetGame(): void {
    // Restore body scroll
    document.body.style.overflow = '';
    this.gameResetService.resetCurrentGame();
    this.pauseService.resumeGame(); // Close the dialog
  }

  /**
   * Show difficulty selection dialog
   */
  onStartNewGame(): void {
    this.showDifficultyDialog = true;
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Handle difficulty selection
   */
  onDifficultySelected(difficulty: GameDifficulty): void {
    this.showDifficultyDialog = false;
    // Restore body scroll
    document.body.style.overflow = '';
    
    this.newGameService.startNewGame({
      difficulty: difficulty,
      clearCurrentGame: true,
      resetTimer: true
    });
    
    // Scroll to top when starting new game
    this.scrollToTopService.scrollToTop();
    
    // Close the pause dialog and restore body scroll
    document.body.style.overflow = '';
    this.pauseService.resumeGame();
  }

  /**
   * Close difficulty dialog
   */
  onDifficultyDialogClose(): void {
    this.showDifficultyDialog = false;
    // Restore body scroll
    document.body.style.overflow = '';
  }
}
