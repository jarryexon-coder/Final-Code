import fs from 'fs/promises';

async function checkRoute() {
  const content = await fs.readFile('server.js', 'utf8');
  
  // Find the route
  const routeStart = content.indexOf("secretPhraseRouter.post('/log-event'");
  if (routeStart === -1) {
    console.log('❌ Could not find log-event route');
    return;
  }
  
  // Show 30 lines starting from the route
  const lines = content.split('\n');
  let routeLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("secretPhraseRouter.post('/log-event'")) {
      routeLine = i;
      break;
    }
  }
  
  if (routeLine === -1) {
    console.log('❌ Route not found');
    return;
  }
  
  console.log('📝 Current route (lines ' + (routeLine + 1) + ' to ' + (routeLine + 30) + '):\n');
  for (let i = routeLine; i < Math.min(routeLine + 30, lines.length); i++) {
    console.log((i + 1) + ':', lines[i]);
  }
}

await checkRoute();
