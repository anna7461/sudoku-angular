import { Routes } from '@angular/router';
import { DashboardComponent } from './sudoku/components/dashboard/dashboard.component';
import { SudokuComponent } from './sudoku/sudoku.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'sudoku', component: SudokuComponent },
  { path: '**', redirectTo: '' }
];
