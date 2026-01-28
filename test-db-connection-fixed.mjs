import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function testDatabase() {
    console.log('Testing database connection with updated options...');
    
    try {
        // Test MongoDB connection
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nba-fantasy';
        console.log('Connecting to:', mongoUri.replace(/\/\/.*@/, '//***@'));
        
        // Updated connection options for Mongoose 6+
        await mongoose.connect(mongoUri);
        
        console.log('✓ MongoDB connected successfully');
        
        // Try to import models dynamically
        const modelsDir = path.join(__dirname, 'models');
        const modelFiles = ['User', 'Player', 'Game', 'SecretPhrase', 'Selection'];
        
        for (const modelName of modelFiles) {
            try {
                // Try to import the model
                const modelPath = path.join(modelsDir, `${modelName}.js`);
                const { default: Model } = await import(`file://${modelPath}`);
                
                if (Model && typeof Model.countDocuments === 'function') {
                    const count = await Model.countDocuments();
                    console.log(`✓ ${modelName} model: ${count} documents`);
                } else {
                    console.log(`⚠ ${modelName} model: Not properly exported`);
                }
            } catch (err) {
                console.log(`⚠ ${modelName} model: ${err.message}`);
            }
        }
        
        // Test connection stats
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`✓ Total collections: ${collections.length}`);
        
        // List collections
        console.log('Collections in database:');
        collections.slice(0, 10).forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        await mongoose.disconnect();
        console.log('✓ Database tests completed');
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        process.exit(1);
    }
}

testDatabase();
