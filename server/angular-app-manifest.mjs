
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'http://anna7461.github.io/sudoku-angular/',
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
    "redirectTo": "/sudoku-angular",
    "route": "/sudoku-angular/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 9765, hash: '6c3cd0b95c724ed837568510a4b9994fd0d621d5d521e586ffacb8c790e3ba4c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 5864, hash: 'b989eed23e123f3fd04733558e28ae04f5013f9013b4ac9976cde7a2978215a6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 40608, hash: '3bd611b2d7d5bec4ee415c2f9559fac5002a5f306f82e775c3cc647a3094798d', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'sudoku/index.html': {size: 69908, hash: '85f513bd2adfd1af0869bb1331b6a26a472481820b9d63363ef391964cf9ce5a', text: () => import('./assets-chunks/sudoku_index_html.mjs').then(m => m.default)},
    'styles-HIEEB3I5.css': {size: 16791, hash: 'IzWnArSIrNA', text: () => import('./assets-chunks/styles-HIEEB3I5_css.mjs').then(m => m.default)}
  },
};
