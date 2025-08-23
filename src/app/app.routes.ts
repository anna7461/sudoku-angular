import { Routes } from '@angular/router';
import { DashboardComponent } from './sudoku/components/dashboard/dashboard.component';
import { SudokuComponent } from './sudoku/sudoku.component';
import { ArcadeRoadmapComponent } from './sudoku/components/arcade-roadmap/arcade-roadmap.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'sudoku', component: SudokuComponent },
  { path: 'arcade', component: ArcadeRoadmapComponent },
  { path: 'arcade/play', component: SudokuComponent },
  { path: '**', redirectTo: '' }
];
