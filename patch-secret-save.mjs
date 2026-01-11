import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function patchServer() {
  try {
    const serverPath = join(__dirname, 'server.js');
    let content = await fs.readFile(serverPath, 'utf8');
    
    console.log('🔍 Looking for secret phrase route...');
    
    // Find the exact pattern in your server.js
    const startMarker = "secretPhraseRouter.post('/log-event', async (req, res) => {";
    const startIndex = content.indexOf(startMarker);
    
    if (startIndex === -1) {
      console.error('❌ Could not find the log-event route');
      return;
    }
    
    console.log('✅ Found route at position:', startIndex);
    
    // Find where the event object ends (look for the closing brace after timestamp)
    const eventObjectStart = content.indexOf('const event = {', startIndex);
    const eventObjectEnd = content.indexOf('};', eventObjectStart) + 2;
    
    // Get the current event creation code
    const currentEventCode = content.substring(eventObjectStart, eventObjectEnd);
    console.log('Current event creation code:');
    console.log(currentEventCode);
    
    // Create the new code with database save
    const newCode = `const event = {
      ...req.body,
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date()
    };
    
    // ✅ ADDED: Save to MongoDB
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
    }`;
    
    // Replace the old event creation code with new code
    const updatedContent = content.substring(0, eventObjectStart) + 
                          newCode + 
                          content.substring(eventObjectEnd);
    
    // Backup original
    await fs.writeFile(serverPath + '.backup', content);
    await fs.writeFile(serverPath, updatedContent);
    
    console.log('✅ Successfully patched server.js');
    console.log('📁 Backup saved as server.js.backup');
    
    // Show the patched section
    const patchedStart = updatedContent.indexOf(startMarker);
    const patchedEnd = updatedContent.indexOf('// Broadcast via WebSocket', patchedStart);
    console.log('\n📝 Patched code preview:');
    console.log(updatedContent.substring(patchedStart, Math.min(patchedEnd + 100, updatedContent.length)));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

await patchServer();
