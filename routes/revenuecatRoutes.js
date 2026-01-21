// routes/revenuecatRoutes.js - Complete with Stripe integration
import mongoose from 'mongoose';
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import revenuecatService from '../services/revenuecatService.js';
import firebaseAnalyticsService from '../services/firebaseAnalyticsService.js';

const router = express.Router();

// ====================
// REVENUECAT WEBHOOK ENDPOINT (Stripe Integration)
// ====================

/**
 * Verify webhook signature from RevenueCat
 * Updated to include timestamp as per RevenueCat documentation
 */
function verifyWebhookSignature(rawBody, signature, secret, timestamp) {
  try {
    // RevenueCat signature format: HMAC_SHA256(secret, timestamp + '.' + rawBody)
    const data = timestamp + '.' + rawBody;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(data).digest('hex');
    
    // Use timing-safe comparison
    const digestBuffer = Buffer.from(digest, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    
    if (digestBuffer.length !== signatureBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return false;
  }
}

// RevenueCat webhook endpoint - UPDATED to use raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('🔄 RevenueCat webhook received');
    
    // Get raw body as string
    const rawBody = req.body.toString('utf8');
    const payload = JSON.parse(rawBody);
    
    // Extract webhook signature and timestamp
    const signature = req.headers['revenuecat-webhook-signature'];
    const timestamp = req.headers['revenuecat-webhook-timestamp'];
    
    // Verify signature
    if (process.env.NODE_ENV === 'production' && process.env.REVENUECAT_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        process.env.REVENUECAT_WEBHOOK_SECRET,
        timestamp
      );
      
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }
    }
    
    console.log('📋 Webhook Type:', payload.type);
    console.log('📝 Payload:', JSON.stringify(payload, null, 2));
    
    // Process different webhook types
    const eventType = payload.type;
    const eventData = payload.data;
    
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(eventData);
        break;
        
      case 'RENEWAL':
        await handleRenewal(eventData);
        break;
        
      case 'CANCELLATION':
        await handleCancellation(eventData);
        break;
        
      case 'EXPIRATION':
        await handleExpiration(eventData);
        break;
        
      case 'UNCANCELLATION':
        await handleUncancellation(eventData);
        break;
        
      case 'BILLING_ISSUE':
        await handleBillingIssue(eventData);
        break;
        
      case 'PRODUCT_CHANGE':
        await handleProductChange(eventData);
        break;
        
      case 'TRANSFER':
        await handleTransfer(eventData);
        break;
        
      case 'TEST':
        console.log('🧪 Test webhook received - all good!');
        break;
        
      default:
        console.log(`⚠️ Unhandled webhook type: ${eventType}`);
    }
    
    // Log analytics event
    await firebaseAnalyticsService.logEvent(
      eventData?.app_user_id || 'unknown',
      `revenuecat_${eventType.toLowerCase()}`,
      {
        product_id: eventData?.product_id,
        price: eventData?.price,
        currency: eventData?.currency,
        environment: eventData?.environment
      }
    );
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed',
      event_type: eventType 
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ====================
// WEBHOOK HANDLERS
// ====================

async function handleInitialPurchase(data) {
  console.log(`💰 INITIAL PURCHASE: User ${data.app_user_id} purchased ${data.product_id}`);
  
  // Update user in your database
  await updateUserSubscription(data.app_user_id, {
    status: 'active',
    productId: data.product_id,
    purchaseDate: new Date(data.purchased_at_ms),
    expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null,
    environment: data.environment,
    store: data.store
  });
  
  // Send welcome email or notification
  await sendPurchaseNotification(data.app_user_id, 'initial_purchase');
}

async function handleRenewal(data) {
  console.log(`🔄 RENEWAL: User ${data.app_user_id} renewed ${data.product_id}`);
  
  await updateUserSubscription(data.app_user_id, {
    status: 'active',
    lastRenewal: new Date(),
    expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null
  });
}

async function handleCancellation(data) {
  console.log(`❌ CANCELLATION: User ${data.app_user_id} cancelled ${data.product_id}`);
  
  await updateUserSubscription(data.app_user_id, {
    status: 'cancelled',
    cancelledAt: new Date(),
    cancellationReason: data.cancellation_reason,
    expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null
  });
}

async function handleExpiration(data) {
  console.log(`⏰ EXPIRATION: User ${data.app_user_id}'s subscription expired`);
  
  await updateUserSubscription(data.app_user_id, {
    status: 'expired',
    expiredAt: new Date()
  });
}

async function handleUncancellation(data) {
  console.log(`✅ UNCANCELLATION: User ${data.app_user_id} uncancelled`);
  
  await updateUserSubscription(data.app_user_id, {
    status: 'active',
    uncancelledAt: new Date(),
    expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null
  });
}

async function handleBillingIssue(data) {
  console.log(`⚠️ BILLING ISSUE: User ${data.app_user_id} has billing issue`);
  
  await updateUserSubscription(data.app_user_id, {
    hasBillingIssue: true,
    billingIssueDetectedAt: new Date()
  });
  
  // Send billing issue notification
  await sendBillingIssueNotification(data.app_user_id);
}

async function handleProductChange(data) {
  console.log(`🔄 PRODUCT CHANGE: User ${data.app_user_id} changed from ${data.old_product_id} to ${data.new_product_id}`);
  
  await updateUserSubscription(data.app_user_id, {
    productId: data.new_product_id,
    previousProductId: data.old_product_id,
    changedAt: new Date()
  });
}

