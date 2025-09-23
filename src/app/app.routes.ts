import { Routes } from '@angular/router';
import { DashboardComponent } from './sudoku/components/dashboard/dashboard.component';
import { SudokuComponent } from './sudoku/sudoku.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'sudoku', component: SudokuComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: '**', redirectTo: '' }
];
