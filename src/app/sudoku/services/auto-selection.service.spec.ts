import { TestBed } from '@angular/core/testing';
import { AutoSelectionService } from './auto-selection.service';

describe('AutoSelectionService', () => {
  let service: AutoSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutoSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findNextAvailableNumber', () => {
    it('should find the next available number after current number', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      const nextNumber = service.findNextAvailableNumber(remainingCounts, 2);
      expect(nextNumber).toBe(3);
    });

    it('should wrap around from 9 to 1', () => {
      const remainingCounts = { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const nextNumber = service.findNextAvailableNumber(remainingCounts, 9);
      expect(nextNumber).toBe(1);
    });

    it('should return null if all numbers are completed', () => {
      const remainingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const nextNumber = service.findNextAvailableNumber(remainingCounts, 5);
      expect(nextNumber).toBeNull();
    });

    it('should start from 1 if no current number provided', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      const nextNumber = service.findNextAvailableNumber(remainingCounts);
      expect(nextNumber).toBe(2);
    });
  });

  describe('isNumberCompleted', () => {
    it('should return true when remaining count is 0', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      expect(service.isNumberCompleted(1, remainingCounts)).toBe(true);
      expect(service.isNumberCompleted(5, remainingCounts)).toBe(true);
    });

    it('should return false when remaining count is greater than 0', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      expect(service.isNumberCompleted(2, remainingCounts)).toBe(false);
      expect(service.isNumberCompleted(6, remainingCounts)).toBe(false);
    });
  });

  describe('shouldTriggerAutoSelection', () => {
    it('should trigger when the completed number was selected and other numbers remain', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      expect(service.shouldTriggerAutoSelection(1, remainingCounts, 1)).toBe(true);
    });

    it('should trigger even when the completed number was not selected', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      expect(service.shouldTriggerAutoSelection(1, remainingCounts, 2)).toBe(true);
    });

    it('should not trigger when all numbers are completed', () => {
      const remainingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      expect(service.shouldTriggerAutoSelection(1, remainingCounts, 1)).toBe(false);
    });

    it('should not trigger when the number is not actually completed', () => {
      const remainingCounts = { 1: 1, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      expect(service.shouldTriggerAutoSelection(1, remainingCounts, 1)).toBe(false);
    });
  });

  describe('getNextNumberToSelect', () => {
    it('should return the next available number after the completed number', () => {
      const remainingCounts = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 0, 6: 4, 7: 2, 8: 1, 9: 3 };
      const nextNumber = service.getNextNumberToSelect(1, remainingCounts);
      expect(nextNumber).toBe(2);
    });

    it('should wrap around from 9 to 1', () => {
      const remainingCounts = { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const nextNumber = service.getNextNumberToSelect(9, remainingCounts);
      expect(nextNumber).toBe(1);
    });

    it('should return null if all numbers are completed', () => {
      const remainingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const nextNumber = service.getNextNumberToSelect(5, remainingCounts);
      expect(nextNumber).toBeNull();
    });

    it('should return null if all numbers are completed (edge case)', () => {
      const remainingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const nextNumber = service.getNextNumberToSelect(9, remainingCounts);
      expect(nextNumber).toBeNull();
    });
  });
});
