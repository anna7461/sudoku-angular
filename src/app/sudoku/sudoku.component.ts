import {Component, ElementRef, HostListener, OnInit, OnDestroy, ViewChild, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, NavigationStart} from '@angular/router';
import {Box} from './models/box.model';
import {Cell} from './models/cell.model';
import {Move} from './models/move.model';
import {BoardComponent} from './components/board/board.component';
import {NumberPadComponent} from './components/number-pad/number-pad.component';
import {ControlsComponent} from './components/controls/controls.component';
import {TimerComponent} from './components/timer/timer.component';
import {BoardControlsComponent} from './components/board-controls/board-controls.component';
import {PauseDialogComponent} from './components/pause-dialog/pause-dialog.component';
import {GameOverDialogComponent, GameOverStats} from './components/game-over-dialog/game-over-dialog.component';
import {CongratulationsDialogComponent, CongratulationsStats} from './components/congratulations-dialog/congratulations-dialog.component';
import {ThemeService} from './services/theme.service';
import {PauseService} from './services/pause.service';
import {GameResetService} from './services/game-reset.service';
import {NewGameService, GameDifficulty} from './services/new-game.service';

@Component({
  standalone: true,
  selector: 'app-sudoku',
  templateUrl: './sudoku.component.html',
  imports: [
    CommonModule,
    BoardComponent,
    NumberPadComponent,
    ControlsComponent,
    TimerComponent,
    BoardControlsComponent,
    PauseDialogComponent,
    GameOverDialogComponent,
    CongratulationsDialogComponent
  ],
  styleUrls: ['./sudoku.component.scss'],
  host: {
    '[class]': 'getThemeClass()'
  }
})
export class SudokuComponent implements OnInit, OnDestroy {

