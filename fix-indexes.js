// fix-indexes.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Fixing Duplicate Index Warnings\n');

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the User model
    const User = mongoose.model('User');
    const schema = User.schema;
    
    console.log('📋 Current indexes in schema:');
    console.log(JSON.stringify(schema._indexes, null, 2));
    
    // Check for duplicate index definitions
    // Remove index: true from schema paths if schema.index() is also used
    
    await mongoose.disconnect();
    console.log('\n✅ To fix duplicate indexes:');
    console.log('1. Check your User.js schema for fields with "index: true"');
    console.log('2. Also check for "schema.index()" calls at the bottom');
    console.log('3. Remove either the "index: true" OR the "schema.index()" call');
    console.log('4. Recommended: Keep "schema.index()" and remove "index: true"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

fixIndexes();
