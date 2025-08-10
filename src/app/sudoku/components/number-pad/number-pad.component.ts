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
  @Output() numberClick = new EventEmitter<number>();

  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  onNumberClick(num: number) {
    if (!this.disabled) {
      this.numberClick.emit(num);
    }
  }
}
