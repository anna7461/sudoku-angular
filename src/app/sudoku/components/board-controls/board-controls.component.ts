import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-board-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-controls.component.html',
  styleUrls: ['./board-controls.component.scss']
})
export class BoardControlsComponent {
  // Input properties for board controls
  @Input() notesMode: boolean = false;
  @Input() numberFirstMode: boolean = false;
  @Input() canUndo: boolean = false;
  @Input() disabled: boolean = false;

  // Output events for user actions
  @Output() undo = new EventEmitter<void>();
  @Output() resetNotes = new EventEmitter<void>();
  @Output() toggleNotesMode = new EventEmitter<void>();
  @Output() toggleNumberFirstMode = new EventEmitter<void>();
  @Output() hint = new EventEmitter<void>();

  onUndoClick() {
    this.undo.emit();
  }

  onResetNotesClick() {
    this.resetNotes.emit();
  }

  onToggleNotesClick() {
    this.toggleNotesMode.emit();
  }

  onToggleNumberFirstClick() {
    this.toggleNumberFirstMode.emit();
  }

  onHintClick() {
    this.hint.emit();
  }
}
