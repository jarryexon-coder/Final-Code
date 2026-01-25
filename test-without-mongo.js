// test-without-mongo.js
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Mock User model
const mockUsers = [];

// Mock registration
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }
  
  // Check if user exists
  if (mockUsers.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: 'Email already registered'
    });
  }
  
  // Create mock user
  const user = {
    id: Date.now().toString(),
    email,
    firstName,
    lastName,
    createdAt: new Date()
  };
  
  mockUsers.push(user);
  
  // Mock token
  const token = `mock_token_${Date.now()}`;
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'user'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'mock' });
});

app.listen(3003, () => {
  console.log('✅ Mock server running on http://localhost:3003');
  console.log('📝 Test registration at POST http://localhost:3003/api/auth/register');
});
