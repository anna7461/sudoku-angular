import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Box } from '../../models/box.model';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent {
  @Input() boxes: Box[] = [];
  @Input() selectedBoxIndex: number | null = null;
  @Input() selectedCellIndex: number | null = null;
  @Output() cellSelected = new EventEmitter<{ boxIndex: number, cellIndex: number }>();

  constructor(private cdr: ChangeDetectorRef) {}

  onCellClick(boxIndex: number, cellIndex: number) {
    const cell = this.boxes[boxIndex].cells[cellIndex];
    
    // Only allow selecting cells that can be edited
    if (!cell.isFixed && cell.state !== 'correct') {
      this.cellSelected.emit({ boxIndex, cellIndex });
    }
  }

  isCellSelected(boxIndex: number, cellIndex: number): boolean {
    return this.selectedBoxIndex === boxIndex && this.selectedCellIndex === cellIndex;
  }

  // Method to force change detection
  detectChanges() {
    this.cdr.detectChanges();
  }
}
