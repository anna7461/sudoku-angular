import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-controls',
  imports: [],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.scss'
})
export class ControlsComponent {
  @Output() resetGame = new EventEmitter<void>();

  onResetClick() {
    this.resetGame.emit();
  }
}
