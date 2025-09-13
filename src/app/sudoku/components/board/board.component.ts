import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Box } from '../../models/box.model';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnChanges {
  @Input() boxes: Box[] = [];
  @Input() selectedBoxIndex: number | null = null;
  @Input() selectedCellIndex: number | null = null;
  @Input() currentNumber: number | null = null;
  @Input() selectedNumber: number | null = null; // For number-first mode highlighting
  @Input() disabled: boolean = false;
  @Output() cellSelected = new EventEmitter<{ boxIndex: number, cellIndex: number, isEditable: boolean }>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges() {
    // BoardComponent: boxes input changed
  }

  onCellClick(boxIndex: number, cellIndex: number) {
    // Don't allow cell selection if board is disabled
    if (this.disabled) {
      return;
    }

    const cell = this.boxes[boxIndex].cells[cellIndex];

    // Allow selecting any cell for highlighting, but emit with additional info
    // about whether the cell is editable
    this.cellSelected.emit({
      boxIndex,
      cellIndex,
      isEditable: !cell.isFixed && cell.state !== 'correct'
    });
  }

  /**
   * Determines if a specific cell is currently selected based on its box and cell indices.
   *
   * @param {number} boxIndex - The index of the box containing the cell to check.
   * @param {number} cellIndex - The index of the cell within the box to check.
   * @return {boolean} Returns true if the specified cell is selected, otherwise false.
   */
  isCellSelected(boxIndex: number, cellIndex: number): boolean {
    return this.selectedBoxIndex === boxIndex && this.selectedCellIndex === cellIndex;
  }

  // Check if cell should be highlighted because it contains the selected number
  isNumberHighlighted(boxIndex: number, cellIndex: number): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return false;

    const selectedCell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    if (!selectedCell.value) return false;

    const currentCell = this.boxes[boxIndex].cells[cellIndex];

    // Only highlight if the cell contains the same number as a main value
    // Notes are handled separately with note-level highlighting
    return currentCell.value === selectedCell.value;
  }

  // Check if cell should be highlighted because it contains the current number being entered
  isCurrentNumberHighlighted(boxIndex: number, cellIndex: number): boolean {
    if (this.currentNumber === null) return false;

    const currentCell = this.boxes[boxIndex].cells[cellIndex];

    // Only highlight if the cell contains the current number as a main value
    // Notes are handled separately with note-level highlighting
    return currentCell.value === this.currentNumber;
  }

  // Check if a specific note should be highlighted
  isNoteHighlighted(boxIndex: number, cellIndex: number, noteNumber: number): boolean {
    // Check if this note matches the selected number from number-first mode
    if (this.selectedNumber !== null) {
      return noteNumber === this.selectedNumber;
    }

    // Check if this note matches the current number being entered
    if (this.currentNumber !== null) {
      return noteNumber === this.currentNumber;
    }

    // Check if this note matches the selected cell's value (for highlighting related notes)
    if (this.selectedBoxIndex !== null && this.selectedCellIndex !== null) {
      const selectedCell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
      if (selectedCell.value) {
        return noteNumber === selectedCell.value;
      }
    }

    return false;
  }

  // Check if cell should be highlighted because it's in the same row, column, or box as selected cell
  isRelatedHighlighted(boxIndex: number, cellIndex: number): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return false;

    const selectedBoxRow = Math.floor(this.selectedBoxIndex / 3);
    const selectedBoxCol = this.selectedBoxIndex % 3;
    const selectedCellRow = Math.floor(this.selectedCellIndex / 3);
    const selectedCellCol = this.selectedCellIndex % 3;

    const currentBoxRow = Math.floor(boxIndex / 3);
    const currentBoxCol = boxIndex % 3;
    const currentCellRow = Math.floor(cellIndex / 3);
    const currentCellCol = cellIndex % 3;

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
  
  // Method to force complete re-render
  forceRerender() {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
  
  // Method to completely reset the component
  resetComponent() {
    // Clear the boxes temporarily to force a complete re-render
    const tempBoxes = this.boxes;
    this.boxes = [];
    this.cdr.detectChanges();
    
    // Restore the boxes after a brief delay
    setTimeout(() => {
      this.boxes = tempBoxes;
      this.cdr.detectChanges();
      // BoardComponent reset completed
    }, 10);
  }
  
  // Method to debug what's actually in the DOM
  debugDOMContent() {
    // DOM debug completed
  }

  // Method to check if a note violates Sudoku rules
  isNoteError(boxIndex: number, cellIndex: number, num: number): boolean {
    // Only show error if the note number conflicts with an existing final number
    // Don't preemptively show errors for potential conflicts
    const boxRow = Math.floor(boxIndex / 3);
    const boxCol = boxIndex % 3;
    const cellRow = Math.floor(cellIndex / 3);
    const cellCol = cellIndex % 3;

    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;

    // Check if this number already exists as a final value in the same row, column, or box
    for (let b = 0; b < this.boxes.length; b++) {
      for (let c = 0; c < this.boxes[b].cells.length; c++) {
        const otherBoxRow = Math.floor(b / 3);
        const otherBoxCol = b % 3;
        const otherCellRow = Math.floor(c / 3);
        const otherCellCol = c % 3;

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
