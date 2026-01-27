// scripts/check-user-model.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking User Model Structure...\n');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function checkModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the User model schema
    const User = mongoose.model('User');
    const schema = User.schema;
    
    console.log('📋 User Model Schema Fields:');
    console.log('=============================');
    
    // Check required fields
    const requiredFields = [];
    const paths = schema.paths;
    
    Object.keys(paths).forEach(pathName => {
      const path = paths[pathName];
      if (path.isRequired) {
        requiredFields.push(pathName);
        console.log(`❌ Required: ${pathName}`);
      } else {
        console.log(`✅ Optional: ${pathName}`);
      }
    });
    
    console.log('\n📊 Required Fields Summary:');
    console.log('==========================');
    if (requiredFields.length > 0) {
      console.log('The following fields are REQUIRED:');
      requiredFields.forEach(field => console.log(`  - ${field}`));
    } else {
      console.log('No required fields found (unlikely)');
    }
    
    // Check for password field in schema
    console.log('\n🔑 Password Field Details:');
    console.log('=========================');
    const passwordPath = schema.path('password');
    if (passwordPath) {
      console.log(`Type: ${passwordPath.instance}`);
      console.log(`Required: ${passwordPath.isRequired}`);
      console.log(`Selectable: ${passwordPath.selected}`);
    } else {
      console.log('❌ Password field not found in schema!');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

checkModel();
