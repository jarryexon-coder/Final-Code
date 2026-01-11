#!/bin/bash
# Backup entire system
BACKUP_DIR="/Users/jerryexon/backups/nba-backend/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "📦 Creating system backup..."

# Backup PM2 configuration
pm2 save
cp /Users/jerryexon/.pm2/dump.pm2 $BACKUP_DIR/

# Backup Nginx configuration
cp /opt/homebrew/etc/nginx/nginx.conf $BACKUP_DIR/

# Backup application code
tar -czf $BACKUP_DIR/code.tar.gz --exclude=node_modules --exclude=logs .

# Backup logs
tar -czf $BACKUP_DIR/logs.tar.gz logs/

echo "✅ Backup created: $BACKUP_DIR"
echo "📊 Backup size: $(du -sh $BACKUP_DIR | cut -f1)"
