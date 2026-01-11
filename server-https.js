// server-https.js
import https from 'https';
import fs from 'fs';
import app from './server.js';

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem'),
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256'
  ].join(':'),
  honorCipherOrder: true
};

const httpsPort = process.env.HTTPS_PORT || 443;
const server = https.createServer(options, app);

server.listen(httpsPort, () => {
  console.log(`✅ HTTPS Server running on port ${httpsPort}`);
});

// Force HTTP to HTTPS redirect
const httpApp = express();
httpApp.get('*', (req, res) => {
  res.redirect(`https://${req.headers.host}${req.url}`);
});
httpApp.listen(80);