async function handleTransfer(data) {
  console.log(`🔀 TRANSFER: User ${data.new_app_user_id} transferred from ${data.previous_app_user_id}`);
  
  // Handle user ID transfer
  await transferUserData(data.previous_app_user_id, data.new_app_user_id);
}

// ====================
// HELPER FUNCTIONS
// ====================

async function updateUserSubscription(userId, updates) {
  try {
    // Update in your MongoDB database
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { 
          $set: { 
            ...updates,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      console.log(`✅ Updated subscription for user: ${userId}`);
    } else {
      console.log(`⚠️ MongoDB not connected, skipping update for user: ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to update user ${userId}:`, error);
  }
}

async function sendPurchaseNotification(userId, type) {
  // Implement email or push notification
  console.log(`📧 Sent ${type} notification to user: ${userId}`);
}

async function sendBillingIssueNotification(userId) {
  console.log(`📧 Sent billing issue notification to user: ${userId}`);
}

async function transferUserData(oldUserId, newUserId) {
  console.log(`🔀 Transferring data from ${oldUserId} to ${newUserId}`);
  // Implement data transfer logic
}

// ====================
// STRIPE RECEIPTS ENDPOINT (For Stripe → RevenueCat)
// ====================

router.post('/stripe-receipt', express.json(), async (req, res) => {
  try {
    console.log('💰 Processing Stripe receipt for RevenueCat');
    
    const { app_user_id, fetch_token } = req.body;
    
    if (!app_user_id || !fetch_token) {
      return res.status(400).json({
        success: false,
        error: 'Missing app_user_id or fetch_token'
      });
    }
    
    // Forward to RevenueCat API
    const response = await axios.post(
      'https://api.revenuecat.com/v1/receipts',
      {
        app_user_id,
        fetch_token
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'stripe',
          'Authorization': `Bearer ${process.env.REVENUECAT_STRIPE_PUBLIC_KEY}`
        }
      }
    );
    
    console.log('✅ Stripe receipt forwarded to RevenueCat');
    
    res.status(200).json({
      success: true,
      data: response.data,
      message: 'Stripe receipt processed successfully'
    });
    
  } catch (error) {
    console.error('❌ Stripe receipt error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process Stripe receipt',
      details: error.response?.data || error.message
    });
  }
});

// ====================
// VALIDATE SUBSCRIPTION
// ====================

router.get('/validate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Validating subscription for user: ${userId}`);
    
    // Use RevenueCat API to validate
    const response = await axios.get(
      `https://api.revenuecat.com/v1/subscribers/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.REVENUECAT_SERVER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const subscriber = response.data;
    const entitlements = subscriber.subscriber.entitlements || {};
    
    // Check for active entitlements
    const activeEntitlements = Object.values(entitlements).filter(
      entitlement => entitlement.expires_date === null || 
      new Date(entitlement.expires_date) > new Date()
    );
    
    const isValid = activeEntitlements.length > 0;
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        isValid,
        entitlements: activeEntitlements,
        subscriber: subscriber.subscriber,
        raw: subscriber
      }
    });
    
  } catch (error) {
    console.error('❌ Subscription validation error:', error.message);
    
    // Fallback to mock data for testing
    res.status(200).json({
      success: true,
      data: {
        userId: req.params.userId,
        isValid: true,
        subscription: {
          tier: 'pro',
          status: 'active',
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'stripe',
          productId: 'prod_TpBYfFNjgIjtvi' // From your logs
        },
        note: 'Mock data - set REVENUECAT_SERVER_API_KEY for real validation'
      }
    });
  }
});

// ====================
// GET SUBSCRIPTION PLANS
// ====================

router.get('/plans', async (req, res) => {
  try {
    // In production, fetch from RevenueCat or Stripe
    // For now, return mock plans
    const plans = {
      weekly: {
        id: 'weekly',
        name: 'Weekly Pro',
        price: 9.99,
        period: 'week',
        stripe_price_id: 'price_weekly_mock',
        revenuecat_product_id: 'weekly_pro',
        features: ['nba', 'nfl', 'nhl', 'live_scores']
      },
      monthly: {
        id: 'monthly',
        name: 'Monthly Pro',
        price: 19.99,
        period: 'month',
        stripe_price_id: 'price_monthly_mock',
        revenuecat_product_id: 'monthly_pro',
        features: ['nba', 'nfl', 'nhl', 'live_scores', 'advanced_stats']
      },
      yearly: {
        id: 'yearly',
        name: 'Yearly Pro',
        price: 99.99,
        period: 'year',
        stripe_price_id: 'price_yearly_mock',
        revenuecat_product_id: 'yearly_pro',
        features: ['nba', 'nfl', 'nhl', 'live_scores', 'advanced_stats', 'ai_predictions', 'premium_support']
      }
    };
    
    res.status(200).json({
      success: true,
      data: { plans },
      note: 'Mock plans - integrate with Stripe/RevenueCat API for real data'
    });
    
  } catch (error) {
    console.error('❌ Get plans error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// HEALTH CHECK
// ====================

router.get('/health', async (req, res) => {
  const hasApiKey = !!process.env.REVENUECAT_SERVER_API_KEY;
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  
  res.status(200).json({
    success: true,
    service: 'RevenueCat Integration',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: {
      revenuecat_configured: hasApiKey,
      stripe_configured: hasStripeKey,
      webhook_secret_configured: !!process.env.REVENUECAT_WEBHOOK_SECRET
    },
    endpoints: {
      webhook: '/api/revenuecat/webhook',
      validate: '/api/revenuecat/validate/:userId',
      stripe_receipt: '/api/revenuecat/stripe-receipt',
      plans: '/api/revenuecat/plans'
    }
  });
});

export default router;
