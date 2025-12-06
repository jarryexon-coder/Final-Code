class AnalyticsService {
  constructor() {
    this.analytics = new Map();
  }

  trackEvent(userId, eventType, data = {}) {
    const timestamp = new Date().toISOString();
    const event = {
      userId,
      eventType,
      data,
      timestamp,
      sessionId: this.getSessionId(userId)
    };

    if (!this.analytics.has(userId)) {
      this.analytics.set(userId, []);
    }
    this.analytics.get(userId).push(event);

    console.log(`📊 Analytics: ${eventType} for user ${userId}`);
    
    return event;
  }

  trackUserBehavior(userId, action, context = {}) {
    const events = [
      'player_search',
      'fantasy_team_created', 
      'prediction_viewed',
      'game_checked',
      'favorite_added'
    ];

    if (events.includes(action)) {
      return this.trackEvent(userId, `user_${action}`, context);
    }
  }

  getSessionId(userId) {
    return `session_${userId}_${Date.now()}`;
  }

  getUserAnalytics(userId) {
    const userEvents = this.analytics.get(userId) || [];
    
    const summary = {
      totalEvents: userEvents.length,
      lastActive: userEvents.length > 0 ? userEvents[userEvents.length - 1].timestamp : null,
      eventTypes: this.countEventTypes(userEvents),
      favoriteActions: this.getFavoriteActions(userEvents)
    };

    return summary;
  }

  countEventTypes(events) {
    const counts = {};
    events.forEach(event => {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    });
    return counts;
  }

  getFavoriteActions(events) {
    const actions = events.filter(e => e.eventType.startsWith('user_'));
    const actionCounts = {};
    
    actions.forEach(action => {
      const actionName = action.eventType.replace('user_', '');
      actionCounts[actionName] = (actionCounts[actionName] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }

  getDashboardStats() {
    const totalUsers = this.analytics.size;
    let totalEvents = 0;
    let activeSessions = new Set();

    this.analytics.forEach((events, userId) => {
      totalEvents += events.length;
      const recentEvents = events.filter(e => 
        new Date() - new Date(e.timestamp) < 30 * 60 * 1000
      );
      if (recentEvents.length > 0) {
        activeSessions.add(userId);
      }
    });

    return {
      totalUsers,
      totalEvents,
      activeUsers: activeSessions.size,
      popularEvents: this.getPopularEvents()
    };
  }

  getPopularEvents() {
    const allEvents = [];
    this.analytics.forEach(events => {
      allEvents.push(...events);
    });

    const eventCounts = {};
    allEvents.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([eventType, count]) => ({ eventType, count }));
  }
}

module.exports = new AnalyticsService();
