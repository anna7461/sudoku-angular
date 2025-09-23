import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anna.sudoku',
  appName: 'Sudoku',
  webDir: 'dist/sudoku-angular/browser',
  server: {
    url: 'http://192.168.86.35:4200',
    cleartext: true,
  }
};

export default config;
