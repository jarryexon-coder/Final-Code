#!/bin/bash
# pinpoint-express-error.sh

echo "🎯 Pinpointing Express router error..."
echo "=============================================================="

# Check which line is line 216 in the Express route.js
echo "🔍 The error is in: node_modules/express/lib/router/route.js:216"
echo "This means Express is getting an undefined callback function"
echo ""

# Let's trace which route is causing the issue
echo "📋 Let's check adminRoutes.js line by line..."
echo "=============================================================="

# Show lines around line 22
echo "Lines 20-25 of adminRoutes.js:"
sed -n '20,25p' routes/adminRoutes.js
echo ""

# That's the deleteUser route. Let's debug it
echo "🔧 Creating a debug version of adminRoutes.js..."
cp routes/adminRoutes.js routes/adminRoutes.js.backup.$(date +%s)

# Create a debug version that logs everything
cat > routes/adminRoutes_debug.js << 'DEBUG_ROUTES'
import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

console.log('=== ADMIN ROUTES DEBUG ===');
console.log('1. Checking adminController import...');
console.log('adminController keys:', Object.keys(adminController));
console.log('adminController.deleteUser type:', typeof adminController.deleteUser);
console.log('adminController value:', adminController);

// User Management
console.log('\n2. Setting up routes...');

// Test each route setup
try {
    console.log('Setting up /users route...');
    router.get('/users', adminAuth, adminController.listUsers);
    console.log('✅ /users route set');
} catch (e) { console.log('❌ /users error:', e.message); }

try {
    console.log('Setting up /users/:userId route...');
    router.get('/users/:userId', adminAuth, adminController.getUserDetails);
    console.log('✅ /users/:userId route set');
} catch (e) { console.log('❌ /users/:userId error:', e.message); }

try {
    console.log('Setting up /users/:userId/prizepicks route...');
    router.get('/users/:userId/prizepicks', adminAuth, adminController.getUserPrizePicks);
    console.log('✅ /users/:userId/prizepicks route set');
} catch (e) { console.log('❌ /users/:userId/prizepicks error:', e.message); }

try {
    console.log('Setting up /users/:userId/reset-limit route...');
    router.post('/users/:userId/reset-limit', adminAuth, adminController.resetUserLimit);
    console.log('✅ /users/:userId/reset-limit route set');
} catch (e) { console.log('❌ /users/:userId/reset-limit error:', e.message); }

try {
    console.log('Setting up /users/:userId/status route...');
    router.put('/users/:userId/status', adminAuth, adminController.updateUserStatus);
    console.log('✅ /users/:userId/status route set');
} catch (e) { console.log('❌ /users/:userId/status error:', e.message); }

try {
    console.log('Setting up DELETE /users/:userId route...');
    router.delete('/users/:userId', adminAuth, adminController.deleteUser);
    console.log('✅ DELETE /users/:userId route set');
} catch (e) { console.log('❌ DELETE /users/:userId error:', e.message); }

try {
    console.log('Setting up /prizepicks/generate-batch route...');
    router.post('/prizepicks/generate-batch', adminAuth, adminController.batchGenerateSelections);
    console.log('✅ /prizepicks/generate-batch route set');
} catch (e) { console.log('❌ /prizepicks/generate-batch error:', e.message); }

try {
    console.log('Setting up /prizepicks/generation-stats route...');
    router.get('/prizepicks/generation-stats', adminAuth, adminController.getGenerationStats);
    console.log('✅ /prizepicks/generation-stats route set');
} catch (e) { console.log('❌ /prizepicks/generation-stats error:', e.message); }

try {
    console.log('Setting up /prizepicks/:id route...');
    router.delete('/prizepicks/:id', adminAuth, adminController.removeSelection);
    console.log('✅ /prizepicks/:id route set');
} catch (e) { console.log('❌ /prizepicks/:id error:', e.message); }

try {
    console.log('Setting up /prizepicks/force-generate route...');
    router.post('/prizepicks/force-generate', adminAuth, adminController.forceGenerate);
    console.log('✅ /prizepicks/force-generate route set');
} catch (e) { console.log('❌ /prizepicks/force-generate error:', e.message); }

console.log('\n=== ROUTES SETUP COMPLETE ===');
export default router;
DEBUG_ROUTES

echo "✅ Created debug version: routes/adminRoutes_debug.js"
echo ""

# Now let's test what server.js is doing
echo "🔍 Checking how server.js imports admin routes..."
if grep -n "adminRoutes" server.js; then
    echo "Found adminRoutes import in server.js"
    
    # Let's create a test server that uses the debug routes
    echo "Creating test server..."
    cat > test_server_debug.js << 'TEST_SERVER'
import express from 'express';
import adminRoutes from './routes/adminRoutes_debug.js';

const app = express();
app.use(express.json());

console.log('=== TEST SERVER STARTING ===\n');

// Use the debug routes
app.use('/api/admin', adminRoutes);

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`\n✅ Test server running on http://localhost:${PORT}`);
    console.log(`Test endpoints:`);
    console.log(`  GET  http://localhost:${PORT}/test`);
    console.log(`  GET  http://localhost:${PORT}/api/admin/users`);
});
TEST_SERVER

    echo "✅ Created test_server_debug.js"
    echo ""
    echo "🚀 Starting test server on port 3003..."
    echo "=============================================================="
    node test_server_debug.js
else
    echo "❌ Could not find adminRoutes import in server.js"
fi
