import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameDifficulty } from '../../services/new-game.service';

@Component({
  selector: 'app-difficulty-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './difficulty-dialog.component.html',
  styleUrls: ['./difficulty-dialog.component.scss']
})
export class DifficultyDialogComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() difficultySelected = new EventEmitter<GameDifficulty>();
  @Output() close = new EventEmitter<void>();

  selectedDifficulty: GameDifficulty = 'medium';
  availableDifficulties: { value: GameDifficulty; label: string; icon: string; description: string }[] = [];

  ngOnInit(): void {
    this.availableDifficulties = [
      { value: 'test', label: 'Test', icon: '🧪', description: 'Quick puzzle for testing' },
      { value: 'easy', label: 'Easy', icon: '😊', description: 'Perfect for beginners' },
      { value: 'medium', label: 'Medium', icon: '🤔', description: 'Balanced challenge' },
      { value: 'hard', label: 'Hard', icon: '😰', description: 'For experienced players' },
      { value: 'expert', label: 'Expert', icon: '😱', description: 'Ultimate challenge' }
    ];
  }

  onDifficultySelect(difficulty: GameDifficulty): void {
    this.selectedDifficulty = difficulty;
    this.difficultySelected.emit(difficulty);
  }

  onClose(): void {
    this.close.emit();
  }
}
