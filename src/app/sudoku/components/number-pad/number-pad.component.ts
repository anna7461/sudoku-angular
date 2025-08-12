import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-number-pad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './number-pad.component.html',
  styleUrls: ['./number-pad.component.scss']
})
export class NumberPadComponent {
  @Input() disabled: boolean = false;
  @Input() currentNumber: number | null = null;
  @Input() selectedNumber: number | null = null; // For number-first mode
  @Input() numberFirstMode: boolean = false;
  @Input() remainingCounts: { [key: number]: number } = {};
  @Output() numberClick = new EventEmitter<number>();

  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  onNumberClick(num: number) {
    if (!this.disabled && !this.isNumberCompleted(num)) {
      this.numberClick.emit(num);
    }
  }

  isNumberSelected(num: number): boolean {
    if (this.numberFirstMode) {
      return this.selectedNumber === num;
    }
    return this.currentNumber === num;
  }

  isNumberCompleted(num: number): boolean {
    return this.remainingCounts[num] === 0;
  }

  getRemainingCount(num: number): number {
    return this.remainingCounts[num] || 0;
  }
}
