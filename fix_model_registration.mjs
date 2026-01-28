// Fix model registration issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking model registration...');

// Check models/index.js
const modelsIndex = path.join(__dirname, 'models', 'index.js');
if (fs.existsSync(modelsIndex)) {
  console.log('Checking models/index.js...');
  const content = fs.readFileSync(modelsIndex, 'utf8');
  
  // Look for model imports and exports
  if (!content.includes('export') || !content.includes('import')) {
    console.log('Models/index.js might not be exporting models properly');
    
    // Check what models exist
    const modelsDir = path.join(__dirname, 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && f !== 'index.js');
    
    console.log(`Found ${modelFiles.length} model files:`);
    modelFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // Create a proper models/index.js if needed
    const newIndex = `// Models index file
import mongoose from 'mongoose';

// Import all models
${modelFiles.map(file => {
  const modelName = file.replace('.js', '');
  return `import ${modelName} from './${file}';\n`;
}).join('')}

// Export all models
export {
  ${modelFiles.map(file => file.replace('.js', '')).join(',\n  ')}
};

// Export mongoose connection
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default mongoose;
`;
    
    fs.writeFileSync(modelsIndex, newIndex);
    console.log('✓ Updated models/index.js with proper exports');
  }
}

// Check individual model files
console.log('\nChecking individual model files...');
const modelsDir = path.join(__dirname, 'models');
if (fs.existsSync(modelsDir)) {
  const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && f !== 'index.js');
  
  for (const file of modelFiles) {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if model is properly defined with mongoose.model()
    if (!content.includes('mongoose.model(') && content.includes('new mongoose.Schema')) {
      console.log(`⚠ ${file}: Schema defined but model not registered`);
      
      // Extract model name from file
      const modelName = file.replace('.js', '').replace(/^\w/, c => c.toUpperCase());
      
      // Fix the model file
      const fixedContent = content.replace(
        /const.*Schema.*=.*new mongoose.Schema\(/,
        `const ${modelName}Schema = new mongoose.Schema(`
      );
      
      // Add model registration at the end
      const finalContent = fixedContent + `
  
const ${modelName} = mongoose.model('${modelName}', ${modelName}Schema);
export default ${modelName};
`;
      
      fs.writeFileSync(filePath, finalContent);
      console.log(`  ✓ Fixed ${file} model registration`);
    }
  }
}

console.log('\nModel registration fix complete!');
