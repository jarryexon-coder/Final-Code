// middleware/logger.js
export const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
};

export const authLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    console.log(`[AUTH] ${req.method} ${req.path} - Status: ${res.statusCode}`);
    if (req.path.includes('/auth/')) {
      console.log('Auth response:', JSON.parse(data.toString()));
    }
    originalSend.apply(res, arguments);
  };
  
  next();
};
