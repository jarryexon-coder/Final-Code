import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('server.js', 'utf8');

// Find the secret phrase log-event route
const routeStart = content.indexOf("secretPhraseRouter.post('/log-event'");
if (routeStart === -1) {
  console.log('❌ Could not find log-event route');
  process.exit(1);
}

// Extract the route to see current code
const routeEnd = content.indexOf('}', content.indexOf('}', routeStart + 100) + 1) + 1;
const routeCode = content.substring(routeStart, routeEnd);

console.log('Current route code snippet:');
console.log(routeCode.substring(0, 500) + '...');

// Check if the save code has proper error handling
if (!routeCode.includes('global.isMongoConnected')) {
  // We need to add better error handling
  console.log('Adding better MongoDB connection checking...');
  
  // Find the database save section
  const saveCodeStart = routeCode.indexOf('const db = mongoose.connection.db');
  if (saveCodeStart !== -1) {
    const beforeSave = routeCode.substring(0, saveCodeStart);
    const afterSave = routeCode.substring(saveCodeStart);
    
    const fixedSaveCode = beforeSave + `
    // ✅ Check MongoDB connection before saving
    if (!global.isMongoConnected || !mongoose.connection.db) {
      console.warn('⚠️  MongoDB not connected, skipping database save');
    } else {
      try {
        const db = mongoose.connection.db;
        console.log('💾 Saving secret phrase to MongoDB...');
        
        // Save to analyticsevents collection
        await db.collection('analyticsevents').insertOne(event);
        console.log('✅ Secret phrase saved to analyticsevents:', event._id.toString());
        
        // Also save to dedicated collection
        await db.collection('secretphraseanalytics').insertOne({
          ...event,
          eventId: event._id.toString()
        });
        console.log('✅ Also saved to secretphraseanalytics collection');
        
      } catch (dbError) {
        console.error('❌ Database save error:', dbError.message);
      }
    }
    ` + afterSave.substring(afterSave.indexOf('} catch (dbError)'));
    
    // Replace the route in the main content
    const newContent = content.substring(0, routeStart) + fixedSaveCode + content.substring(routeEnd);
    writeFileSync('server.js', newContent);
    console.log('✅ Updated save code with connection checking');
  }
}
