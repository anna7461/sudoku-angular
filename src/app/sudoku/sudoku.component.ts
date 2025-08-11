import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Box} from './models/box.model';
import {Cell} from './models/cell.model';
import {BoardComponent} from './components/board/board.component';
import {HostListener} from '@angular/core';
import {NumberPadComponent} from './components/number-pad/number-pad.component';
import {ControlsComponent} from './components/controls/controls.component';
import { isValidMove, isBoardValid, isCellPlacementValid } from './components/utils/validation';

@Component({
  standalone: true,
  selector: 'app-sudoku',
  templateUrl: './sudoku.component.html',
  imports: [
    CommonModule,
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
  currentDifficulty: string = '';
  isLoading: boolean = true;

  selectedBoxIndex: number | null = null;
  selectedCellIndex: number | null = null;
  currentNumber: number | null = null; // Track current number being entered
  mistakeCount: number = 0; // Track mistakes made
  score: number = 0; // Track player score
  notesMode: boolean = false; // Toggle for notes mode

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
        difficulty: this.currentDifficulty,
        mistakeCount: this.mistakeCount,
        score: this.score,
        notesMode: this.notesMode,
        timestamp: Date.now()
      };
      console.log('Saving game state:', gameState);
      console.log('Boxes to save:', this.boxes);
      console.log('Boxes length:', this.boxes.length);
      console.log('Difficulty to save:', this.currentDifficulty);
      
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
          
          // Restore difficulty if it exists in saved state
          if (gameState.difficulty) {
            this.currentDifficulty = gameState.difficulty;
            console.log('Difficulty restored from localStorage:', this.currentDifficulty);
          }
          
          // Restore mistake count if it exists in saved state
          if (gameState.mistakeCount !== undefined) {
            this.mistakeCount = gameState.mistakeCount;
            console.log('Mistake count restored from localStorage:', this.mistakeCount);
          }
          
          // Restore score if it exists in saved state
          if (gameState.score !== undefined) {
            this.score = gameState.score;
            console.log('Score restored from localStorage:', this.score);
          }
          
          // Restore notes mode if it exists in saved state
          if (gameState.notesMode !== undefined) {
            this.notesMode = gameState.notesMode;
            console.log('Notes mode restored from localStorage:', this.notesMode);
          }
          
          console.log('Game state loaded from localStorage successfully');
          console.log('Loaded boxes:', this.boxes);
          console.log('Current difficulty:', this.currentDifficulty);
          console.log('Current mistake count:', this.mistakeCount);
          console.log('Current score:', this.score);
          console.log('Current notes mode:', this.notesMode);
          
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
    this.initializeBoard(); // Don't set default difficulty
    
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

  // Method to handle new game event from controls component
  onNewGame(difficulty: string) {
    const validDifficulty = difficulty as 'easy' | 'medium' | 'hard' | 'expert';
    this.startNewGame(validDifficulty);
  }

  // Method to start a new game with specific difficulty
  startNewGame(difficulty?: 'easy' | 'medium' | 'hard' | 'expert') {
    console.log(`Starting new game with difficulty: ${difficulty || ''}`);
    this.isLoading = true;
    this.clearGameState();
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;
    this.mistakeCount = 0; // Reset mistake count
    this.score = 0; // Reset score
    
    // Small delay to prevent blinking
    setTimeout(() => {
      this.initializeBoard(difficulty);
      
      // Save the new game state immediately after initialization
      this.saveGameState();
      
      // Ensure minimum loading time
      setTimeout(() => {
        this.isLoading = false;
      }, 200);
    }, 150);
  }

  // Method to get current puzzle difficulty
  getCurrentDifficulty(): string {
    if (!this.currentDifficulty || this.currentDifficulty === '') {
      return '';
    }
    return this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
  }

  // Method to get mistake count for display
  getMistakeCount(): number {
    return this.mistakeCount;
  }

  // Method to get current score for display
  getCurrentScore(): number {
    return this.score;
  }

  // Method to toggle notes mode
  toggleNotesMode() {
    this.notesMode = !this.notesMode;
    console.log(`Notes mode ${this.notesMode ? 'enabled' : 'disabled'}`);
    this.saveGameState();
  }

  // Method to reset all notes from the board
  resetNotes() {
    console.log('Resetting all notes from the board');
    this.boxes.forEach(box => {
      box.cells.forEach(cell => {
        cell.notes = [];
      });
    });
    this.saveGameState();
    
    // Force change detection to update the UI
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Method to toggle a note in the selected cell
  private toggleNoteInCell(num: number) {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    
    // Cannot add notes to fixed cells or cells that are already correct
    if (cell.isFixed || cell.state === 'correct') return;
    
    const noteIndex = cell.notes.indexOf(num);
    
    if (noteIndex === -1) {
      // Add note
      cell.notes.push(num);
      console.log(`Added note ${num} to cell`);
    } else {
      // Remove note
      cell.notes.splice(noteIndex, 1);
      console.log(`Removed note ${num} from cell`);
    }
    
    // Save game state
    this.saveGameState();
    
    // Force change detection to update the UI
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Method to remove notes with a specific number from related cells
  private removeNotesWithNumber(num: number) {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;
    
    const selectedBoxRow = Math.floor(this.selectedBoxIndex / 3);
    const selectedBoxCol = this.selectedBoxIndex % 3;
    const selectedCellRow = Math.floor(this.selectedCellIndex / 3);
    const selectedCellCol = Math.floor(this.selectedCellIndex % 3);
    
    const selectedGlobalRow = selectedBoxRow * 3 + selectedCellRow;
    const selectedGlobalCol = selectedBoxCol * 3 + selectedCellCol;
    
    // Remove notes from cells in the same row, column, and box
    this.boxes.forEach((box, boxIndex) => {
      box.cells.forEach((cell, cellIndex) => {
        if (cell.notes.includes(num)) {
          const boxRow = Math.floor(boxIndex / 3);
          const boxCol = boxIndex % 3;
          const cellRow = Math.floor(cellIndex / 3);
          const cellCol = Math.floor(cellIndex % 3);
          
          const globalRow = boxRow * 3 + cellRow;
          const globalCol = boxCol * 3 + cellCol;
          
          // Check if cell is in same row, column, or box
          if (globalRow === selectedGlobalRow || 
              globalCol === selectedGlobalCol || 
              boxIndex === this.selectedBoxIndex) {
            const noteIndex = cell.notes.indexOf(num);
            if (noteIndex !== -1) {
              cell.notes.splice(noteIndex, 1);
              console.log(`Removed note ${num} from related cell at (${globalRow}, ${globalCol})`);
            }
          }
        }
      });
    });
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
    this.currentDifficulty = difficulty || '';
    if (difficulty) {
      console.log(`Generated ${this.currentDifficulty} difficulty puzzle`);
    } else {
      console.log('Generated puzzle without difficulty level');
    }
    
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
    
    if (this.notesMode) {
      // Notes mode: add/remove number from notes
      this.toggleNoteInCell(num);
      return; // Don't proceed with normal cell filling
    }
    
    // Place the number
    cell.value = num;
    cell.notes = [];
    
    // Set the state based on validation result
    cell.state = moveIsValid ? 'correct' : 'error';
    console.log(`Cell state set to: ${cell.state}`);
    
    // Update score based on the move
    if (moveIsValid) {
      this.score += 10; // +10 points for correct entry
      console.log(`Correct move! Score increased to: ${this.score}`);
      
      // Remove notes with this number from related cells
      this.removeNotesWithNumber(num);
    } else {
      this.score -= 5; // -5 points for incorrect entry
      this.score = Math.max(0, this.score); // Score cannot go below 0
      console.log(`Incorrect move! Score decreased to: ${this.score}`);
      
      // Increment mistake count
      this.mistakeCount++;
      console.log(`Mistake count increased to: ${this.mistakeCount}`);
      
      // Check if mistake limit reached
      if (this.mistakeCount >= 3) {
        console.log('Game Over - mistake limit reached!');
        setTimeout(() => {
          alert('Game Over – restarting!');
          this.resetGame();
        }, 100);
        return;
      }
    }
    
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
    this.mistakeCount = 0; // Reset mistake count
    this.score = 0; // Reset score
    
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
