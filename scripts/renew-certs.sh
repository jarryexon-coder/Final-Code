# Daily Redis backup at 2 AM
0 2 * * * /bin/bash /path/to/your/nba-backend/scripts/redis-backup.sh --upload >> /var/log/redis-backup.log 2>&1
