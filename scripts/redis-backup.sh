#!/bin/bash

# Redis Backup Script
# Usage: ./scripts/redis-backup.sh [--upload]

set -e  # Exit on error

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${HOME}/backups/redis"
REDIS_DUMP_FILE="/usr/local/var/db/redis/dump.rdb"  # macOS default
# For Ubuntu: REDIS_DUMP_FILE="/var/lib/redis/dump.rdb"

# Check if we should upload to S3
UPLOAD_TO_S3=false
if [[ "$1" == "--upload" ]]; then
    UPLOAD_TO_S3=true
    if ! command -v aws &> /dev/null; then
        echo "Error: AWS CLI is not installed. Install with: brew install awscli"
        exit 1
    fi
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔍 Starting Redis backup at $(date)"

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis is not running. Starting Redis..."
    brew services start redis  # For macOS
    # sudo systemctl start redis  # For Ubuntu
    sleep 5
fi

# Method 1: Use BGSAVE (non-blocking)
echo "🔄 Saving Redis database (BGSAVE)..."
redis-cli BGSAVE

# Wait for BGSAVE to complete
echo "⏳ Waiting for save to complete..."
while true; do
    SAVE_STATUS=$(redis-cli info persistence | grep "rdb_bgsave_in_progress" | cut -d: -f2)
    if [[ "$SAVE_STATUS" == "0" ]]; then
        echo "✅ Redis save completed"
        break
    fi
    sleep 1
done

# Verify dump file exists
if [[ ! -f "$REDIS_DUMP_FILE" ]]; then
    echo "❌ Redis dump file not found at: $REDIS_DUMP_FILE"
    echo "📋 Checking Redis config..."
    REDIS_DIR=$(redis-cli config get dir | tail -n 1)
    REDIS_DBFILENAME=$(redis-cli config get dbfilename | tail -n 1)
    REDIS_DUMP_FILE="${REDIS_DIR}/${REDIS_DBFILENAME}"
    echo "   Config dir: $REDIS_DIR"
    echo "   DB filename: $REDIS_DBFILENAME"
    echo "   Expected dump: $REDIS_DUMP_FILE"
    
    if [[ ! -f "$REDIS_DUMP_FILE" ]]; then
        echo "❌ Redis dump still not found. Exiting."
        exit 1
    fi
fi

# Create backup filename
BACKUP_FILE="${BACKUP_DIR}/redis-dump-${TIMESTAMP}.rdb"

# Copy the dump file
echo "📦 Creating backup: $BACKUP_FILE"
cp "$REDIS_DUMP_FILE" "$BACKUP_FILE"

# Compress the backup
echo "🗜️  Compressing backup..."
gzip -f "$BACKUP_FILE"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# Upload to S3 if requested
if [[ "$UPLOAD_TO_S3" == true ]]; then
    echo "☁️  Uploading to S3..."
    S3_BUCKET="your-backup-bucket"  # CHANGE THIS
    S3_PATH="redis/backup-${TIMESTAMP}.rdb.gz"
    
    aws s3 cp "$BACKUP_FILE_GZ" "s3://${S3_BUCKET}/${S3_PATH}"
    
    # Set lifecycle policy on the uploaded file
    echo "📝 Setting lifecycle policy..."
    aws s3api put-object-tagging \
        --bucket "$S3_BUCKET" \
        --key "$S3_PATH" \
        --tagging '{"TagSet": [{"Key": "Retention", "Value": "30days"}]}'
    
    echo "✅ Uploaded to: s3://${S3_BUCKET}/${S3_PATH}"
fi

# Clean up old local backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "redis-dump-*.rdb.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "redis-dump-*.rdb" -mtime +1 -delete  # Keep uncompressed only 1 day

echo "🎉 Backup completed successfully!"
echo "📊 Backup size: $(du -h "$BACKUP_FILE_GZ" | cut -f1)"
echo "📅 Backup saved: $BACKUP_FILE_GZ"
