// utils/mongodb-fix.js
export function getMongoURI() {
  const uri = process.env.MONGODB_URI;
  
  // If SRV is failing, try direct connection
  if (uri.includes('mongodb+srv://')) {
    console.log('⚠️ SRV connection detected, may fail on some networks');
    
    // Try to convert to direct connection
    const username = uri.match(/mongodb\+srv:\/\/([^:]+):/)?.[1];
    const password = uri.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/)?.[1];
    const cluster = uri.match(/@([^\/]+)/)?.[1];
    const database = uri.match(/\/([^?]+)/)?.[1];
    
    if (username && password && cluster) {
      return `mongodb://${username}:${password}@${cluster}-shard-00-00.6sqqrz.mongodb.net:27017,${cluster}-shard-00-01.6sqqrz.mongodb.net:27017,${cluster}-shard-00-02.6sqqrz.mongodb.net:27017/${database}?ssl=true&replicaSet=atlas-14ni6o-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }
  
  return uri;
}
