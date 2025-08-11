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
  @Input() currentNumber: number | null = null;
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

  // Check if cell should be highlighted because it contains the selected number
  isNumberHighlighted(boxIndex: number, cellIndex: number): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return false;
    
    const selectedCell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    if (!selectedCell.value) return false;
    
    const currentCell = this.boxes[boxIndex].cells[cellIndex];
    
    // Highlight if the cell contains the same number (either as main value or in notes)
    return (currentCell.value === selectedCell.value) || 
           (currentCell.notes && currentCell.notes.includes(selectedCell.value));
  }

  // Check if cell should be highlighted because it contains the current number being entered
  isCurrentNumberHighlighted(boxIndex: number, cellIndex: number): boolean {
    if (this.currentNumber === null) return false;
    
    const currentCell = this.boxes[boxIndex].cells[cellIndex];
    
    // Highlight if the cell contains the current number being entered
    return (currentCell.value === this.currentNumber) || 
           (currentCell.notes && currentCell.notes.includes(this.currentNumber));
  }

  // Check if cell should be highlighted because it's in the same row, column, or box as selected cell
  isRelatedHighlighted(boxIndex: number, cellIndex: number): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return false;
    
    const selectedBoxRow = Math.floor(this.selectedBoxIndex / 3);
    const selectedBoxCol = this.selectedBoxIndex % 3;
    const selectedCellRow = Math.floor(this.selectedCellIndex / 3);
    const selectedCellCol = Math.floor(this.selectedCellIndex % 3);
    
    const currentBoxRow = Math.floor(boxIndex / 3);
    const currentBoxCol = boxIndex % 3;
    const currentCellRow = Math.floor(cellIndex / 3);
    const currentCellCol = Math.floor(cellIndex % 3);
    
    // Calculate global row and column positions
    const selectedGlobalRow = selectedBoxRow * 3 + selectedCellRow;
    const selectedGlobalCol = selectedBoxCol * 3 + selectedCellCol;
    const currentGlobalRow = currentBoxRow * 3 + currentCellRow;
    const currentGlobalCol = currentBoxCol * 3 + currentCellCol;
    
    // Highlight if in same row, column, or box
    return (currentGlobalRow === selectedGlobalRow) || 
           (currentGlobalCol === selectedGlobalCol) || 
           (boxIndex === this.selectedBoxIndex);
  }

  // Method to force change detection
  detectChanges() {
    this.cdr.detectChanges();
  }

  // Method to check if a note violates Sudoku rules
  isNoteError(boxIndex: number, cellIndex: number, num: number): boolean {
    // Only show error if the note number conflicts with an existing final number
    // Don't preemptively show errors for potential conflicts
    const boxRow = Math.floor(boxIndex / 3);
    const boxCol = boxIndex % 3;
    const cellRow = Math.floor(cellIndex / 3);
    const cellCol = Math.floor(cellIndex % 3);
    
    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;
    
    // Check if this number already exists as a final value in the same row, column, or box
    for (let b = 0; b < this.boxes.length; b++) {
      for (let c = 0; c < this.boxes[b].cells.length; c++) {
        const otherBoxRow = Math.floor(b / 3);
        const otherBoxCol = b % 3;
        const otherCellRow = Math.floor(c / 3);
        const otherCellCol = Math.floor(c / 3);
        
        const otherGlobalRow = otherBoxRow * 3 + otherCellRow;
        const otherGlobalCol = otherBoxCol * 3 + otherCellCol;
        
        // Skip the current cell
        if (otherGlobalRow === globalRow && otherGlobalCol === globalCol) continue;
        
        // Check if in same row, column, or box
        if (otherGlobalRow === globalRow || 
            otherGlobalCol === globalCol || 
            b === boxIndex) {
          const otherCell = this.boxes[b].cells[c];
          // Only check against final numbers (not other notes)
          if (otherCell.value === num && otherCell.value !== null) {
            return true; // Note conflicts with existing final number
          }
        }
      }
    }
    
    return false;
  }
}
