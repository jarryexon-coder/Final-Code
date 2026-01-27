// check-schema.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking User Schema Configuration\n');

async function checkSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing model to force reload
    delete mongoose.connection.models.User;
    
    // Import the User model
    const UserModule = await import('./models/User.js');
    const User = UserModule.default;
    
    console.log('✅ User model loaded\n');
    
    // Check schema paths
    const schema = User.schema;
    
    console.log('📋 SCHEMA PATHS:');
    console.log('===============');
    
    const paths = ['firstName', 'lastName', 'name', 'email', 'password'];
    
    paths.forEach(pathName => {
      const path = schema.path(pathName);
      if (path) {
        console.log(`\n🔍 ${pathName}:`);
        console.log(`   Type: ${path.instance}`);
        console.log(`   Required: ${path.isRequired}`);
        console.log(`   Default: ${path.defaultValue}`);
        console.log(`   Validators: ${path.validators?.length || 0}`);
        
        // Check if it has a default function
        if (path.defaultValue && typeof path.defaultValue === 'function') {
          console.log(`   Default is a function`);
        }
      } else {
        console.log(`\n❌ ${pathName}: NOT FOUND IN SCHEMA`);
      }
    });
    
    // Check the actual schema definition
    console.log('\n📄 SCHEMA DEFINITION:');
    console.log('===================');
    console.log(JSON.stringify(schema.obj, null, 2));
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

checkSchema();
