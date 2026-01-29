import('./routes/authRoutes.js')
  .then(module => {
    console.log('Module loaded successfully');
    console.log('Default export type:', typeof module.default);
    console.log('Is function?', typeof module.default === 'function');
    console.log('Is router?', module.default.name === 'router' || 
               (module.default._router && typeof module.default._router === 'function'));
  })
  .catch(error => {
    console.error('Import error:', error);
  });
