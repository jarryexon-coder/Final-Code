#!/bin/bash
echo "🔄 Resetting Nginx completely..."

# 1. Kill all Nginx processes
echo "1. Stopping Nginx..."
brew services stop nginx 2>/dev/null
sudo pkill -9 nginx 2>/dev/null

# 2. Remove problematic files
echo "2. Cleaning up..."
rm -f ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist 2>/dev/null

# 3. Create fresh config
echo "3. Creating fresh config..."
sudo tee /opt/homebrew/etc/nginx/nginx.conf > /dev/null << 'NGINXEOF'
worker_processes  1;
events { worker_connections 1024; }
http {
    include mime.types; default_type application/octet-stream;
    sendfile on; keepalive_timeout 65;
    server {
        listen 8080; server_name localhost;
        location / {
            proxy_pass http://127.0.0.1:3002;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }
        location /health {
            proxy_pass http://127.0.0.1:3002/health;
            access_log off;
        }
    }
}
NGINXEOF

# 4. Test config
echo "4. Testing configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config test passed"
else
    echo "❌ Config test failed:"
    sudo nginx -t
    exit 1
fi

# 5. Start Nginx
echo "5. Starting Nginx..."
sudo nginx 2>/dev/null || brew services start nginx

# 6. Verify
echo "6. Verifying..."
sleep 2
if curl -s http://localhost:8080/health >/dev/null; then
    echo "✅ Nginx is working on port 8080!"
    echo "   Health check: $(curl -s http://localhost:8080/health | jq -r .status)"
else
    echo "❌ Nginx failed to start"
    echo "   Trying alternative port 8081..."
    sudo sed -i '' 's/8080/8081/g' /opt/homebrew/etc/nginx/nginx.conf
    sudo nginx -s stop 2>/dev/null
    sudo nginx
    curl -s http://localhost:8081/health >/dev/null && \
        echo "✅ Nginx is working on port 8081!" || \
        echo "❌ Nginx still not working"
fi

echo ""
echo "📊 Current status:"
brew services list | grep nginx || echo "Nginx not managed by brew"
echo "Ports in use:"
lsof -i :8080 -i :8081 -i :3002 | grep LISTEN || echo "No relevant ports found"
