import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

class NotificationWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket[]
    
    this.setupConnection();
  }

  setupConnection() {
    this.wss.on('connection', (ws, req) => {
      const token = this.extractToken(req);
      
      if (!token) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        this.addClient(userId, ws);
        
        ws.on('message', (message) => this.handleMessage(userId, message));
        ws.on('close', () => this.removeClient(userId, ws));
        ws.on('error', (error) => this.handleError(userId, error));
        
        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection_established',
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        ws.close(1008, 'Invalid token');
      }
    });
  }

  extractToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  addClient(userId, ws) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId).push(ws);
  }

  removeClient(userId, ws) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const index = userClients.indexOf(ws);
      if (index > -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(userId);
      }
    }
  }

  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscription(userId, data.channel);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(userId, data.channel);
          break;
        case 'ping':
          this.sendToUser(userId, { type: 'pong', timestamp: Date.now() });
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  handleSubscription(userId, channel) {
    // Store subscription in database
    console.log(`User ${userId} subscribed to ${channel}`);
  }

  sendToUser(userId, message) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }

  sendBumpAlert(userId, alert) {
    this.sendToUser(userId, {
      type: 'bump_alert',
      data: alert
    });
  }

  sendLineMovement(userId, movement) {
    this.sendToUser(userId, {
      type: 'line_movement',
      data: movement
    });
  }

  broadcast(channel, message) {
    this.clients.forEach((clients, userId) => {
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    });
  }

  handleError(userId, error) {
    console.error(`WebSocket error for user ${userId}:`, error);
  }
}

export default NotificationWebSocket;
