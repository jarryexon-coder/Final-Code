#!/bin/bash
# Rotate application logs
LOG_DIR="logs"
DATE=$(date +%Y%m%d)

# Rotate PM2 logs
pm2 flush

# Archive old logs
for logfile in $LOG_DIR/*.log; do
    if [ -f "$logfile" ]; then
        mv "$logfile" "$logfile.$DATE"
        gzip "$logfile.$DATE"
    fi
done

# Create new log files
touch $LOG_DIR/err.log $LOG_DIR/out.log $LOG_DIR/combined.log

echo "✅ Logs rotated and compressed"
