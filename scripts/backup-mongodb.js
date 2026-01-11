// scripts/backup-mongodb.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import AWS from 'aws-sdk';

const execAsync = promisify(exec);
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function backupMongoDB() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `/backups/mongodb/${timestamp}`;
  const backupFile = `${backupDir}/backup.gz`;
  
  try {
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Dump MongoDB
    console.log(`Starting MongoDB backup: ${timestamp}`);
    await execAsync(
      `mongodump --uri="${process.env.MONGODB_URI}" --archive="${backupFile}" --gzip`
    );
    
    // Upload to S3
    const fileStream = fs.createReadStream(backupFile);
    await s3.upload({
      Bucket: process.env.S3_BACKUP_BUCKET,
      Key: `mongodb/backup-${timestamp}.gz`,
      Body: fileStream
    }).promise();
    
    console.log(`✅ Backup completed and uploaded to S3`);
    
    // Clean up old local backups (keep last 7 days)
    await execAsync(`find /backups/mongodb -type f -mtime +7 -delete`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Run backup
if (require.main === module) {
  backupMongoDB().catch(console.error);
}
