import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewGameService, GameDifficulty } from '../../services/new-game.service';
import { ScrollToTopService } from '../../../services/scroll-to-top.service';

@Component({
  standalone: true,
  selector: 'app-controls',
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent {
  @Input() disabled: boolean = false;
  @Input() resetDisabled: boolean = false;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<string>();

  difficulties = [
    { value: 'test', label: 'Test' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' }
  ];

  selectedDifficulty: GameDifficulty = 'test';

  constructor(
    private newGameService: NewGameService,
    private scrollToTopService: ScrollToTopService
  ) {}

  onResetClick() {
    this.resetGame.emit();
  }

  onNewGameClick() {
    // Use NewGameService to start a new game
    this.newGameService.startNewGame({
      difficulty: this.selectedDifficulty,
      clearCurrentGame: true,
      resetTimer: true
    });
    
    // Scroll to top when starting new game
    this.scrollToTopService.scrollToTop();
    
    // Also emit the event for backward compatibility
    this.newGame.emit(this.selectedDifficulty);
  }

  onDifficultyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedDifficulty = target.value as GameDifficulty;
  }
}
