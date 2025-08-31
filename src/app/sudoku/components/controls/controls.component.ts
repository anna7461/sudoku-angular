import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';
import { DifficultyDialogComponent } from '../difficulty-dialog/difficulty-dialog.component';

@Component({
  standalone: true,
  selector: 'app-controls',
  imports: [CommonModule, DifficultyDialogComponent],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent {
  @Input() disabled: boolean = false;
  @Input() resetDisabled: boolean = false;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<GameDifficulty>();

  // Difficulty dialog state
  showDifficultyDialog: boolean = false;

  constructor(
    private newGameService: NewGameService,
    private scrollToTopService: ScrollToTopService
  ) {}

  onResetClick() {
    this.resetGame.emit();
  }

  onNewGameClick() {
    this.showDifficultyDialog = true;
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';
  }

  onDifficultySelected(difficulty: GameDifficulty) {
    this.showDifficultyDialog = false;
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Emit the event for parent components
    this.newGame.emit(difficulty);
  }

  onDifficultyDialogClose() {
    this.showDifficultyDialog = false;
    // Restore body scroll
    document.body.style.overflow = '';
  }
}
