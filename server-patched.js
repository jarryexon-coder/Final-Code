// This script will create a fixed version
const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');

// Find the log-event route and add database save
const fixedContent = content.replace(
  /secretPhraseRouter\.post\('\/log-event', async \(req, res\) => \{[\s\S]*?timestamp: new Date\(\)\s*\}/,
  `secretPhraseRouter.post('/log-event', async (req, res) => {
  try {
    // For now, simulate event creation
    const event = {
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
    }`
);

fs.writeFileSync('server-fixed.js', fixedContent);
console.log('✅ Created server-fixed.js with database save code');
