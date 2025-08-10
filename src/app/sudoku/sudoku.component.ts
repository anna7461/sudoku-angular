import {Component, OnInit, ViewChild} from '@angular/core';
import {Box} from './models/box.model';
import {Cell} from './models/cell.model';
import {BoardComponent} from './components/board/board.component';
import {HostListener} from '@angular/core';
import {NumberPadComponent} from './components/number-pad/number-pad.component';
import {ControlsComponent} from './components/controls/controls.component';
import { isValidMove, isBoardValid, isCellPlacementValid } from '../sudoku/components/utils/validation';

@Component({
  standalone: true,
  selector: 'app-sudoku',
  templateUrl: './sudoku.component.html',
  imports: [
    BoardComponent,
    NumberPadComponent,
    ControlsComponent
  ],
  styleUrls: ['./sudoku.component.scss']
})
export class SudokuComponent implements OnInit {

  @ViewChild(BoardComponent) boardComponent!: BoardComponent;
  
  boxes: Box[] = [];
  private readonly STORAGE_KEY = 'sudoku-game-state';
  private currentDifficulty: string = 'random';
  isLoading: boolean = true;

  selectedBoxIndex: number | null = null;
  selectedCellIndex: number | null = null;
  currentNumber: number | null = null; // Track current number being entered

  ngOnInit() {
    // Use setTimeout to prevent immediate state changes that cause blinking
    setTimeout(() => {
      this.loadGameState();
    }, 100);
  }

