#!/bin/bash
# Monitor system health and send alerts if needed

THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_RESTARTS=10

# Check PM2 process
STATUS=$(pm2 status nba-backend --silent)
if [ $? -ne 0 ]; then
    echo "🚨 ALERT: nba-backend process not found!" | mail -s "NBA Backend Alert" your-email@example.com
    exit 1
fi

# Check CPU and memory
CPU_USAGE=$(pm2 list | grep nba-backend | awk '{print $10}' | sed 's/%//' | head -1)
MEMORY_USAGE=$(pm2 list | grep nba-backend | awk '{print $11}' | sed 's/MB//' | head -1)
RESTARTS=$(pm2 list | grep nba-backend | awk '{print $7}' | head -1)

if [ "$CPU_USAGE" -gt "$THRESHOLD_CPU" ]; then
    echo "⚠️  High CPU usage: ${CPU_USAGE}%" >> /tmp/health-alert.txt
fi

if [ "$MEMORY_USAGE" -gt 500 ]; then  # > 500MB
    echo "⚠️  High memory usage: ${MEMORY_USAGE}MB" >> /tmp/health-alert.txt
fi

if [ "$RESTARTS" -gt "$THRESHOLD_RESTARTS" ]; then
    echo "⚠️  High restart count: ${RESTARTS}" >> /tmp/health-alert.txt
fi

# Check API health
if ! curl -s -f http://localhost:8080/health > /dev/null; then
    echo "🚨 API health check failed!" >> /tmp/health-alert.txt
fi

# Send alert if any issues found
if [ -f /tmp/health-alert.txt ]; then
    cat /tmp/health-alert.txt
    # Uncomment to email alerts:
    # mail -s "NBA Backend Health Alert" your-email@example.com < /tmp/health-alert.txt
    rm /tmp/health-alert.txt
else
    echo "✅ All systems normal"
fi
