export interface Move {
  boxIndex: number;
  cellIndex: number;
  previousValue: number | null;
  previousNotes: number[];
  previousState: string;
  newValue: number | null;
  newNotes: number[];
  newState: string;
  timestamp: number;
}
