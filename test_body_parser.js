import express from 'express';
const app = express();

// Test without and with body parser
console.log('Testing body parser...');

app.use(express.json());

app.post('/test', (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request body userId:', req.body?.userId);
  res.json({ body: req.body, userId: req.body?.userId });
});

const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`Test server listening on port ${port}`);
  
  // Make a test request
  fetch(`http://localhost:${port}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test123', phraseKey: 'test' })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Response:', data);
      if (data.userId === 'test123') {
        console.log('✅ Body parser is working!');
      } else {
        console.log('❌ Body parser not working');
      }
      server.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      server.close();
      process.exit(1);
    });
});
