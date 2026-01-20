// /services/firebaseAnalyticsService.js
// This service handles analytics logging to Firebase

// Note: For this to work with real Firebase, you must:
// 1. Set FIREBASE_PRIVATE_KEY in your .env file (replace \n with actual newlines)
// 2. Enable the Firestore database in Firebase Console

// Initialize with mock data if Firebase credentials aren't available
let isFirebaseInitialized = false;
let db = null;
let analytics = null;

// Try to initialize Firebase Admin SDK
async function initializeFirebase() {
  // Check if Firebase Admin is available and credentials exist
  try {
    const admin = await import('firebase-admin');
    
    // Check if we have the required environment variables
    const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
    const hasAllEnvVars = requiredEnvVars.every(varName => process.env[varName]);
    
    if (admin.apps.length === 0 && hasAllEnvVars) {
      // Format the private key correctly (replace escaped newlines with actual newlines)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
      isFirebaseInitialized = true;
      
      // Get Firestore database instance
      db = admin.firestore();
      analytics = admin.analytics();
      
      return true;
    } else if (admin.apps.length > 0) {
      // Already initialized
      isFirebaseInitialized = true;
      db = admin.firestore();
      analytics = admin.analytics();
      console.log('✅ Using existing Firebase Admin SDK instance');
      return true;
    } else {
      console.log('⚠️ Firebase Admin SDK not initialized - missing environment variables');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.log('⚠️ Running in mock mode - analytics events will be logged to console only');
    return false;
  }
}

// Initialize Firebase when this module is loaded
initializeFirebase().catch(console.error);

class FirebaseAnalyticsService {
  constructor() {
    // The initialization happens in the async function above
  }

  /**
   * Log a custom event to Firebase Analytics
   * @param {string} userId - The user ID
   * @param {string} eventName - Name of the event
   * @param {Object} eventParams - Event parameters
   */
  async logEvent(userId, eventName, eventParams = {}) {
    const eventData = {
      name: eventName,
      params: {
        ...eventParams,
        user_id: userId,
        timestamp: new Date().toISOString(),
        platform: 'backend_api'
      },
      timestamp: new Date()
    };

    try {
      if (isFirebaseInitialized && db) {
        // Log to Firestore
        await db.collection('analytics_events').add(eventData);
        console.log(`📊 Firebase Event Logged: ${eventName} for user ${userId}`);
      } else {
        // Fallback to console logging
        console.log('📝 Analytics Event (Firebase not initialized):', JSON.stringify(eventData, null, 2));
      }
      
      return {
        success: true,
        eventId: eventData.timestamp.toISOString(),
        source: isFirebaseInitialized ? 'firebase' : 'console'
      };
    } catch (error) {
      console.error('❌ Error logging analytics event:', error.message);
      
      // Fallback to console
      console.log('📝 Analytics Event (Fallback):', {
        userId, eventName, eventParams, timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        source: 'fallback'
      };
    }
  }

  /**
   * Get analytics summary for a user
   * @param {string} userId - The user ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   */
  async getSummary(userId, startDate = null, endDate = null) {
    try {
      if (isFirebaseInitialized && db) {
        let query = db.collection('analytics_events')
          .where('params.user_id', '==', userId);
        
        if (startDate) {
          query = query.where('timestamp', '>=', new Date(startDate));
        }
        if (endDate) {
          query = query.where('timestamp', '<=', new Date(endDate));
        }
        
        const snapshot = await query.get();
        const events = [];
        
        snapshot.forEach(doc => {
          events.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Calculate statistics
        const eventCounts = {};
        events.forEach(event => {
          eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
        });
        
        const totalEvents = events.length;
        const uniqueEventTypes = Object.keys(eventCounts).length;
        const mostCommonEvent = Object.entries(eventCounts)
          .sort((a, b) => b[1] - a[1])[0] || ['none', 0];
        
        return {
          success: true,
          summary: {
            userId,
            period: { startDate, endDate },
            totalEvents,
            uniqueEventTypes,
            eventCounts,
            mostCommonEvent: {
              type: mostCommonEvent[0],
              count: mostCommonEvent[1]
            },
            dailyAverage: startDate && endDate 
              ? totalEvents / Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)))
              : totalEvents / 30, // Default to 30-day average
            recentEvents: events.slice(-10).reverse()
          }
        };
      } else {
        // Return mock data
        return {
          success: true,
          summary: this.getMockSummary(userId, startDate, endDate),
          source: 'mock'
        };
      }
    } catch (error) {
      console.error('❌ Error getting analytics summary:', error.message);
      return {
        success: false,
        error: error.message,
        summary: this.getMockSummary(userId, startDate, endDate)
      };
    }
  }

  /**
   * Mock summary for fallback
   */
  getMockSummary(userId, startDate, endDate) {
    return {
      userId,
      period: { startDate, endDate },
      totalEvents: 1250,
      uniqueEventTypes: 8,
      eventCounts: {
        'screen_view': 850,
        'prediction_generated': 120,
        'game_viewed': 280
      },
      mostCommonEvent: { type: 'screen_view', count: 850 },
      dailyAverage: 41.7,
      recentEvents: []
    };
  }

  /**
   * Track screen view event
   * @param {string} userId - The user ID
   * @param {string} screenName - Name of the screen
   * @param {string} screenClass - Class of the screen
   */
  async trackScreenView(userId, screenName, screenClass = '') {
    return this.logEvent(userId, 'screen_view', {
      screen_name: screenName,
      screen_class: screenClass
    });
  }

  /**
   * Track subscription event
   * @param {string} userId - The user ID
   * @param {string} planId - Subscription plan ID
   * @param {number} price - Price of the subscription
   * @param {string} eventType - Type of subscription event
   */
  async trackSubscription(userId, planId, price, eventType = 'subscription_started') {
    return this.logEvent(userId, eventType, {
      plan_id: planId,
      price,
      currency: 'USD',
      platform: 'ios'
    });
  }

  /**
   * Track prediction event
   * @param {string} userId - The user ID
   * @param {string} predictionId - Prediction ID
   * @param {string} sport - Sport type
   * @param {number} confidence - Confidence score
   */
  async trackPrediction(userId, predictionId, sport, confidence) {
    return this.logEvent(userId, 'prediction_generated', {
      prediction_id: predictionId,
      sport,
      confidence,
      timestamp: new Date().toISOString()
    });
  }
}

// Create and export singleton instance
const firebaseAnalyticsService = new FirebaseAnalyticsService();
export default firebaseAnalyticsService;
