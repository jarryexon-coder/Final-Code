// middleware/healthMonitor.js
import os from 'os';

class HealthMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      memoryUsage: [],
      startTime: Date.now()
    };
  }

  recordRequest(duration) {
    this.metrics.requests++;
    this.metrics.responseTimes.push(duration);
    
    // Keep only last 1000 measurements
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
  }

  getMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;
    
    return {
      uptime: Math.floor(uptime / 1000),
      requests: this.metrics.requests,
      errorRate: this.metrics.errors / Math.max(this.metrics.requests, 1),
      avgResponseTime: this.metrics.responseTimes.length 
        ? this.metrics.responseTimes.reduce((a, b) => a + b) / this.metrics.responseTimes.length
        : 0,
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      connections: this.metrics.connections || 0
    };
  }

  checkThresholds() {
    const metrics = this.getMetrics();
    const alerts = [];
    
    if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.8) {
      alerts.push('⚠️ High memory usage');
    }
    
    if (metrics.avgResponseTime > 1000) {
      alerts.push('⚠️ Slow response times');
    }
    
    if (metrics.errorRate > 0.05) {
      alerts.push('⚠️ High error rate');
    }
    
    return alerts;
  }
}

export default new HealthMonitor();
