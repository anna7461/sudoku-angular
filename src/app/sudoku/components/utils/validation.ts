import { Cell } from '../../models/cell.model';
import { Box } from '../../models/box.model';

// Helper to flatten boxes array into 9x9 matrix for easier validation
export function flattenBoxesToGrid(boxes: Box[]): (Cell | null)[][] {
  const grid: (Cell | null)[][] = Array.from({ length: 9 }, () =>
    Array(9).fill(null)
  );

  boxes.forEach((box, boxIndex) => {
    const boxRow = Math.floor(boxIndex / 3);
    const boxCol = boxIndex % 3;

    box.cells.forEach((cell, cellIndex) => {
      const cellRow = Math.floor(cellIndex / 3);
      const cellCol = Math.floor(cellIndex % 3);

      grid[boxRow * 3 + cellRow][boxCol * 3 + cellCol] = cell;
    });
  });

  return grid;
}

// Check if placing 'num' at (row, col) is valid according to Sudoku rules
export function isValidMove(boxes: Box[], boxIndex: number, cellIndex: number, num: number): boolean {
  const grid = flattenBoxesToGrid(boxes);

  const boxRow = Math.floor(boxIndex / 3);
  const boxCol = boxIndex % 3;
  const cellRow = Math.floor(cellIndex / 3);
  const cellCol = Math.floor(cellIndex % 3);

  const row = boxRow * 3 + cellRow;
  const col = boxCol * 3 + cellCol;

  // Check row - exclude the current cell
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c]?.value === num) return false;
  }

  // Check column - exclude the current cell
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col]?.value === num) return false;
  }

  // Check 3x3 box - exclude the current cell
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c]?.value === num) return false;
    }
  }

  return true;
}

// Check if the entire board is valid (no conflicts)
export function isBoardValid(boxes: Box[]): boolean {
  const grid = flattenBoxesToGrid(boxes);
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    const rowNumbers = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col]?.value;
      if (value && rowNumbers.has(value)) return false;
      if (value) rowNumbers.add(value);
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const colNumbers = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const value = grid[row][col]?.value;
      if (value && colNumbers.has(value)) return false;
      if (value) colNumbers.add(value);
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxNumbers = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow * 3 + r;
          const col = boxCol * 3 + c;
          const value = grid[row][col]?.value;
          if (value && boxNumbers.has(value)) return false;
          if (value) boxNumbers.add(value);
        }
      }
    }
  }
  
  return true;
}

// Check if a specific cell placement is valid (for determining correct state)
export function isCellPlacementValid(boxes: Box[], boxIndex: number, cellIndex: number): boolean {
  const grid = flattenBoxesToGrid(boxes);
  
  const boxRow = Math.floor(boxIndex / 3);
  const boxCol = boxIndex % 3;
  const cellRow = Math.floor(cellIndex / 3);
  const cellCol = Math.floor(cellIndex % 3);
  
  const row = boxRow * 3 + cellRow;
  const col = boxCol * 3 + cellCol;
  
  const cell = grid[row][col];
  if (!cell || !cell.value) return false;
  
  const num = cell.value;
  
  // Check row - exclude the current cell
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c]?.value === num) return false;
  }
  
  // Check column - exclude the current cell
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col]?.value === num) return false;
  }
  
  // Check 3x3 box - exclude the current cell
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c]?.value === num) return false;
    }
  }
  
  return true;
}
