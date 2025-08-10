export interface Cell {
  value: number | null;
  isFixed: boolean;
  notes: number[];
  state: 'normal' | 'correct' | 'error' | 'selected';
}
