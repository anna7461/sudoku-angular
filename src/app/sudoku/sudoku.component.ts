import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Box} from './models/box.model';
import {Cell} from './models/cell.model';
import {Move} from './models/move.model';
import {BoardComponent} from './components/board/board.component';
import {NumberPadComponent} from './components/number-pad/number-pad.component';
import {ControlsComponent} from './components/controls/controls.component';

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
  @ViewChild('sudokuContainer', { read: ElementRef }) sudokuContainer!: ElementRef;

  boxes: Box[] = [];
  private readonly STORAGE_KEY = 'sudoku-game-state';
  private solution: number[][] = [];
  private fixedCells: boolean[][] = [];
  currentDifficulty: string = '';
  isLoading: boolean = true;

  selectedBoxIndex: number | null = null;
  selectedCellIndex: number | null = null;
  currentNumber: number | null = null; // Track current number being entered
  mistakeCount: number = 0; // Track mistakes made
  score: number = 0; // Track player score
  notesMode: boolean = false; // Toggle for notes mode
  
  // Move tracking for undo functionality
  private moveHistory: Move[] = [];
  private readonly MAX_UNDO_STEPS = 50; // Limit undo steps to prevent memory issues

  ngOnInit() {
    // Use setTimeout to prevent immediate state changes that cause blinking
    setTimeout(() => {
      this.loadGameState();
    }, 100);
    
    // Add document click listener for detecting clicks outside the board
    document.addEventListener('click', this.documentClickHandler);
  }

  ngOnDestroy() {
    // Remove document click listener to prevent memory leaks
    document.removeEventListener('click', this.documentClickHandler);
  }

  private saveGameState(): void {
    try {
      const gameState = { 
        boxes: this.boxes,
        difficulty: this.currentDifficulty,
        mistakeCount: this.mistakeCount,
        score: this.score,
        notesMode: this.notesMode,
        solution: this.solution,
        fixedCells: this.fixedCells,
        moveHistory: this.moveHistory,
        timestamp: Date.now()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gameState));
      console.log('Game state saved:', gameState);

    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  private loadGameState(): void {
    const startTime = Date.now();
    const minLoadingTime = 300; // ms

    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);

      if (savedState) {
        const gameState = JSON.parse(savedState);

        if (Array.isArray(gameState.boxes) && gameState.boxes.length > 0) {
          this.boxes = gameState.boxes;
          this.currentDifficulty = gameState.difficulty ?? '';
          this.mistakeCount = gameState.mistakeCount ?? 0;
          this.score = gameState.score ?? 0;
          this.notesMode = gameState.notesMode ?? false;
          
          // Clear current number and selection when loading saved game
          this.currentNumber = null;
          this.selectedBoxIndex = null;
          this.selectedCellIndex = null;

          // Load solution and fixed cells if available
          if (gameState.solution && Array.isArray(gameState.solution)) {
            this.solution = gameState.solution;
          }
          if (gameState.fixedCells && Array.isArray(gameState.fixedCells)) {
            this.fixedCells = gameState.fixedCells;
          }
          
          // Load move history if available
          if (gameState.moveHistory && Array.isArray(gameState.moveHistory)) {
            this.moveHistory = gameState.moveHistory;
          }

          // If we have a saved game but no solution, we need to regenerate the puzzle
          // This ensures we can still validate moves
          if (!this.solution || this.solution.length === 0) {
            console.log('Regenerating solution for saved game...');
            this.initializeBoard(this.currentDifficulty as 'easy' | 'medium' | 'hard' | 'expert');
          }

          console.log('Game state loaded:', gameState);
          this.finishLoading(startTime, minLoadingTime);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }

    console.log('No valid saved state found, starting new game');
    this.initializeBoard(); // Default puzzle
    this.finishLoading(startTime, minLoadingTime);
  }

  private finishLoading(startTime: number, minLoadingTime: number): void {
    const elapsed = Date.now() - startTime;
    setTimeout(() => {
      this.isLoading = false;
    }, Math.max(0, minLoadingTime - elapsed));
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
    
    // Clear move history for new game
    this.moveHistory = [];

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

  // Check if undo is available
  canUndo(): boolean {
    return this.moveHistory.length > 0;
  }

  // Get the number of available undo steps
  getUndoStepsCount(): number {
    return this.moveHistory.length;
  }

  // Method to toggle notes mode
  toggleNotesMode() {
    this.notesMode = !this.notesMode;
    console.log(`Notes mode ${this.notesMode ? 'enabled' : 'disabled'}`);
    this.saveGameState();
  }

  // Method to reset all notes from the board
  resetNotes() {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    console.log('Resetting all notes from the board');
    
    // Store the previous state for move tracking (batch operation)
    const moves: Move[] = [];
    
    this.boxes.forEach((box, boxIndex) => {
      box.cells.forEach((cell, cellIndex) => {
        // Only reset notes for non-fixed cells
        if (!cell.isFixed && cell.notes.length > 0) {
          const move: Move = {
            boxIndex,
            cellIndex,
            previousValue: cell.value,
            previousNotes: [...cell.notes],
            previousState: cell.state,
            newValue: cell.value,
            newNotes: [],
            newState: cell.state,
            timestamp: Date.now()
          };
          moves.push(move);
          
          cell.notes = [];
        }
      });
    });
    
    // Add all moves to the history
    this.moveHistory.push(...moves);
    
    // Limit the undo stack size
    while (this.moveHistory.length > this.MAX_UNDO_STEPS) {
      this.moveHistory.shift(); // Remove oldest moves
    }
    
    this.saveGameState();

    // Force change detection to update the UI
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Undo the last move
  undo() {
    if (!this.canUndo()) {
      console.log('No moves to undo');
      return;
    }

    const lastMove = this.moveHistory.pop();
    if (!lastMove) return;

    console.log('Undoing move:', lastMove);

    // Restore the previous cell state
    const cell = this.boxes[lastMove.boxIndex].cells[lastMove.cellIndex];
    cell.value = lastMove.previousValue;
    cell.notes = [...lastMove.previousNotes];
    cell.state = lastMove.previousState as 'normal' | 'correct' | 'error' | 'highlight';

    // Update score if needed (reverse the score change)
    if (lastMove.newState === 'correct' && lastMove.previousState !== 'correct') {
      this.score = Math.max(0, this.score - 10); // Remove points for correct move
    } else if (lastMove.newState === 'error' && lastMove.previousState !== 'error') {
      this.score += 5; // Add back points for incorrect move
      this.mistakeCount = Math.max(0, this.mistakeCount - 1); // Reduce mistake count
    }

    // Clear current selection and number
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;

    // Save game state
    this.saveGameState();

    // Force change detection to update the UI
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }

    console.log('Move undone successfully');
  }

  // Handle game over when mistake limit is reached
  private handleGameOver() {
    console.log('Game Over - mistake limit reached!');
    
    // Show game over message
    setTimeout(() => {
      const message = 'Game Over! You have made 3 mistakes. The game will restart.';
      alert(message);
      
      // Restart the game
      this.resetGame();
    }, 100);
  }

  // Handle victory when puzzle is completed
  private handleVictory() {
    console.log('Victory! Puzzle completed!');
    
    // Show victory message
    setTimeout(() => {
      const message = `Congratulations! You've completed the puzzle!\nScore: ${this.score}\nMistakes: ${this.mistakeCount}`;
      alert(message);
      
      // Optionally start a new game or keep the completed puzzle
      // For now, we'll keep the completed puzzle visible
    }, 100);
  }

  // Method to toggle a note in the selected cell
  private toggleNoteInCell(num: number) {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;

    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];

    // Cannot add notes to fixed cells or cells that are already correct
    if (cell.isFixed || cell.state === 'correct') {
      console.log('Cannot add notes to fixed or correct cell');
      return;
    }

    // Store the previous state for move tracking
    const previousValue = cell.value;
    const previousNotes = [...cell.notes];
    const previousState = cell.state;

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

    // Record the move for undo functionality
    const move: Move = {
      boxIndex: this.selectedBoxIndex,
      cellIndex: this.selectedCellIndex,
      previousValue,
      previousNotes,
      previousState,
      newValue: cell.value,
      newNotes: [...cell.notes],
      newState: cell.state,
      timestamp: Date.now()
    };

    this.moveHistory.push(move);
    
    // Limit the undo stack size
    if (this.moveHistory.length > this.MAX_UNDO_STEPS) {
      this.moveHistory.shift(); // Remove oldest move
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
        // Skip fixed cells - they shouldn't have notes modified
        if (cell.isFixed) return;
        
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

  onCellSelected(event: { boxIndex: number; cellIndex: number; isEditable: boolean }) {
    console.log('Cell selected:', event);
    this.selectedBoxIndex = event.boxIndex;
    this.selectedCellIndex = event.cellIndex;

    // Clear current number when selecting a new cell
    this.currentNumber = null;

    console.log('Selection updated:', { 
      boxIndex: this.selectedBoxIndex, 
      cellIndex: this.selectedCellIndex, 
      isEditable: event.isEditable 
    });
  }

  clearHighlights() {
    // Clear cell selection and current number to remove all highlights
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;

    // Force change detection to update the UI
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Manual event listener for clicks outside the board
  private documentClickHandler = (event: Event) => {
    console.log('Document click detected, sudokuContainer:', this.sudokuContainer);
    if (this.sudokuContainer && !this.sudokuContainer.nativeElement.contains(event.target as Node)) {
      console.log('Click outside detected, clearing highlights');
      this.clearHighlights();
    }
  };

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    // Check if the active element is outside the sudoku board
    const activeElement = document.activeElement;
    if (this.sudokuContainer && activeElement && !this.sudokuContainer.nativeElement.contains(activeElement)) {
      this.clearHighlights();
      return;
    }

    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;

    // Number keys 1–9
    if (/^[1-9]$/.test(event.key)) {
      this.onNumberPadClick(parseInt(event.key, 10));
    }
    // Backspace or Delete clears the cell
    else if (event.key === 'Backspace' || event.key === 'Delete') {
      this.clearCell();
    }
  }


  initializeBoard(difficulty?: 'easy' | 'medium' | 'hard' | 'expert') {
    // Clear current number and selection when initializing new board
    this.currentNumber = null;
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    
    // 1. Generate solved board and store the solution for validation
    const solvedBoard = this.generateSolvedBoard();
    this.solution = solvedBoard.map(row => [...row]); // deep copy

    // 2. Create puzzle from solved board
    const puzzle = this.createPuzzleFromSolved(solvedBoard, difficulty);
    this.currentDifficulty = difficulty || '';

    console.log(
      difficulty
        ? `Generated ${this.currentDifficulty} difficulty puzzle`
        : 'Generated puzzle without difficulty level'
    );

    // 3. Track fixed cells (original numbers from the puzzle)
    this.fixedCells = puzzle.map(row => row.map(num => num !== 0));

    // 4. Build boxes[] from puzzle
    this.boxes = [];
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxCells: Cell[] = [];

        for (let cellRow = 0; cellRow < 3; cellRow++) {
          for (let cellCol = 0; cellCol < 3; cellCol++) {
            const row = boxRow * 3 + cellRow;
            const col = boxCol * 3 + cellCol;

            boxCells.push({
              value: puzzle[row][col] || null,
              isGiven: this.fixedCells[row][col],
              isFixed: this.fixedCells[row][col],
              notes: [],
              state: 'normal'
            });
          }
        }

        this.boxes.push({ cells: boxCells });
      }
    }

    // 5. Save initial game state
    this.saveGameState();
  }

  private generateSudokuPuzzle(difficulty?: 'easy' | 'medium' | 'hard' | 'expert'): number[][] {
    // Start with a solved Sudoku board
    const solvedBoard = this.generateSolvedBoard();

    // Remove numbers based on difficulty to create the puzzle
    return this.createPuzzleFromSolved(solvedBoard, difficulty);
  }

  private generateSolvedBoard(): number[][] {
    // Initialize empty 9x9 board
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill the first row with numbers 1–9
    for (let i = 0; i < 9; i++) {
      board[0][i] = i + 1;
    }

    // Use Sudoku solver to complete the board
    this.solveSudoku(board);

    return board;
  }

  convertBoardToBoxes(board: number[][]): Box[] {
    const boxes: Box[] = [];

    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const cells: Cell[] = [];

        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const globalRow = boxRow * 3 + row;
            const globalCol = boxCol * 3 + col;
            const value = board[globalRow][globalCol];

            cells.push({
              value: value || null,
              isGiven: value !== 0,
              isFixed: value !== 0,
              notes: [],                // ✅ empty notes array
              state: 'normal'            // ✅ default cell state
            });
          }
        }

        boxes.push({ cells });
      }
    }

    return boxes;
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

  private createPuzzleFromSolved(
    solvedBoard: number[][],
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
  ): number[][] {
    // Copy the solved board
    const puzzle = solvedBoard.map(row => [...row]);

    // Number of cells to remove based on difficulty
    const difficultyMap: Record<string, number> = {
      easy: 30,
      medium: 40,
      hard: 50,
      expert: 60
    };
    const cellsToRemove = difficultyMap[difficulty] ?? 45;

    // Generate list of positions (0–80)
    const positions = Array.from({ length: 81 }, (_, i) => i);

    // Shuffle positions using Fisher–Yates
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Remove cells
    for (let i = 0; i < cellsToRemove; i++) {
      const pos = positions[i];
      const row = Math.floor(pos / 9);
      const col = pos % 9;
      puzzle[row][col] = 0;
    }

    return puzzle;
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

  // Check if the puzzle is complete (all cells filled correctly)
  private isPuzzleComplete(): boolean {
    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = this.boxes[boxIndex].cells[cellIndex];
        if (!cell.value || cell.state !== 'correct') {
          return false;
        }
      }
    }
    return true;
  }

  // Check if the game is won (all non-fixed cells are correct)
  private isGameWon(): boolean {
    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = this.boxes[boxIndex].cells[cellIndex];
        if (!cell.isFixed && (!cell.value || cell.state !== 'correct')) {
          return false;
        }
      }
    }
    return true;
  }

  // Check if a move is correct against the solution
  private isMoveCorrect(boxIndex: number, cellIndex: number, value: number): boolean {
    const boxRow = Math.floor(boxIndex / 3);
    const boxCol = boxIndex % 3;
    const cellRow = Math.floor(cellIndex / 3);
    const cellCol = Math.floor(cellIndex % 3);
    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;

    return this.solution[globalRow][globalCol] === value;
  }

  // Get current board state as 2D array for easier validation
  private getCurrentBoardState(): number[][] {
    const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const boxRow = Math.floor(boxIndex / 3);
      const boxCol = boxIndex % 3;

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cellRow = Math.floor(cellIndex / 3);
        const cellCol = cellIndex % 3;
        const globalRow = boxRow * 3 + cellRow;
        const globalCol = boxCol * 3 + cellCol;

        const cell = this.boxes[boxIndex].cells[cellIndex];
        board[globalRow][globalCol] = cell.value || 0;
      }
    }

    return board;
  }

  // Validate entire board and update cell states
  private validateBoard(): void {
    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = this.boxes[boxIndex].cells[cellIndex];

        // Skip fixed cells and empty cells
        if (cell.isFixed || !cell.value) {
          continue;
        }

        // Check if the current value is correct against the solution
        if (this.isMoveCorrect(boxIndex, cellIndex, cell.value)) {
          cell.state = 'correct';
        } else {
          cell.state = 'error';
        }
      }
    }
  }

  fillCell(row: number, col: number, value: number | null) {
    // Calculate the box index (0–8)
    const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    // Calculate the index of the cell inside that box (0–8)
    const cellIndex = (row % 3) * 3 + (col % 3);

    const box = this.boxes[boxIndex];
    if (!box || !box.cells[cellIndex]) {
      console.warn(`Cell at row ${row}, col ${col} not found`);
      return;
    }

    const cell = box.cells[cellIndex];
    if (!cell.isGiven && !cell.isFixed) {
      if (this.notesMode && value !== null) {
        // In notes mode, toggle the note
        const noteIndex = cell.notes.indexOf(value);
        if (noteIndex === -1) {
          // Add note
          cell.notes.push(value);
          console.log(`Added note ${value} to cell at (${row}, ${col})`);
        } else {
          // Remove note
          cell.notes.splice(noteIndex, 1);
          console.log(`Removed note ${value} from cell at (${row}, ${col})`);
        }
      } else {
        // In normal mode, set the main value
        cell.value = value;
        cell.notes = []; // Clear notes when entering a value
        console.log(`Set cell value to ${value} at (${row}, ${col})`);
      }
      this.saveGameState?.(); // Optional if you have save function
    }
  }


  clearCell() {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;
    const cell = this.boxes[this.selectedBoxIndex!].cells[this.selectedCellIndex!];

    // Cannot clear fixed cells or cells that are already correct
    if (cell.isFixed || cell.state === 'correct') {
      console.log('Cannot clear fixed or correct cell');
      return;
    }

    // Store the previous state for move tracking
    const previousValue = cell.value;
    const previousNotes = [...cell.notes];
    const previousState = cell.state;

    // Clear current number
    this.currentNumber = null;

    // Check if notes mode is active
    if (this.notesMode) {
      // In notes mode, clear all notes from the cell
      cell.notes = [];
      console.log('Cleared all notes from cell');
    } else {
      // In normal mode, clear the main value and notes
      cell.value = null;
      cell.notes = [];
      cell.state = 'normal';
      console.log('Cleared cell value and notes');
    }

    // Record the move for undo functionality
    const move: Move = {
      boxIndex: this.selectedBoxIndex,
      cellIndex: this.selectedCellIndex,
      previousValue,
      previousNotes,
      previousState,
      newValue: cell.value,
      newNotes: [...cell.notes],
      newState: cell.state,
      timestamp: Date.now()
    };

    this.moveHistory.push(move);
    
    // Limit the undo stack size
    if (this.moveHistory.length > this.MAX_UNDO_STEPS) {
      this.moveHistory.shift(); // Remove oldest move
    }

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
    
    // Clear move history for reset game
    this.moveHistory = [];

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
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    // Set the current number for highlighting
    this.currentNumber = num;
    
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      // If no cell is selected, just highlight the number without doing anything else
      return;
    }

    // Check if the selected cell can be edited
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    if (cell.isFixed || cell.state === 'correct') {
      console.log('Cannot edit fixed or correct cell');
      return; // cannot edit fixed or correct cells
    }

    // Store the previous state for move tracking
    const previousValue = cell.value;
    const previousNotes = [...cell.notes];
    const previousState = cell.state;

    // Check if notes mode is active
    if (this.notesMode) {
      // In notes mode, toggle the note instead of filling the cell
      this.toggleNoteInCell(num);
      return;
    }

    // Calculate global row and column for validation
    const boxRow = Math.floor(this.selectedBoxIndex / 3);
    const boxCol = this.selectedBoxIndex % 3;
    const cellRow = Math.floor(this.selectedCellIndex / 3);
    const cellCol = Math.floor(this.selectedCellIndex % 3);
    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;

    // Check if the move is valid against the solution
    if (this.solution[globalRow][globalCol] === num) {
      // Correct move
      cell.value = num;
      cell.state = 'correct';
      cell.notes = []; // Clear notes when entering correct value
      
      // Remove conflicting notes from related cells
      this.removeNotesWithNumber(num);

      // Update score
      this.score += 10;
      
      // Clear current number after successful move
      this.currentNumber = null;
      
      // Clear all highlights after successful move
      this.clearHighlights();

      // Check if puzzle is complete
      if (this.isPuzzleComplete()) {
        console.log('Puzzle completed!');
        this.handleVictory();
      }
    } else {
      // Incorrect move
      cell.value = num;
      cell.state = 'error';
      cell.notes = []; // Clear notes when entering incorrect value
      
      // Remove conflicting notes from related cells
      this.removeNotesWithNumber(num);

      // Increment mistake count
      this.mistakeCount++;
      
      // Clear current number after incorrect move
      this.currentNumber = null;

      // Check if game over (3 mistakes)
      if (this.mistakeCount >= 3) {
        console.log('Game over - too many mistakes!');
        this.handleGameOver();
        return; // Stop processing the move
      }
    }

    // Record the move for undo functionality
    const move: Move = {
      boxIndex: this.selectedBoxIndex,
      cellIndex: this.selectedCellIndex,
      previousValue,
      previousNotes,
      previousState,
      newValue: cell.value,
      newNotes: [...cell.notes],
      newState: cell.state,
      timestamp: Date.now()
    };

    this.moveHistory.push(move);
    
    // Limit the undo stack size
    if (this.moveHistory.length > this.MAX_UNDO_STEPS) {
      this.moveHistory.shift(); // Remove oldest move
    }

    // Save game state
    this.saveGameState();

    // Force change detection to update the UI
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

    // Provide a hint by revealing the correct number for the selected cell
  public provideHint(): void {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return;
    }

    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    
    // Can't provide hints for fixed cells or already correct cells
    if (cell.isFixed || cell.state === 'correct') {
      console.log('Cannot provide hint for fixed or correct cell');
      return;
    }

    // Get the correct value from the solution
    const boxRow = Math.floor(this.selectedBoxIndex / 3);
    const boxCol = this.selectedBoxIndex % 3;
    const cellRow = Math.floor(this.selectedCellIndex / 3);
    const cellCol = Math.floor(this.selectedCellIndex % 3);
    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;

    const correctValue = this.solution[globalRow][globalCol];

    // Fill in the correct value
    cell.value = correctValue;
    cell.state = 'correct';
    cell.notes = [];
    
    // Remove conflicting notes from related cells
    this.removeNotesWithNumber(correctValue);
    
    // Clear current number when providing hint
    this.currentNumber = null;
    
    // Clear all highlights after providing hint
    this.clearHighlights();

    // Update score (hints give fewer points)
    this.score += 5;

    // Save game state
    this.saveGameState();

    // Force change detection
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Check if the game is over (too many mistakes)
  public isGameOver(): boolean {
    return this.mistakeCount >= 3;
  }

  // Check if the game is active (not over and not won)
  public isGameActive(): boolean {
    return !this.isGameOver() && !this.hasWonGame();
  }

  // Check if the game is won
  public hasWonGame(): boolean {
    return this.isGameWon();
  }

  // Get current board state for debugging (public method)
  public getBoardState(): number[][] {
    return this.getCurrentBoardState();
  }

  // Get solution for debugging purposes
  public getSolution(): number[][] {
    return this.solution.map(row => [...row]); // Return a copy
  }

  // Validate the entire board and update cell states
  public validateEntireBoard(): void {
    this.validateBoard();

    // Save game state after validation
    this.saveGameState();

    // Force change detection
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Check if a specific move is valid (public method)
  public isMoveValid(boxIndex: number, cellIndex: number, value: number): boolean {
    return this.isMoveCorrect(boxIndex, cellIndex, value);
  }

  // Get current difficulty level
  public getDifficulty(): string {
    return this.currentDifficulty;
  }

  // Get current score
  getScore(): number {
    return this.score;
  }

  // Get current mistake count
  getMistakes(): number {
    return this.mistakeCount;
  }

  // Get current notes mode
  getNotesMode(): boolean {
    return this.notesMode;
  }

  // Get current selected cell information
  getSelectedCell(): { boxIndex: number | null; cellIndex: number | null; isEditable: boolean } {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return { boxIndex: null, cellIndex: null, isEditable: false };
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return {
      boxIndex: this.selectedBoxIndex,
      cellIndex: this.selectedCellIndex,
      isEditable: !cell.isFixed && cell.state !== 'correct'
    };
  }

  // Check if the currently selected cell is editable
  isSelectedCellEditable(): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return false;
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return !cell.isFixed && cell.state !== 'correct';
  }

  // Get the currently selected cell's value and state
  getSelectedCellInfo(): { value: number | null; state: string; isFixed: boolean; notes: number[] } | null {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return null;
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return {
      value: cell.value,
      state: cell.state,
      isFixed: cell.isFixed,
      notes: [...cell.notes] // Return a copy
    };
  }

  // Get current number being entered
  getCurrentNumber(): number | null {
    return this.currentNumber;
  }

  // Get current boxes
  getBoxes(): Box[] {
    return this.boxes;
  }

  // Get current fixed cells
  getFixedCells(): boolean[][] {
    return this.fixedCells.map(row => [...row]); // Return a copy
  }

  // Get current loading state
  getLoadingState(): boolean {
    return this.isLoading;
  }

  // Get current timestamp
  getTimestamp(): number {
    return Date.now();
  }

  // Get current storage key
  getStorageKey(): string {
    return this.STORAGE_KEY;
  }

  // Get current board component
  getBoardComponent(): BoardComponent {
    return this.boardComponent;
  }

    // Get current sudoku container
  public getSudokuContainer(): ElementRef {
    return this.sudokuContainer;
  }

  // Check if the currently selected cell is a fixed cell
  public isSelectedCellFixed(): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return false;
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return cell.isFixed;
  }

  // Check if a specific cell can be edited
  public canCellBeEdited(boxIndex: number, cellIndex: number): boolean {
    if (boxIndex < 0 || boxIndex >= 9 || cellIndex < 0 || cellIndex >= 9) {
      return false;
    }
    
    const cell = this.boxes[boxIndex].cells[cellIndex];
    return !cell.isFixed && cell.state !== 'correct';
  }

  // Get the current cell's editability status
  public getCurrentCellEditability(): boolean {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return false;
    }
    
    return this.canCellBeEdited(this.selectedBoxIndex, this.selectedCellIndex);
  }

  // Get the currently selected cell's value and state
  public getSelectedCellValue(): number | null {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return null;
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return cell.value;
  }

  // Get the currently selected cell's notes
  public getSelectedCellNotes(): number[] {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return [];
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return [...cell.notes]; // Return a copy
  }

  // Get the currently selected cell's state
  public getSelectedCellState(): string {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return 'normal';
    }
    
    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return cell.state;
  }
}
