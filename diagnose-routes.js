// diagnose-routes.js
import express from 'express';

// Create a test app to see how routes are registered
const testApp = express();

// Load your nhlRoutes
import nhlRoutes from './routes/nhlRoutes.js';
testApp.use('/api/nhl', nhlRoutes);

// Function to print all registered routes
function printRoutes(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(printRoutes.bind(null, path.concat(split(layer.route.path))));
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(printRoutes.bind(null, path.concat(split(layer.regexp))));
  } else if (layer.method) {
    console.log('%s /%s',
      layer.method.toUpperCase(),
      path.concat(split(layer.regexp)).filter(Boolean).join('/'));
  }
}

function split(thing) {
  if (typeof thing === 'string') {
    return thing.split('/');
  } else if (thing.fast_slash) {
    return '';
  } else {
    const match = thing.toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '$')
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
    return match ? match[1].replace(/\\(.)/g, '$1').split('/') : '<complex:' + thing.toString() + '>';
  }
}

console.log('🔍 Registered NHL Routes:');
testApp._router.stack.forEach(printRoutes.bind(null, []));
