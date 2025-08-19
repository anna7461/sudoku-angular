import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PauseService } from '../../services/pause.service';
import { GameResetService } from '../../services/game-reset.service';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';

@Component({
  standalone: true,
  selector: 'app-pause-dialog',
  templateUrl: './pause-dialog.component.html',
  styleUrls: ['./pause-dialog.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class PauseDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  message = '';
  selectedDifficulty: GameDifficulty = 'test';
  availableDifficulties: { value: GameDifficulty; label: string }[] = [];

  constructor(
    private pauseService: PauseService,
    private gameResetService: GameResetService,
    private newGameService: NewGameService
  ) {}

  ngOnInit(): void {
    // Subscribe to pause dialog state changes
    this.pauseService.pauseDialog$.subscribe(dialogData => {
      this.isVisible = dialogData.isVisible;
      this.message = dialogData.message;
    });

    // Get available difficulties
    this.availableDifficulties = this.newGameService.getAvailableDifficulties();
  }

  ngOnDestroy(): void {
    // Cleanup handled by async pipe
  }

  /**
   * Resume the game
   */
  onResume(): void {
    this.pauseService.resumeGame();
  }

  /**
   * Reset the current game
   */
  onResetGame(): void {
    this.gameResetService.resetCurrentGame();
    this.pauseService.resumeGame(); // Close the dialog
  }

  /**
   * Start a new game with selected difficulty
   */
  onStartNewGame(): void {
    this.newGameService.startSingleGame(this.selectedDifficulty);
    this.pauseService.resumeGame(); // Close the dialog
  }

  /**
   * Handle difficulty selection change
   */
  onDifficultyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedDifficulty = select.value as GameDifficulty;
  }
}
