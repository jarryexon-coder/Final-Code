import express from 'express';
import adminRoutes from './routes/adminRoutes_test.js';

const app = express();
app.use(express.json());

console.log('=== STARTING TEST SERVER ===\n');

// Use test routes
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 3004;
app.listen(PORT, () => {
    console.log(`\n✅ Test server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  GET  http://localhost:${PORT}/api/admin/test-users`);
    console.log(`  GET  http://localhost:${PORT}/api/admin/test-admin-users`);
    console.log(`  DELETE  http://localhost:${PORT}/api/admin/test-delete/123`);
    console.log('\nTry accessing these endpoints to test...');
});
