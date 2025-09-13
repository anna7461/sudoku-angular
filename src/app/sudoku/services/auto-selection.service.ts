import { Injectable } from '@angular/core';

export interface NumberCompletionStatus {
  [key: number]: boolean; // true if number is completed (all 9 instances filled)
}

@Injectable({
  providedIn: 'root'
})
export class AutoSelectionService {

  /**
   * Finds the next available number that is not yet completed
   * @param remainingCounts - Object with remaining counts for each number (1-9)
   * @param currentNumber - Currently selected number (optional)
   * @returns Next available number or null if all numbers are completed
   */
  findNextAvailableNumber(remainingCounts: { [key: number]: number }, currentNumber?: number | null): number | null {
    // If currentNumber is provided, start checking from the next number
    const startNumber = currentNumber ? (currentNumber % 9) + 1 : 1;
    
    // Check numbers in ascending order, wrapping around from 9 to 1
    for (let i = 0; i < 9; i++) {
      const number = ((startNumber + i - 1) % 9) + 1;
      
      // If this number is not completed (remaining count > 0), return it
      if (remainingCounts[number] > 0) {
        return number;
      }
    }
    
    // All numbers are completed
    return null;
  }

  /**
   * Checks if a specific number is completed (all 9 instances filled)
   * @param number - The number to check (1-9)
   * @param remainingCounts - Object with remaining counts for each number
   * @returns true if the number is completed
   */
  isNumberCompleted(number: number, remainingCounts: { [key: number]: number }): boolean {
    return remainingCounts[number] === 0;
  }

  /**
   * Gets the completion status for all numbers
   * @param remainingCounts - Object with remaining counts for each number
   * @returns Object with completion status for each number
   */
  getNumberCompletionStatus(remainingCounts: { [key: number]: number }): NumberCompletionStatus {
    const status: NumberCompletionStatus = {};
    
    for (let i = 1; i <= 9; i++) {
      status[i] = this.isNumberCompleted(i, remainingCounts);
    }
    
    return status;
  }

  /**
   * Determines if automatic selection should be triggered
   * @param number - The number that was just completed
   * @param remainingCounts - Object with remaining counts for each number
   * @param currentSelectedNumber - Currently selected number in number-first mode
   * @returns true if auto-selection should be triggered
   */
  shouldTriggerAutoSelection(
    number: number, 
    remainingCounts: { [key: number]: number },
    currentSelectedNumber?: number | null
  ): boolean {
    // Only trigger if the number is actually completed
    if (!this.isNumberCompleted(number, remainingCounts)) {
      return false;
    }
    
    // Only trigger if there are other numbers not yet completed
    const nextAvailable = this.findNextAvailableNumber(remainingCounts, number);
    return nextAvailable !== null;
  }

  /**
   * Gets the next number to auto-select after a number is completed
   * @param completedNumber - The number that was just completed
   * @param remainingCounts - Object with remaining counts for each number
   * @returns Next number to select or null if all numbers are completed
   */
  getNextNumberToSelect(completedNumber: number, remainingCounts: { [key: number]: number }): number | null {
    return this.findNextAvailableNumber(remainingCounts, completedNumber);
  }
}
