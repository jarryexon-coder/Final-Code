import fs from 'fs';
import { execSync } from 'child_process';

// Read the routes directory
const routesDir = './routes';
const routesFiles = fs.readdirSync(routesDir);

routesFiles.forEach(routeFile => {
    if (routeFile.endsWith('.js')) {
        const routePath = `${routesDir}/${routeFile}`;
        const content = fs.readFileSync(routePath, 'utf8');
        
        // Extract controller import
        const importMatch = content.match(/import.*from\s+['"](\.\.\/controllers\/[^'"]+)['"]/);
        if (importMatch) {
            const controllerPath = importMatch[1];
            console.log(`\nRoute: ${routeFile}`);
            console.log(`Controller: ${controllerPath}`);
            
            // Extract function names used in routes
            const functionRegex = /\.(get|post|put|delete|patch)\([^,]*,.*?(\w+)\)/g;
            const functions = new Set();
            let match;
            
            while ((match = functionRegex.exec(content)) !== null) {
                functions.add(match[2]);
            }
            
            console.log(`Functions used: ${Array.from(functions).join(', ')}`);
        }
    }
});
