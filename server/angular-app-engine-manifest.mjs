
export default {
  basePath: 'http://anna7461.github.io/sudoku-angular',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
