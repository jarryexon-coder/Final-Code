// sports-analytics-backend/websocket/server.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket
    this.setupConnectionHandling();
  }

  setupConnectionHandling() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');

      // Extract token from query parameters or headers
      const token = this.extractToken(req);
      let userId = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
          this.clients.set(userId, ws);
          console.log(`User ${userId} connected via WebSocket`);
        } catch (error) {
          console.error('Invalid token:', error.message);
          ws.close(1008, 'Invalid token');
          return;
        }
      }

      // Handle incoming messages
      ws.on('message', (message) => {
        this.handleMessage(ws, userId, message);
      });

      // Handle connection close
      ws.on('close', () => {
        if (userId) {
          this.clients.delete(userId);
          console.log(`User ${userId} disconnected`);
        }
      });

      // Send initial connection message
      this.sendToClient(ws, {
        type: 'connection_established',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString(),
      });
    });
  }

  extractToken(req) {
    // Try to get token from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    
    // Or from headers
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    return tokenFromQuery || tokenFromHeader;
  }

  handleMessage(ws, userId, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(ws, userId, data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, userId, data);
          break;
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format',
      });
    }
  }

  handleSubscribe(ws, userId, data) {
    const { channel, params } = data;
    
    // Store subscription
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    ws.subscriptions.add(channel);
    
    console.log(`User ${userId} subscribed to ${channel}`);
    
    this.sendToClient(ws, {
      type: 'subscription_confirmed',
      channel,
      message: `Subscribed to ${channel}`,
    });
  }

  handleUnsubscribe(ws, userId, data) {
    const { channel } = data;
    
    if (ws.subscriptions && ws.subscriptions.has(channel)) {
      ws.subscriptions.delete(channel);
      console.log(`User ${userId} unsubscribed from ${channel}`);
    }
  }

  // Broadcast to all clients
  broadcast(data, channel = null) {
    const message = JSON.stringify(data);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (!channel || (client.subscriptions && client.subscriptions.has(channel))) {
          client.send(message);
        }
      }
    });
  }

  // Send to specific user
  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      this.sendToClient(client, data);
    }
  }

  // Send to specific client
  sendToClient(client, data) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  // Method to broadcast secret phrase events
  broadcastSecretPhraseEvent(eventData) {
    this.broadcast({
      type: 'secret_phrase_event',
      event: eventData,
      timestamp: new Date().toISOString(),
    }, 'secret_phrases');
  }

  // Method to broadcast analytics updates
  broadcastAnalyticsUpdate(updateData) {
    this.broadcast({
      type: 'analytics_update',
      update: updateData,
      timestamp: new Date().toISOString(),
    }, 'analytics');
  }
}

module.exports = WebSocketServer;
