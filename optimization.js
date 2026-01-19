// optimization.js
import compression from 'compression';
import cluster from 'cluster';
import os from 'os';

export const setupOptimization = (app) => {
  // Enable compression
  app.use(compression());
  
  // Enable clustering for multi-core CPUs
  if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Master ${process.pid} is running`);
    console.log(`🔧 Forking ${numCPUs} workers...`);
    
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} died`);
      console.log('🔄 Starting a new worker...');
      cluster.fork();
    });
  }
};
