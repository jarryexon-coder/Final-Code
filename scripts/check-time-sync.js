// scripts/check-time-sync.js
console.log('🕒 CHECKING TIME SYNCHRONIZATION');
console.log('================================\n');

const now = new Date();
const serverTime = now.getTime();
const serverSeconds = Math.floor(serverTime / 1000);

console.log('1. Server Time:');
console.log('   Local:', now.toString());
console.log('   ISO:', now.toISOString());
console.log('   Timestamp (ms):', serverTime);
console.log('   Timestamp (seconds):', serverSeconds);

// Create a JWT to see what time it uses
const jwt = require('jsonwebtoken');
const testToken = jwt.sign({ test: 'time' }, 'secret', { expiresIn: '1h' });
const decoded = jwt.decode(testToken);

console.log('\n2. JWT Token Time:');
console.log('   iat (issued at):', decoded.iat);
console.log('   iat as Date:', new Date(decoded.iat * 1000).toString());
console.log('   Difference from server (seconds):', decoded.iat - serverSeconds);

// Check against NTP time (approximate)
console.log('\n3. Time Comparison:');
console.log('   Server time:', now.toISOString());

// Calculate if there's a significant drift
const driftSeconds = Math.abs(decoded.iat - serverSeconds);
console.log('   Time drift:', driftSeconds, 'seconds');

if (driftSeconds > 60) {
  console.log('\n⚠️  WARNING: Significant time drift detected!');
  console.log('   Drift:', driftSeconds / 60, 'minutes');
  console.log('\n💡 Solutions:');
  console.log('   1. Sync server time: sudo ntpdate pool.ntp.org');
  console.log('   2. Or use JWT with clock tolerance');
} else if (driftSeconds > 10) {
  console.log('\n⚠️  Notice: Small time drift detected');
  console.log('   Consider syncing time for production');
} else {
  console.log('\n✅ Time is synchronized correctly');
}
