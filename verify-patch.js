import fs from 'fs/promises';

async function checkPatch() {
  const content = await fs.readFile('server.js', 'utf8');
  
  // Find the log-event route
  const routeStart = content.indexOf("secretPhraseRouter.post('/log-event'");
  if (routeStart === -1) {
    console.log('❌ Could not find log-event route');
    return;
  }
  
  // Extract the route code
  const routeEnd = content.indexOf('}', content.indexOf('}', routeStart + 100) + 1) + 1;
  const routeCode = content.substring(routeStart, routeEnd);
  
  console.log('📝 Log-event route code:');
  console.log('='.repeat(60));
  console.log(routeCode);
  console.log('='.repeat(60));
  
  // Check for database save code
  if (routeCode.includes('insertOne') || routeCode.includes('db.collection')) {
    console.log('✅ Database save code appears to be present');
  } else {
    console.log('❌ Database save code NOT found in route');
    console.log('\nYou need to add this code after the event object is created:');
    console.log(`
    // ✅ ADD THIS: Save to MongoDB
    try {
      const db = mongoose.connection.db;
      await db.collection('analyticsevents').insertOne(event);
      console.log('✅ Secret phrase saved to analyticsevents:', event._id.toString());
      await db.collection('secretphraseanalytics').insertOne({
        ...event,
        eventId: event._id.toString()
      });
      console.log('✅ Also saved to secretphraseanalytics collection');
    } catch (dbError) {
      console.error('❌ Database save error (but continuing):', dbError.message);
    }`);
  }
}

checkPatch();
