const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

class NotificationService {
  // Send notification to specific user
  async sendToUser(userId, title, body, data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken) {
        console.log('User not found or no push token');
        return;
      }

      await this.sendPushNotification(user.pushToken, title, body, data);
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Send notification to all users
  async sendToAllUsers(title, body, data = {}) {
    try {
      const users = await User.find({ pushToken: { $exists: true, $ne: null } });
      const tokens = users.map(user => user.pushToken).filter(token => Expo.isExpoPushToken(token));

      await this.sendBulkPushNotifications(tokens, title, body, data);
    } catch (error) {
      console.error('Error sending notification to all users:', error);
    }
  }

  // Send single push notification
  async sendPushNotification(pushToken, title, body, data = {}) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    await this.sendBulkPushNotifications(messages);
  }

  // Send bulk push notifications
  async sendBulkPushNotifications(messages) {
    try {
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending bulk push notifications:', error);
    }
  }

  // Game start notification
  async sendGameStartNotification(game) {
    const title = `Game Starting Soon!`;
    const body = `${game.away_team} vs ${game.home_team} starts in 30 minutes`;
    
    await this.sendToAllUsers(title, body, {
      type: 'game_start',
      gameId: game.id
    });
  }

  // Player milestone notification
  async sendPlayerMilestoneNotification(playerName, milestone, game) {
    const title = `Player Milestone!`;
    const body = `${playerName} reached ${milestone} in the ${game.home_team} vs ${game.away_team} game`;
    
    await this.sendToAllUsers(title, body, {
      type: 'player_milestone',
      playerName,
      milestone,
      gameId: game.id
    });
  }

  // Final score notification
  async sendFinalScoreNotification(game) {
    const title = `Game Final: ${game.away_team} vs ${game.home_team}`;
    const body = `Final Score: ${game.away_team} ${game.away_score} - ${game.home_team} ${game.home_score}`;
    
    await this.sendToAllUsers(title, body, {
      type: 'final_score',
      gameId: game.id
    });
  }
}

module.exports = new NotificationService();