  @ViewChild(BoardComponent) boardComponent!: BoardComponent;
  @ViewChild('sudokuContainer', { read: ElementRef }) sudokuContainer!: ElementRef;
  @ViewChild(TimerComponent) timerComponent!: TimerComponent;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private themeService: ThemeService,
    private pauseService: PauseService,
    private gameResetService: GameResetService,
    private newGameService: NewGameService,
    private router: Router
  ) {}

  /**
   * Get the current theme class for the host element
   */
  getThemeClass(): string {
    return this.themeService.getCurrentTheme().className;
  }

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
  numberFirstMode: boolean = false; // Toggle for number-first mode
  selectedNumber: number | null = null; // Selected number in number-first mode

  // Move tracking for undo functionality
  private moveHistory: Move[] = [];
  private readonly MAX_UNDO_STEPS = 50; // Limit undo steps to prevent memory issues

  // Timer functionality
  isGamePaused: boolean = false;
  gameStartTime: number | null = null;
  totalGameTime: number = 0;

  // Game Over Dialog
  showGameOverDialog: boolean = false;
  gameOverStats: GameOverStats | null = null;

  // Congratulations Dialog
  showCongratulationsDialog: boolean = false;
  congratulationsStats: CongratulationsStats | null = null;

  // Cache for isGameActive to prevent ExpressionChangedAfterItHasBeenCheckedError
  private _cachedIsGameActive: boolean = true;
  private _gameActiveLastCheck: { [key: string]: any } = {};

  // Cache for game state to avoid repeated calculations
  private _cachedGameOver: boolean = false;
  private _cachedGameWon: boolean = false;
  private _cachedResetDisabled: boolean | null = null;
  private _cachedControlsAvailable: boolean | null = null;

  private invalidateGameActiveCache(): void {
    this._gameActiveLastCheck = {};
    this._cachedGameOver = false;
    this._cachedGameWon = false;
    this._cachedResetDisabled = null;
    this._cachedControlsAvailable = null;
  }

  private resetGameStateCache(): void {
    this._cachedIsGameActive = true;
    this._gameActiveLastCheck = {};
    this._cachedGameOver = false;
    this._cachedGameWon = false;
    this._cachedResetDisabled = null;
    this._cachedControlsAvailable = null;
  }

  /**
   * Clear the current board cell selection
   */
  private clearBoardSelection(): void {
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
  }

  ngOnInit() {
    console.log('ngOnInit: Initial state:', {
      isLoading: this.isLoading,
      mistakeCount: this.mistakeCount,
      boxesLength: this.boxes.length
    });

    // Make component accessible from browser console for testing (browser only)
    if (typeof window !== 'undefined') {
      (window as any).sudokuComponent = this;
      console.log('SudokuComponent available at window.sudokuComponent');
      console.log('Test unique puzzle generation with: window.sudokuComponent.testUniquePuzzleGeneration()');
    }

    // Use setTimeout to prevent immediate state changes that cause blinking
    // Also give NewGameService time to process any pending requests
    setTimeout(() => {
      this.loadGameState();
    }, 200);

    // Add document click listener for detecting clicks outside the board (browser only)
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this.documentClickHandler);
    }

    // Listen for game reset events from GameResetService
    if (typeof window !== 'undefined') {
      window.addEventListener('sudoku-game-reset', this.handleGameReset.bind(this) as EventListener);
    }

    // Listen for new game events from NewGameService
    if (typeof window !== 'undefined') {
      window.addEventListener('sudoku-new-game', this.handleNewGame.bind(this) as EventListener);
    }

    // Listen for pause state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('sudoku-pause-state-changed', this.handlePauseStateChange.bind(this) as EventListener);
    }

    // Add beforeunload event listener to save game state when user leaves
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this) as EventListener);
    }

    // Listen for router navigation to save game state before leaving
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Save game state before navigation starts
        if (this.boxes && this.boxes.length > 0) {
          this.saveGameState();
          console.log('Game state saved before navigation');
        }
      }
    });

    // Load pause state from PauseService
    this.pauseService.loadPauseState();
  }

  ngOnDestroy() {
    // Save game state before destroying component
    if (this.boxes && this.boxes.length > 0) {
      this.saveGameState();
      console.log('Game state saved before component destruction');
    }

    // Remove document click listener to prevent memory leaks (browser only)
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.documentClickHandler);
    }

    // Remove custom event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('sudoku-game-reset', this.handleGameReset.bind(this) as EventListener);
      window.removeEventListener('sudoku-new-game', this.handleNewGame.bind(this) as EventListener);
      window.removeEventListener('sudoku-pause-state-changed', this.handlePauseStateChange.bind(this) as EventListener);
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this) as EventListener);
    }
  }

  /**
   * Handle game reset events from GameResetService
   */
  private handleGameReset(event: Event): void {
    const customEvent = event as CustomEvent;
    console.log('Game reset event received:', customEvent.detail);
    this.resetGame();
  }

  /**
   * Handle new game events from NewGameService
   */
  private handleNewGame(event: Event): void {
    const customEvent = event as CustomEvent;
    console.log('New game event received:', customEvent.detail);
    const { difficulty } = customEvent.detail;
    console.log('Difficulty from event:', difficulty, 'Type:', typeof difficulty);
    
    // Clear any existing game state immediately
    this.clearGameState();
    
    // Start new game with selected difficulty
    this.startNewGame(difficulty);
  }

  /**
   * Handle beforeunload event to save game state when user leaves
   */
  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    // Save current game state before user leaves
    this.saveGameState();
    console.log('Game state saved before unload');
  }

  /**
   * Handle pause state change events
   */
  private handlePauseStateChange(event: Event): void {
    const customEvent = event as CustomEvent;
    const { isPaused } = customEvent.detail;
    
    // Update local pause state
    this.isGamePaused = isPaused;
    
    // Save game state when pause state changes
    if (this.boxes && this.boxes.length > 0) {
      this.saveGameState();
      console.log(`Game state saved after pause state change: ${isPaused ? 'paused' : 'resumed'}`);
    }
  }

  private saveGameState(): void {
    try {
      const gameState = {
        boxes: this.boxes,
        difficulty: this.currentDifficulty,
        mistakeCount: this.mistakeCount,
        score: this.score,
        notesMode: this.notesMode,
        numberFirstMode: this.numberFirstMode,
        selectedNumber: this.selectedNumber,
        solution: this.solution,
        fixedCells: this.fixedCells,
        moveHistory: this.moveHistory,
        gameStartTime: this.gameStartTime,
        totalGameTime: this.totalGameTime,
        isGamePaused: this.isGamePaused,
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
          this.numberFirstMode = gameState.numberFirstMode ?? false;
          this.selectedNumber = gameState.selectedNumber ?? null;

          console.log('Loaded game state:', {
            difficulty: this.currentDifficulty,
            mistakeCount: this.mistakeCount,
            score: this.score,
            notesMode: this.notesMode
          });

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

          // Load timer information if available
          if (gameState.gameStartTime !== undefined) {
            this.gameStartTime = gameState.gameStartTime;
          }
          if (gameState.totalGameTime !== undefined) {
            this.totalGameTime = gameState.totalGameTime;
          }
          if (gameState.isGamePaused !== undefined) {
            this.isGamePaused = gameState.isGamePaused;
          }

          // Timer component will automatically restore from localStorage
          // No need to manually call restoration here

          // Check if the loaded game state has too many mistakes and auto-reset if needed
          if (this.mistakeCount >= 3) {
            console.log('Loaded game has too many mistakes, auto-resetting...');
            this.mistakeCount = 0;
            this.score = 0;
            this.moveHistory = [];
            this.gameStartTime = null;
            this.totalGameTime = 0;
            this.isGamePaused = false;
            this.invalidateGameActiveCache();
          }

          // Check if the loaded game is already completed
          if (this.boxes && this.boxes.length > 0 && this.hasWonGame()) {
            console.log('Loaded game is already completed');
            console.log('🏆 Game was completed previously!');
          }

          // If we have a saved game but no solution, we need to regenerate the puzzle
          // This ensures we can still validate moves
          if (!this.solution || this.solution.length === 0) {
            console.log('Regenerating solution for saved game...');
            this.initializeBoard(this.currentDifficulty as 'test' | 'easy' | 'medium' | 'hard' | 'expert');
          }

          console.log('Game state loaded:', gameState);
          this.finishLoading(startTime, minLoadingTime);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }

    // Check if there's a pending new game request from NewGameService
    const pendingNewGame = this.newGameService.getLastNewGameRequest();
    if (pendingNewGame && pendingNewGame.difficulty) {
      console.log(`Found pending new game request with difficulty: ${pendingNewGame.difficulty}`);
      this.initializeBoard(pendingNewGame.difficulty);
      this.finishLoading(startTime, minLoadingTime);
      return;
    }

    console.log('No valid saved state found, starting new game');
    this.initializeBoard(); // Default puzzle
    this.finishLoading(startTime, minLoadingTime);
  }

  private finishLoading(startTime: number, minLoadingTime: number): void {
    const elapsed = Date.now() - startTime;
    setTimeout(() => {
      this.isLoading = false;
      this.invalidateGameActiveCache();
      this.changeDetectorRef.detectChanges();
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
    const validDifficulty = difficulty as 'test' | 'easy' | 'medium' | 'hard' | 'expert';
    this.startNewGame(validDifficulty);
  }

  // Method to navigate back to dashboard
  goToDashboard(): void {
    // Save current game state before navigating
    this.saveGameState();
    this.router.navigate(['/']);
  }

  // Method to start a new game with a specific difficulty
  startNewGame(difficulty?: 'test' | 'easy' | 'medium' | 'hard' | 'expert') {
    console.log(`Starting new game with difficulty: ${difficulty || ''}, Type: ${typeof difficulty}`);
    this.isLoading = true;
    this.clearGameState();
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;
    this.selectedNumber = null; // Reset the selected number for number-first mode
    this.mistakeCount = 0; // Reset mistake count
    this.score = 0; // Reset score

    // Reset game over dialog state
    this.showGameOverDialog = false;
    this.gameOverStats = null;

    // Reset congratulations dialog state
    this.showCongratulationsDialog = false;
    this.congratulationsStats = null;

    // Clear move history for new game
    this.moveHistory = [];

        // Reset timer for new game
    this.gameStartTime = null;
    this.totalGameTime = 0;
    this.isGamePaused = false;

    // Reset the timer component
    if (this.timerComponent) {
      this.timerComponent.resetGameTimer();
    }

    // Reset game state
    this.resetGameStateCache();
    this.changeDetectorRef.detectChanges();

    // Small delay to prevent blinking
    setTimeout(() => {
      this.initializeBoard(difficulty);

      // Save the new game state immediately after initialization
      this.saveGameState();

      // Ensure minimum loading time
      setTimeout(() => {
        this.isLoading = false;
        this.invalidateGameActiveCache();
        this.changeDetectorRef.detectChanges();
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

  // Check if undo is available (only for non-correct moves)
  canUndo(): boolean {
    if (this.moveHistory.length === 0) {
      return false;
    }

    // Find the last move that can be undone (not a correct number placement)
    for (let i = this.moveHistory.length - 1; i >= 0; i--) {
      const move = this.moveHistory[i];
      if (move.newState !== 'correct') {
        return true;
      }
    }

    return false;
  }

  // Get the number of available undo steps (only non-correct moves)
  getUndoStepsCount(): number {
    return this.moveHistory.filter(move => move.newState !== 'correct').length;
  }

  // Timer event handlers
  onTimerUpdate(elapsedSeconds: number) {
    this.totalGameTime = elapsedSeconds;
    
    // Save game state periodically to keep elapsed time updated
    if (this.boxes && this.boxes.length > 0 && elapsedSeconds % 10 === 0) {
      // Save every 10 seconds to avoid too frequent saves
      this.saveGameState();
    }
  }

  onPauseStateChange(isPaused: boolean) {
    this.isGamePaused = isPaused;
  }



  // Method to toggle notes mode
  toggleNotesMode() {
    this.notesMode = !this.notesMode;
    console.log(`Notes mode ${this.notesMode ? 'enabled' : 'disabled'}`);
    this.saveGameState();
  }

  // Method to toggle number-first mode
  toggleNumberFirstMode() {
    this.numberFirstMode = !this.numberFirstMode;
    // Clear selected number when disabling number-first mode
    if (!this.numberFirstMode) {
      this.selectedNumber = null;
      this.currentNumber = null;
    }
    console.log(`Number-First mode ${this.numberFirstMode ? 'enabled' : 'disabled'}`);
    this.saveGameState();
  }

  // Handler for number pad press-and-hold toggle events
  onNumberPadToggleMode(event: { number: number | null }) {
    console.log('onNumberPadToggleMode called with:', event);

    if (event.number === null) {
      // Turn off number-first mode
      this.numberFirstMode = false;
      this.selectedNumber = null;
      this.currentNumber = null;
      console.log('Number-First mode turned OFF via press-and-hold');
    } else {
      // Turn on number-first mode and set the selected number
      this.numberFirstMode = true;
      this.selectedNumber = event.number;
      this.currentNumber = event.number; // Also set for highlighting consistency
      console.log(`Number-First mode turned ON via press-and-hold with number ${this.selectedNumber}`);
    }

    // Force change detection to ensure UI updates
    this.changeDetectorRef.detectChanges();

    this.saveGameState();

    console.log(`Updated state: numberFirstMode=${this.numberFirstMode}, selectedNumber=${this.selectedNumber}`);
  }

  // Method to fill the currently selected cell with a specific number
  private fillSelectedCellWithNumber(num: number) {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return;
    }

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
      console.error('Cannot fill cell: boxes not properly initialized');
      return;
    }

    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    if (cell.isFixed || cell.state === 'correct') {
      console.log('Cannot edit fixed or correct cell');
      return;
    }

    // Store the previous state for move tracking
    const previousValue = cell.value;
    const previousNotes = [...cell.notes];
    const previousState = cell.state;

    // Check if notes mode is active
    if (this.notesMode) {
      // In notes mode, check if cell can accept notes before toggling
      if (this.canCellAcceptNotes(this.selectedBoxIndex, this.selectedCellIndex)) {
        this.toggleNoteInCell(num);
      }
      // If cell can't accept notes, just return without any action or visual feedback
      return;
    }

    // Calculate global row and column for validation
    const boxRow = Math.floor(this.selectedBoxIndex / 3);
    const boxCol = this.selectedBoxIndex % 3;
    const cellRow = Math.floor(this.selectedCellIndex / 3);
    const cellCol = Math.floor(this.selectedCellIndex % 3);
    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;

    // Store box and cell indices before they get cleared
    const moveBoxIndex = this.selectedBoxIndex;
    const moveCellIndex = this.selectedCellIndex;

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

      // Check if puzzle is complete
      if (this.isPuzzleComplete()) {
        console.log('🏆 Puzzle completed in fillSelectedCellWithNumber!');
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
      this.invalidateGameActiveCache();

      // Check if game over (3 mistakes)
      if (this.mistakeCount >= 3) {
        console.log('Game over - too many mistakes!');
        this.handleGameOver();
        return; // Stop processing the move
      }
    }

    // Record the move for undo functionality
    const move: Move = {
      boxIndex: moveBoxIndex,
      cellIndex: moveCellIndex,
      previousValue,
      previousNotes,
      previousState,
      newValue: cell.value,
      newNotes: [...cell.notes],
      newState: cell.state,
      timestamp: Date.now()
    };

    this.moveHistory.push(move);
    console.log('Move recorded:', move);

    // Limit the undo stack size
    if (this.moveHistory.length > this.MAX_UNDO_STEPS) {
      this.moveHistory.shift(); // Remove oldest move
    }

    // Save game state
    this.saveGameState();

    // Force comprehensive change detection to update the UI immediately
    this.changeDetectorRef.detectChanges();

    // Also trigger board component change detection for cell styling
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Method to fill cell with selected number in number-first mode
  private fillCellWithSelectedNumber() {
    if (this.selectedNumber === null || this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return;
    }

    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
      console.error('Cannot fill cell: boxes not properly initialized');
      return;
    }

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
      // In notes mode, check if cell can accept notes before toggling
      if (this.canCellAcceptNotes(this.selectedBoxIndex, this.selectedCellIndex)) {
        this.toggleNoteInCell(this.selectedNumber);
      }
      // If cell can't accept notes, just return without any action or visual feedback
      return;
    }

    // Calculate global row and column for validation
    const boxRow = Math.floor(this.selectedBoxIndex / 3);
    const boxCol = this.selectedBoxIndex % 3;
    const cellRow = Math.floor(this.selectedCellIndex / 3);
    const cellCol = Math.floor(this.selectedCellIndex % 3);
    const globalRow = boxRow * 3 + cellRow;
    const globalCol = boxCol * 3 + cellCol;

    // Store box and cell indices before they get cleared
    const moveBoxIndex = this.selectedBoxIndex;
    const moveCellIndex = this.selectedCellIndex;

    // Check if the move is valid against the solution
    if (this.solution[globalRow][globalCol] === this.selectedNumber) {
      // Correct move
      cell.value = this.selectedNumber;
      cell.state = 'correct';
      cell.notes = []; // Clear notes when entering correct value

      // Remove conflicting notes from related cells
      this.removeNotesWithNumber(this.selectedNumber);

      // Update score
      this.score += 10;

      // Check if puzzle is complete
      if (this.isPuzzleComplete()) {
        console.log('🏆 Puzzle completed in fillCellWithSelectedNumber (number-first mode)!');
        this.handleVictory();
      }
    } else {
      // Incorrect move
      cell.value = this.selectedNumber;
      cell.state = 'error';
      cell.notes = []; // Clear notes when entering incorrect value

      // Remove conflicting notes from related cells
      this.removeNotesWithNumber(this.selectedNumber);

      // Increment mistake count
      this.mistakeCount++;
      this.invalidateGameActiveCache();

      // Check if game over (3 mistakes)
      if (this.mistakeCount >= 3) {
        console.log('Game over - too many mistakes!');
        this.handleGameOver();
        return; // Stop processing the move
      }
    }

    // Record the move for undo functionality BEFORE clearing highlights
    const move: Move = {
      boxIndex: moveBoxIndex,
      cellIndex: moveCellIndex,
      previousValue,
      previousNotes,
      previousState,
      newValue: cell.value,
      newNotes: [...cell.notes],
      newState: cell.state,
      timestamp: Date.now()
    };

    this.moveHistory.push(move);
    console.log('Number-First Mode move recorded:', move);

    // Limit the undo stack size
    if (this.moveHistory.length > this.MAX_UNDO_STEPS) {
      this.moveHistory.shift(); // Remove oldest move
    }

    // Clear highlights after recording the move
    this.clearCellHighlights();

    // Check if this number is now complete and should be auto-deselected (after clearing highlights)
    if (this.solution[globalRow][globalCol] === this.selectedNumber) {
      const remainingCounts = this.calculateRemainingCounts();
      if (remainingCounts[this.selectedNumber] === 0) {
        console.log(`Number ${this.selectedNumber} completed, auto-deselecting`);
        this.selectedNumber = null;
        this.currentNumber = null;
      }
    }

    // Save game state
    this.saveGameState();

    // Force comprehensive change detection to update the UI immediately
    this.changeDetectorRef.detectChanges();

    // Also trigger board component change detection for cell styling
    if (this.boardComponent) {
      this.boardComponent.detectChanges();
    }
  }

  // Method to reset all notes from the board
  resetNotes() {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    console.log('Resetting all notes from the board');

    // Start timer on first move
    if (this.gameStartTime === null) {
      this.gameStartTime = Date.now();
      console.log('Game timer started');
      // Start the timer component
      if (this.timerComponent) {
        this.timerComponent.startGameTimer();
      }
    }

    // Store the previous state for move tracking (batch operation)
    const moves: Move[] = [];

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0) {
      return;
    }

    this.boxes.forEach((box, boxIndex) => {
      if (!box || !box.cells || box.cells.length === 0) {
        return;
      }

      box.cells.forEach((cell, cellIndex) => {
        if (!cell) {
          return;
        }

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
    this.changeDetectorRef.detectChanges();
  }

  // Undo the last move
  undo() {
    console.log('Sudoku: undo() called, moveHistory length:', this.moveHistory.length);
    if (!this.canUndo()) {
      console.log('No moves to undo');
      return;
    }

    // Find and remove the last undoable move (skip correct moves)
    let lastMove: Move | undefined;
    while (this.moveHistory.length > 0) {
      const move = this.moveHistory.pop();
      if (move && move.newState !== 'correct') {
        lastMove = move;
        break;
      }
      // If it's a correct move, we skip it (effectively removing it from undo history)
    }

    if (!lastMove) {
      console.log('No undoable moves found');
      return;
    }

    console.log('Undoing move:', lastMove);
    console.log('Move history length before undo:', this.moveHistory.length + 1);

    // Restore the previous cell state
    // Safety check: ensure boxes are properly initialized and indices are valid
    console.log('Undo debug - boxes length:', this.boxes?.length, 'lastMove:', lastMove);
    console.log('Undo debug - boxIndex:', lastMove.boxIndex, 'cellIndex:', lastMove.cellIndex);

    if (!this.boxes || this.boxes.length === 0) {
      console.error('Cannot undo: boxes array is empty or null');
      return;
    }

    if (lastMove.boxIndex < 0 || lastMove.boxIndex >= this.boxes.length) {
      console.error('Cannot undo: invalid boxIndex', lastMove.boxIndex);
      return;
    }

    if (!this.boxes[lastMove.boxIndex] || !this.boxes[lastMove.boxIndex].cells) {
      console.error('Cannot undo: box or cells array is null at index', lastMove.boxIndex);
      return;
    }

    if (lastMove.cellIndex < 0 || lastMove.cellIndex >= this.boxes[lastMove.boxIndex].cells.length) {
      console.error('Cannot undo: invalid cellIndex', lastMove.cellIndex);
      return;
    }

    if (!this.boxes[lastMove.boxIndex].cells[lastMove.cellIndex]) {
      console.error('Cannot undo: cell is null at boxIndex', lastMove.boxIndex, 'cellIndex', lastMove.cellIndex);
      return;
    }

    const cell = this.boxes[lastMove.boxIndex].cells[lastMove.cellIndex];
    cell.value = lastMove.previousValue;
    cell.notes = [...lastMove.previousNotes];
    cell.state = lastMove.previousState as 'normal' | 'correct' | 'error' | 'highlight';

    // Update score if needed (reverse the score change)
    if (lastMove.newState === 'correct' && lastMove.previousState !== 'correct') {
      this.score = Math.max(0, this.score - 10); // Remove points for correct move
    } else if (lastMove.newState === 'error' && lastMove.previousState !== 'error') {
      this.score += 5; // Add back points for incorrect move
      // Note: Mistake count is NOT decremented - mistakes should only increase
    }

    // Clear current selection and number
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;

    // Also clear selected number in Number-First Mode to avoid confusion
    // But only if that number is no longer available
    if (this.selectedNumber !== null) {
      const remainingCounts = this.calculateRemainingCounts();
      if (remainingCounts[this.selectedNumber] === 0) {
        this.selectedNumber = null;
      }
    }

    // Save game state
    this.saveGameState();

    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();

    console.log('Move undone successfully');
  }

    // Handle game over when mistake limit is reached
  private handleGameOver() {
    console.log('Game Over - mistake limit reached!');

    // Prepare game over statistics
    this.gameOverStats = {
      mistakeCount: this.mistakeCount,
      finalTime: this.timerComponent ? this.timerComponent.getCurrentFormattedTime() : '00:00',
      finalScore: this.score,
      difficulty: this.getCurrentDifficulty()
    };

    // Show game over dialog
    this.showGameOverDialog = true;
    
    // Pause the timer
    if (this.timerComponent) {
      this.timerComponent.pauseTimer();
    }
  }

  // Handle game over dialog actions
  onGameOverResetGame(): void {
    this.showGameOverDialog = false;
    this.gameOverStats = null;
    this.resetGame();
  }

  onGameOverNewGame(difficulty: GameDifficulty): void {
    this.showGameOverDialog = false;
    this.gameOverStats = null;
    this.onNewGame(difficulty);
  }

  onGameOverClose(): void {
    this.showGameOverDialog = false;
    this.gameOverStats = null;
    // Don't restart the game, just close the dialog
  }

  // Handle congratulations dialog actions
  onCongratulationsResetGame(): void {
    this.showCongratulationsDialog = false;
    this.congratulationsStats = null;
    this.resetGame();
  }

  onCongratulationsNewGame(difficulty: GameDifficulty): void {
    this.showCongratulationsDialog = false;
    this.congratulationsStats = null;
    this.onNewGame(difficulty);
  }

  onCongratulationsClose(): void {
    this.showCongratulationsDialog = false;
    this.congratulationsStats = null;
    // Don't restart the game, just close the dialog
  }

  // Handle victory when puzzle is completed
  private handleVictory() {
    console.log('🎉 Victory! Puzzle completed!');
    
    // Invalidate game state cache since the game is now won
    this.invalidateGameActiveCache();
    
    // Pause the timer when puzzle is completed
    if (this.timerComponent) {
      this.timerComponent.pauseTimer();
      console.log('⏱️ Timer paused');
    }

    // Prepare congratulations statistics
    this.congratulationsStats = {
      timeTaken: this.timerComponent ? this.timerComponent.getCurrentFormattedTime() : '00:00',
      difficulty: this.getCurrentDifficulty(),
      mistakeCount: this.mistakeCount // Display actual mistakes made
    };

    // Show congratulations dialog
    this.showCongratulationsDialog = true;
    
    // Save the completed game state
    this.saveGameState();
  }

  // Navigate between cells using arrow keys
  private navigateWithArrowKeys(key: string) {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;

    let newBoxIndex = this.selectedBoxIndex;
    let newCellIndex = this.selectedCellIndex;

    switch (key) {
      case 'ArrowUp':
        if (newCellIndex >= 3) {
          newCellIndex -= 3;
        } else if (newBoxIndex >= 3) {
          newBoxIndex -= 3;
          newCellIndex += 6;
        }
        break;
      case 'ArrowDown':
        if (newCellIndex < 6) {
          newCellIndex += 3;
        } else if (newBoxIndex < 6) {
          newBoxIndex += 3;
          newCellIndex -= 6;
        }
        break;
      case 'ArrowLeft':
        if (newCellIndex % 3 > 0) {
          newCellIndex--;
        } else if (newBoxIndex % 3 > 0) {
          newBoxIndex--;
          newCellIndex += 2;
        }
        break;
      case 'ArrowRight':
        if (newCellIndex % 3 < 2) {
          newCellIndex++;
        } else if (newBoxIndex % 3 < 2) {
          newBoxIndex++;
          newCellIndex -= 2;
        }
        break;
    }

    // Ensure the new position is valid
    if (newBoxIndex >= 0 && newBoxIndex < 9 && newCellIndex >= 0 && newCellIndex < 9) {
      this.selectedBoxIndex = newBoxIndex;
      this.selectedCellIndex = newCellIndex;

      // Force change detection to update highlights
      this.changeDetectorRef.detectChanges();
    }
  }

  // Centralized method to check if a cell can accept notes
  private canCellAcceptNotes(boxIndex: number, cellIndex: number): boolean {
    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[boxIndex] ||
        !this.boxes[boxIndex].cells ||
        !this.boxes[boxIndex].cells[cellIndex]) {
      return false;
    }

    const cell = this.boxes[boxIndex].cells[cellIndex];
    
    // Cannot add notes to fixed cells or cells that are already correct
    return !(cell.isFixed || cell.state === 'correct');
  }

  // Method to toggle a note in the selected cell
  private toggleNoteInCell(num: number) {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    // Start timer on first move
    if (this.gameStartTime === null) {
      this.gameStartTime = Date.now();
      console.log('Game timer started');
      // Start the timer component
      if (this.timerComponent) {
        this.timerComponent.startGameTimer();
      }
    }

    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;

    // Check if the selected cell can accept notes using centralized validation
    if (!this.canCellAcceptNotes(this.selectedBoxIndex, this.selectedCellIndex)) {
      console.log('Cannot add notes to fixed or correct cell');
      return;
    }

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
      console.error('Cannot toggle note: boxes not properly initialized');
      return;
    }

    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];

    // Store box and cell indices before any potential clearing
    const moveBoxIndex = this.selectedBoxIndex;
    const moveCellIndex = this.selectedCellIndex;

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
      boxIndex: moveBoxIndex,
      cellIndex: moveCellIndex,
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
    this.changeDetectorRef.detectChanges();
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
    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0) {
      return;
    }

    this.boxes.forEach((box, boxIndex) => {
      if (!box || !box.cells || box.cells.length === 0) {
        return;
      }

      box.cells.forEach((cell, cellIndex) => {
        if (!cell) {
          return;
        }

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

    // Get the selected cell for dock highlighting logic
    const selectedCell = this.boxes[event.boxIndex]?.cells[event.cellIndex];

    // In number-first mode, if a number is selected, auto-fill the cell
    if (this.numberFirstMode && this.selectedNumber !== null && event.isEditable) {
      console.log(`Auto-filling cell with selected number ${this.selectedNumber} in Number-First mode`);
      this.fillCellWithSelectedNumber();
      return;
    }

    // Highlight the dock number if the selected cell has a value (works in both modes)
    if (selectedCell && selectedCell.value && selectedCell.value >= 1 && selectedCell.value <= 9) {
      // Set currentNumber to highlight the corresponding dock number
      this.currentNumber = selectedCell.value;
      console.log(`Highlighting dock number ${selectedCell.value} for selected cell (mode: ${this.numberFirstMode ? 'number-first' : 'normal'})`);
    } else {
      // Clear current number if cell is empty
      this.currentNumber = null;
      console.log('Clearing dock number highlight - empty cell selected');
    }

    console.log('Selection updated:', {
      boxIndex: this.selectedBoxIndex,
      cellIndex: this.selectedCellIndex,
      isEditable: event.isEditable,
      currentNumber: this.currentNumber,
      mode: this.numberFirstMode ? 'number-first' : 'normal'
    });
  }

  clearHighlights() {
    // Clear cell selection and current number to remove all highlights
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;

    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Clear all highlights including number-first mode selection
   * This method is used when clicking outside the board or when explicitly clearing all highlights
   */
  clearAllHighlights() {
    // Clear cell selection and current number
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;
    
    // Clear selected number in number-first mode to remove all highlighting
    this.selectedNumber = null;

    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Clear highlights while preserving number-first mode selection
   * This method is used for internal game logic where we want to keep the selected number
   */
  clearCellHighlights() {
    // Clear cell selection and current number to remove cell-level highlights
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;

    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();
  }

  // Manual event listener for clicks outside the board
  private documentClickHandler = (event: Event) => {
    console.log('Document click detected, sudokuContainer:', this.sudokuContainer);
    if (this.sudokuContainer && !this.sudokuContainer.nativeElement.contains(event.target as Node)) {
      console.log('Click outside detected, clearing highlights');
      this.clearAllHighlights();
    }
  };

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    // Number keys 1–9 - always work for number input
    if (/^[1-9]$/.test(event.key)) {
      // If no cell is selected, just highlight the number
      if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
        this.currentNumber = parseInt(event.key, 10);
        console.log('Number highlighted:', this.currentNumber);
        // Force change detection to update highlights
        if (this.boardComponent) {
          this.boardComponent.detectChanges();
        }
        return;
      }

      this.onNumberPadClick(parseInt(event.key, 10));
    }
    // Backspace or Delete clears the cell
    else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (this.selectedBoxIndex === null || this.selectedCellIndex === null) return;
      this.clearCell();
    }
    // Escape key clears highlights
    else if (event.key === 'Escape') {
      this.clearAllHighlights();
    }
    // Space key toggles notes mode
    else if (event.key === ' ') {
      event.preventDefault(); // Prevent page scroll
      this.toggleNotesMode();
    }
    // Arrow keys for navigation (optional enhancement)
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      this.navigateWithArrowKeys(event.key);
    }
  }


  initializeBoard(difficulty?: 'test' | 'easy' | 'medium' | 'hard' | 'expert') {
    console.log(`initializeBoard called with difficulty: ${difficulty}, Type: ${typeof difficulty}`);
    
    // Clear current number and selection when initializing new board
    this.currentNumber = null;
    this.selectedNumber = null;
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;

    // 1. Generate solved board and store the solution for validation
    const solvedBoard = this.generateSolvedBoard();
    this.solution = solvedBoard.map(row => [...row]); // deep copy

    // 2. Create puzzle from solved board
    const puzzle = this.createPuzzleFromSolved(solvedBoard, difficulty);
    this.currentDifficulty = difficulty || 'test';

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

    // 6. Invalidate game active cache since boxes are now initialized
    this.invalidateGameActiveCache();
  }

  private generateSudokuPuzzle(difficulty?: 'test' | 'easy' | 'medium' | 'hard' | 'expert'): number[][] {
    // Start with a solved Sudoku board
    const solvedBoard = this.generateSolvedBoard();

    // Remove numbers based on difficulty to create the puzzle
    return this.createPuzzleFromSolved(solvedBoard, difficulty);
  }

  private generateSolvedBoard(): number[][] {
    // Initialize empty 9x9 board
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill the first row with numbers 1–9 in random order
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.shuffleArray(numbers);
    for (let i = 0; i < 9; i++) {
      board[0][i] = numbers[i];
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
          // Try numbers 1-9 in random order for more varied solutions
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          this.shuffleArray(numbers);

          for (const num of numbers) {
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

  /**
   * Shuffles array in place using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Test method to verify unique puzzle generation
   * This method can be called from browser console for testing
   */
  public testUniquePuzzleGeneration() {
    console.log('Testing unique puzzle generation...');
    const boards: string[] = [];

    for (let i = 0; i < 5; i++) {
      const board = this.generateSolvedBoard();
      const boardString = board.map(row => row.join('')).join('');
      boards.push(boardString);
      console.log(`Board ${i + 1} first row:`, board[0]);
    }

    const uniqueBoards = new Set(boards);
    console.log(`Generated ${boards.length} boards, ${uniqueBoards.size} unique`);

    if (uniqueBoards.size === boards.length) {
      console.log('✅ SUCCESS: All generated boards are unique!');
    } else {
      console.log('❌ WARNING: Some boards were duplicated');
    }
  }

  private createPuzzleFromSolved(
    solvedBoard: number[][],
    difficulty: 'test' | 'easy' | 'medium' | 'hard' | 'expert' = 'test'
  ): number[][] {
    console.log(`createPuzzleFromSolved called with difficulty: ${difficulty}, Type: ${typeof difficulty}`);
    
    // Copy the solved board
    const puzzle = solvedBoard.map(row => [...row]);

    // Number of cells to remove based on difficulty
    const difficultyMap: Record<string, number> = {
      'test': 1,
      'easy': 30,
      'medium': 40,
      'hard': 50,
      'expert': 60
    };
    
    // Ensure difficulty is a valid string key
    const validDifficulty = difficulty && typeof difficulty === 'string' ? difficulty : 'test';
    const cellsToRemove = difficultyMap[validDifficulty] ?? 45;
    console.log(`Cells to remove: ${cellsToRemove} (difficulty: ${validDifficulty}, original: ${difficulty})`);

    // Generate list of positions (0–80)
    const positions = Array.from({ length: 81 }, (_, i) => i);

    // Shuffle positions using our new shuffleArray method
    this.shuffleArray(positions);

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
    // Use the same logic as isGameWon to ensure consistency
    return this.isGameWon();
  }

  // Check if the game is won (all non-fixed cells are correct)
  private isGameWon(): boolean {
    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0) {
      return false;
    }

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const box = this.boxes[boxIndex];
      if (!box || !box.cells || box.cells.length === 0) {
        return false;
      }

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = box.cells[cellIndex];
        if (!cell || (!cell.isFixed && (!cell.value || cell.state !== 'correct'))) {
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
    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0) {
      return;
    }

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const box = this.boxes[boxIndex];
      if (!box || !box.cells || box.cells.length === 0) {
        continue;
      }

      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        const cell = box.cells[cellIndex];
        if (!cell) {
          continue;
        }

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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[boxIndex] ||
        !this.boxes[boxIndex].cells ||
        !this.boxes[boxIndex].cells[cellIndex]) {
      console.warn(`Cell at row ${row}, col ${col} not found`);
      return;
    }

    const box = this.boxes[boxIndex];

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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
      console.error('Cannot clear cell: boxes not properly initialized');
      return;
    }

    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];

    // Store box and cell indices before any potential clearing
    const moveBoxIndex = this.selectedBoxIndex;
    const moveCellIndex = this.selectedCellIndex;

    // Start timer on first move
    if (this.gameStartTime === null) {
      this.gameStartTime = Date.now();
      console.log('Game timer started');
      // Start the timer component
      if (this.timerComponent) {
        this.timerComponent.startGameTimer();
      }
    }

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
      boxIndex: moveBoxIndex,
      cellIndex: moveCellIndex,
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
    this.changeDetectorRef.detectChanges();

    // Save game state after clearing
    this.saveGameState();
  }

  resetGame() {
    console.log('Resetting game...');
    this.isLoading = true;
    this.selectedBoxIndex = null;
    this.selectedCellIndex = null;
    this.currentNumber = null;
    this.selectedNumber = null; // Reset selected number for number-first mode
    this.mistakeCount = 0; // Reset mistake count
    this.score = 0; // Reset score

    // Reset game over dialog state
    this.showGameOverDialog = false;
    this.gameOverStats = null;

    // Reset congratulations dialog state
    this.showCongratulationsDialog = false;
    this.congratulationsStats = null;

    // Clear move history for reset game
    this.moveHistory = [];

        // Reset timer for reset game
    this.gameStartTime = null;
    this.totalGameTime = 0;
    this.isGamePaused = false;

    // Reset the timer component
    if (this.timerComponent) {
      this.timerComponent.resetGameTimer();
    }

    // Reset game state
    this.invalidateGameActiveCache();
    this.changeDetectorRef.detectChanges();

    // Reset all non-fixed cells to their initial state
    // Safety check: ensure boxes are properly initialized
    if (this.boxes && this.boxes.length > 0) {
      this.boxes.forEach(box => {
        if (box && box.cells && box.cells.length > 0) {
          box.cells.forEach(cell => {
            if (cell && !cell.isFixed) {
              cell.value = null;
              cell.notes = [];
              cell.state = 'normal';
            }
          });
        }
      });
    }

    // Save the reset game state instead of clearing it
    this.saveGameState();

    // Small delay to prevent blinking
    setTimeout(() => {
      this.isLoading = false;
      this.invalidateGameActiveCache();
      this.changeDetectorRef.detectChanges();
    }, 150);
  }

  // Calculate remaining count for each number (1-9)
  calculateRemainingCounts(): { [key: number]: number } {
    const counts: { [key: number]: number } = {};

    // Initialize counts - each number should appear 9 times in a complete sudoku
    for (let i = 1; i <= 9; i++) {
      counts[i] = 9;
    }

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0) {
      return counts;
    }

    // Count how many times each number is already placed on the board
    this.boxes.forEach(box => {
      if (!box || !box.cells || box.cells.length === 0) {
        return;
      }

      box.cells.forEach(cell => {
        if (cell && cell.value !== null && cell.value >= 1 && cell.value <= 9) {
          counts[cell.value]--;
        }
      });
    });

    // Ensure counts don't go below 0
    for (let i = 1; i <= 9; i++) {
      counts[i] = Math.max(0, counts[i]);
    }

    return counts;
  }

  // Called when user clicks number on dock number pad
  onNumberPadClick(num: number) {
    // Check if game is still active
    if (!this.isGameActive()) {
      console.log('Game is not active - cannot make moves');
      return;
    }

    // Start timer on first move
    if (this.gameStartTime === null) {
      this.gameStartTime = Date.now();
      console.log('Game timer started');
      // Start the timer component
      if (this.timerComponent) {
        this.timerComponent.startGameTimer();
      }
    }

    // Handle number-first mode
    if (this.numberFirstMode) {
      // In number-first mode, clicking a number selects it and clears board selection
      this.selectedNumber = num;
      this.currentNumber = num; // Also set for highlighting consistency
      this.clearBoardSelection(); // Clear board selection to show only dock highlight
      console.log(`Selected number ${num} in Number-First mode - board selection cleared`);
      this.saveGameState();
      this.changeDetectorRef.detectChanges();
      return;
    }

    // Set the current number for highlighting
    this.currentNumber = num;

    // If a cell is selected and it's editable, fill it with the clicked number
    if (this.selectedBoxIndex !== null && this.selectedCellIndex !== null) {
      // Safety check: ensure boxes are properly initialized
      if (!this.boxes || this.boxes.length === 0 ||
          !this.boxes[this.selectedBoxIndex] ||
          !this.boxes[this.selectedBoxIndex].cells ||
          !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
        console.error('Cannot fill cell: boxes not properly initialized');
        return;
      }

      const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];

      // Check if cell is editable
      if (!cell.isFixed && cell.state !== 'correct') {
        console.log(`Filling selected cell with number ${num}`);
        this.fillSelectedCellWithNumber(num);
        return;
      } else {
        console.log('Selected cell is not editable (fixed or correct)');
        // Clear selection since we can't fill this cell
        this.clearBoardSelection();
      }
    } else {
      // No cell selected, clear any existing selection
      this.clearBoardSelection();
    }

    // Just highlight the number
    console.log(`Highlighting number ${num} from dock`);

    // Force change detection to update highlights
    this.changeDetectorRef.detectChanges();
  }

    // Provide a hint by revealing the correct number for the selected cell
  public provideHint(): void {
    if (this.selectedBoxIndex === null || this.selectedCellIndex === null) {
      return;
    }

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
      console.error('Cannot provide hint: boxes not properly initialized');
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
    this.clearCellHighlights();

    // Update score (hints give fewer points)
    this.score += 5;

    // Save game state
    this.saveGameState();

    // Force change detection
    this.changeDetectorRef.detectChanges();
  }

  // Check if the game is over (too many mistakes)
  public isGameOver(): boolean {
    const isOver = this.mistakeCount >= 3;
    return isOver;
  }

  // Cached getter for template use to prevent repeated calculations
  public get isGameOverCached(): boolean {
    if (this._cachedGameOver === false) {
      this._cachedGameOver = this.isGameOver();
    }
    return this._cachedGameOver;
  }

  // Check if the game is active (not over and not won)
  public isGameActive(): boolean {
    // During change detection cycles, use a more stable approach
    try {
      // Create a snapshot of current relevant state
      const currentState = {
        isLoading: this.isLoading,
        boxesLength: this.boxes?.length || 0,
        mistakeCount: this.mistakeCount
      };

      // Check if state has changed since last call
      const stateChanged = JSON.stringify(currentState) !== JSON.stringify(this._gameActiveLastCheck);

      if (!stateChanged) {
        return this._cachedIsGameActive;
      }

      // Update last check state
      this._gameActiveLastCheck = { ...currentState };

      // If still loading, assume game is active to prevent blocking initialization
      if (this.isLoading) {
        this._cachedIsGameActive = true;
        return this._cachedIsGameActive;
      }

      // If boxes are not initialized yet, assume game is active (during initialization)
      // This prevents the circular dependency issue where isGameActive blocks initialization
      if (!this.boxes || this.boxes.length === 0) {
        this._cachedIsGameActive = true;
        return this._cachedIsGameActive;
      }

      // Use cached values to avoid repeated calculations
      if (this._cachedGameOver === false) {
        this._cachedGameOver = this.isGameOver();
      }
      if (this._cachedGameWon === false) {
        this._cachedGameWon = this.hasWonGame();
      }

      // A game is active if:
      // 1. It's not over due to mistakes (gameOver = false)
      // 2. It's not won yet (gameWon = false) - meaning the puzzle is still being solved
      const isActive = !this._cachedGameOver && !this._cachedGameWon;

      this._cachedIsGameActive = isActive;
      return this._cachedIsGameActive;
    } catch (error) {
      // Fallback in case of any errors during change detection
      console.warn('Error in isGameActive, using cached value:', error);
      return this._cachedIsGameActive;
    }
  }

  // Cached getter for controls availability to prevent repeated calculations
  public get areControlsAvailableCached(): boolean {
    if (this._cachedControlsAvailable === null) {
      // Controls are available unless there are too many mistakes (game over)
      // They remain available even after winning to allow starting a new game
      this._cachedControlsAvailable = !this.isLoading && !this.isGameOverCached;
    }
    return this._cachedControlsAvailable!; // Non-null assertion since we set it above
  }

  // Cached getter for reset disabled state to prevent repeated calculations
  public get isResetDisabledCached(): boolean {
    if (this._cachedResetDisabled === null) {
      // Reset is disabled when the game is completed (won)
      // This prevents resetting a completed puzzle and forces starting a new game instead
      this._cachedResetDisabled = this.hasWonGameCached;
    }
    return this._cachedResetDisabled!; // Non-null assertion since we set it above
  }

  // Check if the game is won
  public hasWonGame(): boolean {
    // If boxes are not initialized yet, game cannot be won
    if (!this.boxes || this.boxes.length === 0) {
      return false;
    }
    return this.isGameWon();
  }

  // Cached getter for template use to prevent repeated calculations
  public get hasWonGameCached(): boolean {
    if (this._cachedGameWon === false) {
      this._cachedGameWon = this.hasWonGame();
    }
    return this._cachedGameWon;
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

    // Safety check: ensure boxes are properly initialized  
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[boxIndex] ||
        !this.boxes[boxIndex].cells ||
        !this.boxes[boxIndex].cells[cellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
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

    // Safety check: ensure boxes are properly initialized
    if (!this.boxes || this.boxes.length === 0 ||
        !this.boxes[this.selectedBoxIndex] ||
        !this.boxes[this.selectedBoxIndex].cells ||
        !this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex]) {
      return 'normal';
    }

    const cell = this.boxes[this.selectedBoxIndex].cells[this.selectedCellIndex];
    return cell.state;
  }


}
