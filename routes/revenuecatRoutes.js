// routes/revenuecatRoutes.js - Complete with Stripe integration
import mongoose from 'mongoose';
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import revenuecatService from '../services/revenuecatService.js';
import firebaseAnalyticsService from '../services/firebaseAnalyticsService.js';

const router = express.Router();

// ====================
// REVENUECAT WEBHOOK ENDPOINT (Updated with Bearer Authorization)
// ====================

// RevenueCat webhook endpoint - Updated to use Bearer Authorization header
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('🔄 RevenueCat webhook received');
    
    // 1. Get raw body as string for authorization check
    const rawBody = req.body.toString('utf8');
    
    // 2. Check AUTHORIZATION HEADER (Bearer token)
    const authHeader = req.headers['authorization'];
    const yourWebhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET; // Should be 'RC_WhSec_...'
    const expectedHeader = `Bearer ${yourWebhookSecret}`;
    
    // 3. Validate in production
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== expectedHeader) {
        console.error('❌ Webhook auth failed. Received:', authHeader);
        return res.status(401).json({ success: false, error: 'Invalid authorization' });
      }
    } else {
      // In development, just log what we got
      console.log('🔐 Auth Header (Dev):', authHeader);
    }
    
    // 4. ONLY NOW parse the raw body to JSON
    const payload = JSON.parse(rawBody);
    console.log('✅ Webhook received:', payload.type);
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
// STRIPE RECEIPTS ENDPOINT (For Stripe → RevenueCat) - Updated with correct key
// ====================

router.post('/stripe-receipt', express.json(), async (req, res) => {
  try {
    const { app_user_id, fetch_token } = req.body;
    
    if (!app_user_id || !fetch_token) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    
    // KEY CHANGE: Use the REVENUECAT_STRIPE_PUBLIC_KEY (rcb_...)
    const revenuecatStripeKey = process.env.REVENUECAT_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!revenuecatStripeKey) {
      console.error('❌ Missing RevenueCat Stripe key');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Stripe key'
      });
    }
    
    const response = await axios.post(
      'https://api.revenuecat.com/v1/receipts',
      { app_user_id, fetch_token },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'stripe',
          'Authorization': `Bearer ${revenuecatStripeKey}` // Use rcb_ key here
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
    res.status(502).json({
      success: false,
      error: 'Failed to forward to RevenueCat API',
      details: error.response?.data || error.message
    });
  }
});

// ====================
// APPLE RECEIPT VALIDATION ENDPOINT (Uses Apple Shared Secret)
// ====================

/**
 * Endpoint to validate Apple receipts using Apple Shared Secret
 * This is separate from webhook verification
 */
router.post('/validate-apple-receipt', express.json(), async (req, res) => {
  try {
    const { receipt_data } = req.body;
    
    if (!receipt_data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing receipt_data' 
      });
    }
    
    // Validate with Apple App Store using Apple Shared Secret
    const appleResponse = await axios.post(
      'https://buy.itunes.apple.com/verifyReceipt', // Sandbox: https://sandbox.itunes.apple.com/verifyReceipt
      {
        'receipt-data': receipt_data,
        'password': process.env.REVENUECAT_APPLE_SHARED_SECRET || process.env.APPLE_SHARED_SECRET, // Use Apple shared secret here
        'exclude-old-transactions': true
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: appleResponse.data,
      message: 'Apple receipt validated'
    });
    
  } catch (error) {
    console.error('❌ Apple receipt validation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to validate Apple receipt',
      details: error.message
    });
  }
});

// ====================
// WEBHOOK HANDLERS (Keep existing handlers)
// ====================

async function handleInitialPurchase(data) {
  console.log(`💰 INITIAL PURCHASE: User ${data.app_user_id} purchased ${data.product_id}`);
  
  await updateUserSubscription(data.app_user_id, {
    status: 'active',
    productId: data.product_id,
    purchaseDate: new Date(data.purchased_at_ms),
    expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null,
    environment: data.environment,
    store: data.store
  });
  
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
  
  await transferUserData(data.previous_app_user_id, data.new_app_user_id);
}

// ====================
// HELPER FUNCTIONS (Keep existing)
// ====================

async function updateUserSubscription(userId, updates) {
  try {
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
  console.log(`📧 Sent ${type} notification to user: ${userId}`);
}

async function sendBillingIssueNotification(userId) {
  console.log(`📧 Sent billing issue notification to user: ${userId}`);
}

async function transferUserData(oldUserId, newUserId) {
  console.log(`🔀 Transferring data from ${oldUserId} to ${newUserId}`);
}

// ====================
// HEALTH CHECK (Updated)
// ====================

router.get('/health', async (req, res) => {
  const hasApiKey = !!process.env.REVENUECAT_SERVER_API_KEY;
  const hasAppleSecret = !!process.env.REVENUECAT_APPLE_SHARED_SECRET;
  const hasWebhookSecret = !!process.env.REVENUECAT_WEBHOOK_SECRET;
  const hasStripeKey = !!process.env.REVENUECAT_STRIPE_PUBLIC_KEY || !!process.env.STRIPE_PUBLISHABLE_KEY;
  
  res.status(200).json({
    success: true,
    service: 'RevenueCat Integration',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: {
      revenuecat_api_key_configured: hasApiKey,
      apple_shared_secret_configured: hasAppleSecret,
      webhook_secret_configured: hasWebhookSecret,
      stripe_public_key_configured: hasStripeKey
    },
    endpoints: {
      webhook: '/api/revenuecat/webhook',
      validate: '/api/revenuecat/validate/:userId',
      stripe_receipt: '/api/revenuecat/stripe-receipt',
      plans: '/api/revenuecat/plans',
      apple_receipt_validation: '/api/revenuecat/validate-apple-receipt'
    }
  });
});

// ====================
// EXISTING ENDPOINTS (Keep existing)
// ====================

router.get('/validate/:userId', async (req, res) => {
  // Keep existing validate endpoint code
  try {
    const { userId } = req.params;
    console.log(`🔍 Validating subscription for user: ${userId}`);
    
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
          productId: 'prod_TpBYfFNjgIjtvi'
        },
        note: 'Mock data - set REVENUECAT_SERVER_API_KEY for real validation'
      }
    });
  }
});

router.get('/plans', async (req, res) => {
  // Keep existing plans endpoint code
  try {
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

export default router;