  private saveGameState() {
    try {
      const gameState = {
        boxes: this.boxes,
        timestamp: Date.now()
      };
      console.log('Saving game state:', gameState);
      console.log('Boxes to save:', this.boxes);
      console.log('Boxes length:', this.boxes.length);
      
      const jsonString = JSON.stringify(gameState);
      console.log('JSON string to save:', jsonString);
      
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      console.log('Game state saved to localStorage successfully');
      
      // Verify it was saved
      const saved = localStorage.getItem(this.STORAGE_KEY);
      console.log('Verification - retrieved from localStorage:', saved);
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  private loadGameState() {
    const startTime = Date.now();
    const minLoadingTime = 300; // Minimum loading time in milliseconds
    
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      console.log('Raw saved state from localStorage:', savedState);
      
      if (savedState) {
        const gameState = JSON.parse(savedState);
        console.log('Parsed game state:', gameState);
        console.log('Boxes in saved state:', gameState.boxes);
        console.log('Boxes length:', gameState.boxes?.length);
        
        if (gameState.boxes && gameState.boxes.length > 0) {
          this.boxes = gameState.boxes;
          console.log('Game state loaded from localStorage successfully');
          console.log('Loaded boxes:', this.boxes);
          
          // Ensure minimum loading time
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, minLoadingTime - elapsed);
          
          setTimeout(() => {
            this.isLoading = false;
          }, remaining);
          return;
        } else {
          console.log('Saved state exists but boxes are invalid or empty');
        }
      } else {
        console.log('No saved state found in localStorage');
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
    
    // If no valid saved state, initialize with default puzzle
    console.log('Initializing new game - no valid saved state found');
    this.initializeBoard();
    
    // Ensure minimum loading time
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadingTime - elapsed);
    
    setTimeout(() => {
      this.isLoading = false;
    }, remaining);
  }

  private clearGameState() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Game state cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear game state:', error);
    }
  }

  // Method to start a new game with specific difficulty
  startNewGame(difficulty?: 'easy' | 'medium' | 'hard' | 'expert') {
    console.log(`Starting new game with difficulty: ${difficulty || 'random'}`);
    this.isLoading = true;
    this.clearGameState();
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;
    
    // Small delay to prevent blinking
    setTimeout(() => {
      this.initializeBoard(difficulty);
      
      // Ensure minimum loading time
      setTimeout(() => {
        this.isLoading = false;
      }, 200);
    }, 150);
  }

  // Method to get current puzzle difficulty
  getCurrentDifficulty(): string {
    return this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
  }

  onCellSelected(event: { boxIndex: number; cellIndex: number }) {
    console.log('Cell selected:', event);
    this.selectedBoxIndex = event.boxIndex;
    this.selectedCellIndex = event.cellIndex;
    
    // Clear current number when selecting a new cell
    this.currentNumber = null;
    
    console.log('Selection updated:', { boxIndex: this.selectedBoxIndex, cellIndex: this.selectedCellIndex });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    console.log('Keyboard input:', event.key, 'Selection:', { boxIndex: this.selectedBoxIndex, cellIndex: this.selectedCellIndex });

    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      console.log('No cell selected, ignoring input');
      return; // no cell selected
    }

    // Check if the selected cell can be edited
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    if (cell.isFixed || cell.state === 'correct') {
      console.log('Cell cannot be edited, ignoring input');
      return; // cannot edit fixed or correct cells
    }

    const key = event.key;

    if (key >= '1' && key <= '9') {
      console.log('Filling cell with:', key);
      this.fillCell(parseInt(key, 10));
      event.preventDefault();
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
      console.log('Clearing cell');
      this.clearCell();
      event.preventDefault();
    } else if (key === 'r' || key === 'R') {
      // Reset game with R key
      this.resetGame();
      event.preventDefault();
    } else if (key === 'e' || key === 'E') {
      // Start new easy game
      this.startNewGame('easy');
      event.preventDefault();
    } else if (key === 'm' || key === 'M') {
      // Start new medium game
      this.startNewGame('medium');
      event.preventDefault();
    } else if (key === 'h' || key === 'H') {
      // Start new hard game
      this.startNewGame('hard');
      event.preventDefault();
    } else if (key === 'x' || key === 'X') {
      // Start new expert game
      this.startNewGame('expert');
      event.preventDefault();
    }
  }

  initializeBoard(difficulty?: 'easy' | 'medium' | 'hard' | 'expert') {
    // Generate a new Sudoku puzzle dynamically
    const puzzle = this.generateSudokuPuzzle(difficulty);
    this.currentDifficulty = difficulty || 'random';
    console.log(`Generated ${this.currentDifficulty} difficulty puzzle`);
    
    const fixedCells: boolean[][] = puzzle.map(row => row.map(num => num !== 0));

    this.boxes = [];

    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxCells: Cell[] = [];

        for (let cellRow = 0; cellRow < 3; cellRow++) {
          for (let cellCol = 0; cellCol < 3; cellCol++) {
            const row = boxRow * 3 + cellRow;
            const col = boxCol * 3 + cellCol;
            boxCells.push({
              value: puzzle[row][col] === 0 ? null : puzzle[row][col],
              isFixed: fixedCells[row][col],
              notes: [],
              state: 'normal'
            });
          }
        }

        this.boxes.push({cells: boxCells});
      }
    }
  }

  private generateSudokuPuzzle(difficulty?: 'easy' | 'medium' | 'hard' | 'expert'): number[][] {
    // Start with a solved Sudoku board
    const solvedBoard = this.generateSolvedBoard();
    
    // Remove numbers based on difficulty to create the puzzle
    const puzzle = this.createPuzzleFromSolved(solvedBoard, difficulty);
    
    return puzzle;
  }

  private generateSolvedBoard(): number[][] {
    // Create a solved 9x9 Sudoku board
    const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // Fill the first row with numbers 1-9
    for (let i = 0; i < 9; i++) {
      board[0][i] = i + 1;
    }
    
    // Use a simple algorithm to complete the board
    this.solveSudoku(board);
    
    return board;
  }

  private solveSudoku(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          // Try numbers 1-9
          for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
              board[row][col] = num;
              
              if (this.solveSudoku(board)) {
                return true;
              }
              
              board[row][col] = 0; // backtrack
            }
          }
          return false; // no valid number found
        }
      }
    }
    return true; // board is solved
  }

  private isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startRow + i][startCol + j] === num) return false;
      }
    }
    
    return true;
  }

  private createPuzzleFromSolved(solvedBoard: number[][], difficulty?: 'easy' | 'medium' | 'hard' | 'expert'): number[][] {
    // Create a copy of the solved board
    const puzzle = solvedBoard.map(row => [...row]);
    
    // Determine how many cells to remove based on difficulty
    let cellsToRemove: number;
    switch (difficulty) {
      case 'easy':
        cellsToRemove = 30; // Keep more numbers (easier)
        break;
      case 'medium':
        cellsToRemove = 40; // Moderate difficulty
        break;
      case 'hard':
        cellsToRemove = 50; // Harder
        break;
      case 'expert':
        cellsToRemove = 60; // Very hard
        break;
      default:
        cellsToRemove = 45; // Default to medium
        break;
    }
    
    // Randomly remove cells
    const totalCells = 81;
    const positions = Array.from({length: totalCells}, (_, i) => i);
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Remove cells
    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const pos = positions[i];
      const row = Math.floor(pos / 9);
      const col = pos % 9;
      puzzle[row][col] = 0;
    }
    
    return puzzle;
  }

  fillCell(num: number) {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;
    const cell = this.boxes[this.selectedBoxIndex!].cells[this.selectedCellIndex!];
    
    // Cannot edit fixed cells or cells that are already correct
    if (cell.isFixed || cell.state === 'correct') return;
    
    console.log(`Filling cell with ${num}, previous state: ${cell.state}`);
    
    // Check if this move is valid BEFORE placing the number
    const moveIsValid = isValidMove(this.boxes, this.selectedBoxIndex!, this.selectedCellIndex!, num);
    console.log(`Move validation result: ${moveIsValid}`);
    
    // Set current number for highlighting
    this.currentNumber = num;
    
    // Place the number
    cell.value = num;
    cell.notes = [];
    
    // Set the state based on validation result
    cell.state = moveIsValid ? 'correct' : 'error';
    console.log(`Cell state set to: ${cell.state}`);
    
    // Clear current number after placing
    this.currentNumber = null;
    
    // Force change detection to show the final state
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
    
    // Save game state
    this.saveGameState();
  }

  clearCell() {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;
    const cell = this.boxes[this.selectedBoxIndex!].cells[this.selectedCellIndex!];
    
    // Cannot clear fixed cells or cells that are already correct
    if (cell.isFixed || cell.state === 'correct') return;

    // Clear current number
    this.currentNumber = null;

    cell.value = null;
    cell.notes = [];
    cell.state = 'normal';
    
    // Force change detection to show the updated state
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
    
    // Save game state after clearing
    this.saveGameState();
  }

  resetGame() {
    console.log('Resetting game...');
    this.isLoading = true;
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;
    
    // Reset all non-fixed cells to their initial state
    this.boxes.forEach(box => {
      box.cells.forEach(cell => {
        if (!cell.isFixed) {
          cell.value = null;
          cell.notes = [];
          cell.state = 'normal';
        }
      });
    });
    
    // Save the reset game state instead of clearing it
    this.saveGameState();
    
    // Small delay to prevent blinking
    setTimeout(() => {
      this.isLoading = false;
    }, 150);
  }

  // Called when user clicks number on dock number pad
  onNumberPadClick(num: number) {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return;
    }
    
    // Check if the selected cell can be edited
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    if (cell.isFixed || cell.state === 'correct') {
      return; // cannot edit fixed or correct cells
    }
    
    this.fillCell(num);
  }
}
