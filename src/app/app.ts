import { Component, signal } from '@angular/core';
import {SudokuComponent} from './sudoku/sudoku.component';

@Component({
  selector: 'app-root',
  imports: [SudokuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sudoku-angular');
}
