// services/alertService.js
import axios from 'axios';

class AlertService {
  constructor() {
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL;
  }

  async sendAlert(level, message, data = {}) {
    const alert = {
      level, // 'critical', 'warning', 'info'
      message,
      timestamp: new Date().toISOString(),
      service: 'nba-backend',
      data
    };

    console.log(`🚨 ALERT [${level.toUpperCase()}]: ${message}`);
    
    // Send to webhook (Slack, Discord, etc.)
    if (this.webhookUrl) {
      try {
        await axios.post(this.webhookUrl, alert);
      } catch (error) {
        console.error('Failed to send alert:', error.message);
      }
    }
  }
}

export default new AlertService();
