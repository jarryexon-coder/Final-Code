#!/usr/bin/env node
const http = require('http');

function fetchJSON(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ success: false });
        }
      });
    });
    
    req.on('error', () => resolve({ success: false }));
    req.end();
  });
}

async function displayInsights() {
  console.clear();
  console.log('📊 ANALYTICS INSIGHTS DASHBOARD');
  console.log('================================\n');
  
  const dashboard = await fetchJSON('/api/analytics/dashboard');
  
  if (!dashboard.success) {
    console.log('❌ Could not fetch dashboard');
    return;
  }
  
  const data = dashboard.data;
  
  // Overview
  console.log('📈 OVERVIEW');
  console.log('-----------');
  console.log(`Total Users:      ${data.overview.totalUsers}`);
  console.log(`Active Users:     ${data.overview.activeUsers} (last 7 days)`);
  console.log(`24h Events:       ${data.overview.totalEvents}`);
  console.log(`Conversion Rate:  ${data.overview.conversionRate}%\n`);
  
  // Popular Screens
  console.log('📱 POPULAR SCREENS');
  console.log('------------------');
  if (data.popularScreens && data.popularScreens.length > 0) {
    data.popularScreens.forEach((screen, i) => {
      const name = screen._id === null ? 'Unknown' : screen._id;
      const bar = '█'.repeat(Math.ceil(screen.count / 2));
      console.log(`${String(i+1).padStart(2)}. ${name.padEnd(15)} ${bar} ${screen.count}`);
    });
  } else {
    console.log('No screen data available\n');
  }
  
  // Retention
  console.log('📅 USER RETENTION');
  console.log('-----------------');
  data.retention.forEach((day) => {
    console.log(`${day.day.padEnd(6)}: ${'█'.repeat(day.rate / 5)} ${day.rate}%`);
  });
  
  console.log('\n🔄 Last Updated:', new Date().toLocaleTimeString());
  console.log('Press Ctrl+C to exit\n');
}

// Refresh every 10 seconds
displayInsights();
setInterval(displayInsights, 10000);
