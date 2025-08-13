import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-controls',
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent {
  @Input() numberFirstMode: boolean = false;
  @Input() disabled: boolean = false;
  @Output() resetGame = new EventEmitter<void>();
  @Output() newGame = new EventEmitter<string>();
  @Output() toggleNumberFirstMode = new EventEmitter<void>();

  difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' }
  ];

  selectedDifficulty: string = 'medium';

  onResetClick() {
    this.resetGame.emit();
  }

  onNewGameClick() {
    this.newGame.emit(this.selectedDifficulty);
  }

  onDifficultyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedDifficulty = target.value as 'easy' | 'medium' | 'hard' | 'expert';
  }

  onToggleNumberFirstClick() {
    this.toggleNumberFirstMode.emit();
  }
}
