
echo "Stopping any existing backend on port 3000..."
pkill -f "node.*3000" 2>/dev/null || true
sleep 2

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 3000 is still in use. Trying to free it..."
    # Force kill
    kill -9 $(lsof -t -i:3000) 2>/dev/null || true
    sleep 2
fi

echo "Starting NBA Fantasy backend..."
echo "This backend will be accessible on:"
echo "  - http://localhost:3000"
echo "  - http://127.0.0.1:3000"
echo "  - http://10.0.0.183:3000"
echo "  - And all other network interfaces"

node server.js > backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Logs are being written to: ~/nba-backend/backend.log"
echo ""

sleep 3

echo "Testing backend connectivity..."
echo -n "localhost:3000: "
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo -n "127.0.0.1:3000: "
if curl -s http://127.0.0.1:3000/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo -n "10.0.0.183:3000: "
if curl -s http://10.0.0.183:3000/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "Backend is running. Press Ctrl+C to stop."
echo "To view logs: tail -f ~/nba-backend/backend.log"

# Wait for Ctrl+C
trap "echo 'Stopping backend...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT
wait $BACKEND_PID
