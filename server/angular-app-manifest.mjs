
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/sudoku-angular/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/sudoku-angular"
  },
  {
    "renderMode": 2,
    "route": "/sudoku-angular/sudoku"
  },
  {
    "renderMode": 2,
    "route": "/sudoku-angular/privacy-policy"
  },
  {
    "renderMode": 2,
    "redirectTo": "/sudoku-angular",
    "route": "/sudoku-angular/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 9740, hash: '497d87a4d380f0f8dddfb7dce29408ac7ba37bb3fa6b291ea4e195c9c8cbc5e3', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 5839, hash: '0522368b705aa95dab2abade060a4a76cc6a5ac55c67cbbf290b074edf470252', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'privacy-policy/index.html': {size: 21683, hash: 'cb850c5e8b3580b26e4f7a8a6e1c9e27d2dd61677073f75b8ba58493d2ab647c', text: () => import('./assets-chunks/privacy-policy_index_html.mjs').then(m => m.default)},
    'index.html': {size: 40583, hash: '32f0080c498d1ec37fb0d3255f03e7551ee705c3d3b2675edc67784c0d5d0a77', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'sudoku/index.html': {size: 70475, hash: 'fd8347c814fbc9835e25cd86906432e2ea3b9d9026fb086a45c25bd0751c44a7', text: () => import('./assets-chunks/sudoku_index_html.mjs').then(m => m.default)},
    'styles-HIEEB3I5.css': {size: 16791, hash: 'IzWnArSIrNA', text: () => import('./assets-chunks/styles-HIEEB3I5_css.mjs').then(m => m.default)}
  },
};
