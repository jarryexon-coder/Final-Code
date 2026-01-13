const { execSync } = require('child_process');

console.log("Checking gcp-metadata dependencies...");

try {
  // Check why firebase-admin is using old version
  const result = execSync('npm why gcp-metadata', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.error(error.message);
}
