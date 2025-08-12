export interface Cell {
  value: number | null;
  isGiven: boolean;
  isFixed: boolean;
  notes: number[];
  state: 'normal' | 'correct' | 'error' | 'highlight';
}
