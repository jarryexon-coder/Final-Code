import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

console.log('=== TEST ROUTES SETUP ===');
console.log('Checking adminController keys:', Object.keys(adminController));

// Test ONE route at a time
console.log('\n1. Testing GET /users route...');
router.get('/test-users', (req, res) => {
    console.log('GET /test-users called');
    res.json({test: 'GET /users works'});
});

console.log('2. Testing with adminController.listUsers...');
if (typeof adminController.listUsers === 'function') {
    router.get('/test-admin-users', adminAuth, adminController.listUsers);
    console.log('✅ GET /test-admin-users route set');
} else {
    console.log('❌ adminController.listUsers is not a function');
}

console.log('3. Testing the problematic DELETE route...');
if (typeof adminController.deleteUser === 'function') {
    router.delete('/test-delete/:id', adminAuth, adminController.deleteUser);
    console.log('✅ DELETE /test-delete/:id route set');
} else {
    console.log('❌ adminController.deleteUser is not a function');
}

console.log('\n=== ALL TEST ROUTES SET ===');
export default router;
