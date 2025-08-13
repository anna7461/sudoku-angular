import { Component, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
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
  @Output() toggleNumberFirstMode = new EventEmitter<{ number: number | null }>();

  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor(private cdr: ChangeDetectorRef) {}

  // Press-and-hold state tracking
  private pressTimers: { [key: number]: any } = {};
  private pressHoldTriggered: { [key: number]: boolean } = {};
  public isBeingHeld: { [key: number]: boolean } = {}; // Public for template access
  private readonly PRESS_HOLD_DURATION = 2000; // 2 seconds as required

  onNumberClick(num: number) {
    // Don't emit click if it was a long press
    if (this.pressHoldTriggered[num]) {
      this.pressHoldTriggered[num] = false;
      return;
    }
    
    if (!this.disabled && !this.isNumberCompleted(num)) {
      console.log(`Regular click on number ${num}`);
      this.numberClick.emit(num);
    }
  }

  // Mouse event handlers for desktop
  onMouseDown(num: number, event: MouseEvent) {
    if (this.disabled || this.isNumberCompleted(num)) {
      return;
    }

    console.log(`Mouse down on number ${num}`);

    // Clear any existing timer for this number
    this.clearPressTimer(num);
    this.pressHoldTriggered[num] = false;
    this.isBeingHeld[num] = true; // Set visual feedback

    // Start new timer for press-and-hold detection
    this.pressTimers[num] = setTimeout(() => {
      console.log(`Press-and-hold triggered for number ${num}`);
      this.pressHoldTriggered[num] = true;
      this.isBeingHeld[num] = false; // Remove visual feedback
      this.onPressHold(num);
    }, this.PRESS_HOLD_DURATION);
  }

  onMouseUp(num: number, event: MouseEvent) {
    if (this.disabled || this.isNumberCompleted(num)) {
      return;
    }

    console.log(`Mouse up on number ${num}`);

    // Clear visual feedback
    this.isBeingHeld[num] = false;

    // Clear the timer if it's still running
    if (this.pressTimers[num]) {
      clearTimeout(this.pressTimers[num]);
      delete this.pressTimers[num];
      console.log(`Timer cleared for number ${num} - will trigger normal click`);
    }
  }

  onMouseLeave(num: number) {
    console.log(`Mouse leave on number ${num}`);
    // Clear timer and visual feedback if mouse leaves the button area
    this.isBeingHeld[num] = false;
    this.clearPressTimer(num);
  }

  // Touch event handlers for mobile
  onTouchStart(num: number, event: TouchEvent) {
    if (this.disabled || this.isNumberCompleted(num)) {
      return;
    }

    console.log(`Touch start on number ${num}`);
    
    // Prevent default to avoid conflicts with mouse events
    event.preventDefault();

    // Clear any existing timer for this number
    this.clearPressTimer(num);
    this.pressHoldTriggered[num] = false;
    this.isBeingHeld[num] = true; // Set visual feedback

    // Start new timer for press-and-hold detection
    this.pressTimers[num] = setTimeout(() => {
      console.log(`Touch press-and-hold triggered for number ${num}`);
      this.pressHoldTriggered[num] = true;
      this.isBeingHeld[num] = false; // Remove visual feedback
      this.onPressHold(num);
    }, this.PRESS_HOLD_DURATION);
  }

  onTouchEnd(num: number, event: TouchEvent) {
    if (this.disabled || this.isNumberCompleted(num)) {
      return;
    }

    console.log(`Touch end on number ${num}`);
    
    // Prevent default to avoid triggering mouse events
    event.preventDefault();

    // Clear visual feedback
    this.isBeingHeld[num] = false;

    // Clear the timer if it's still running
    if (this.pressTimers[num]) {
      clearTimeout(this.pressTimers[num]);
      delete this.pressTimers[num];
      console.log(`Touch timer cleared for number ${num} - will trigger normal click`);
      
      // Manually trigger click for touch since we prevent default
      this.onNumberClick(num);
    }
  }

  onTouchCancel(num: number) {
    console.log(`Touch cancel on number ${num}`);
    // Clear timer and visual feedback if touch is cancelled
    this.isBeingHeld[num] = false;
    this.clearPressTimer(num);
  }

  private onPressHold(num: number) {
    // Clear the timer since it has fired
    delete this.pressTimers[num];

    console.log(`Press-and-hold complete for number ${num}. Current numberFirstMode: ${this.numberFirstMode}`);
    console.log('About to emit toggleNumberFirstMode event...');

    // Emit toggle event with the appropriate number based on current mode
    if (this.numberFirstMode) {
      // If number-first mode is on, turn it off
      console.log('Turning OFF Number-First Mode');
      this.toggleNumberFirstMode.emit({ number: null });
    } else {
      // If number-first mode is off, turn it on and set the held number as selected
      console.log(`Turning ON Number-First Mode with number ${num}`);
      this.toggleNumberFirstMode.emit({ number: num });
    }
    
    console.log('toggleNumberFirstMode event emitted successfully');
    
    // Force change detection to ensure UI updates
    this.cdr.detectChanges();
  }

  private clearPressTimer(num: number) {
    if (this.pressTimers[num]) {
      clearTimeout(this.pressTimers[num]);
      delete this.pressTimers[num];
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
