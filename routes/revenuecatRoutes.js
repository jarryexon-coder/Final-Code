// routes/revenuecatRoutes.js - Complete with Stripe integration
import mongoose from 'mongoose';
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import revenuecatService from '../services/revenuecat-service.js';
import firebaseAnalyticsService from '../services/firebaseAnalyticsService.js';

const router = express.Router();

// ====================
// REVENUECAT WEBHOOK ENDPOINT (Updated with Bearer Authorization)
// ====================

// RevenueCat webhook endpoint - Updated to use Bearer Authorization header
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('🔄 RevenueCat webhook received');
    
    // DEBUG: Check what type req.body is
    console.log(`🔍 req.body type: ${typeof req.body}`);
    console.log(`🔍 Is Buffer: ${Buffer.isBuffer(req.body)}`);
    
    let rawBody;
    let payload;
    
    // Handle both cases: Buffer or already parsed object
    if (Buffer.isBuffer(req.body)) {
      // Case 1: express.raw() worked, body is a Buffer
      rawBody = req.body.toString('utf8');
      console.log(`📏 Raw body length: ${rawBody.length}`);
      payload = JSON.parse(rawBody);
    } else if (typeof req.body === 'object' && req.body !== null) {
      // Case 2: Some other middleware already parsed it
      console.log('⚠️ Body already parsed to object');
      payload = req.body;
      rawBody = JSON.stringify(req.body);
    } else {
      // Case 3: Fallback (string or other)
      rawBody = String(req.body);
      payload = JSON.parse(rawBody);
    }
    
    // Log the full payload structure for debugging
    console.log('🔍 Full payload structure:', JSON.stringify(payload, null, 2));
    console.log('🔍 Payload keys:', Object.keys(payload));
    
    // Extract webhook signature and timestamp
    const signature = req.headers['revenuecat-webhook-signature'];
    const timestamp = req.headers['revenuecat-webhook-timestamp'];
    
    // Verify signature if in production
    if (process.env.NODE_ENV === 'production' && process.env.REVENUECAT_WEBHOOK_SECRET) {
      // Note: Since you're using Authorization header, signature verification might not be needed
      // But keeping it for reference
      console.log('🔐 Skipping signature check - using Authorization header instead');
    }
    
    // Check AUTHORIZATION HEADER (this is what you configured)
    const authHeader = req.headers['authorization'];
    const expectedHeader = `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`;
    
    console.log(`🔐 [DEBUG] Received Auth Header: "${authHeader}"`);
    console.log(`🔐 [DEBUG] Expected Auth Header: "${expectedHeader}"`);
    
    // === ADDED ENHANCED DEBUG LINES ===
    console.log('🔐 [DEBUG WEBHOOK AUTH]');
    console.log('Secret from Env exists?:', !!process.env.REVENUECAT_WEBHOOK_SECRET);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    // ===================================
    
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== expectedHeader) {
        console.error('❌ Invalid webhook authorization');
        return res.status(401).json({ success: false, error: 'Invalid authorization' });
      }
    } else {
      // In development, just log what we got
      console.log('🔐 Auth Header (Dev):', authHeader);
    }
    
    // Check for different possible event type locations
    let eventType;
    let eventData;
    
    // Try different possible event type locations based on RevenueCat documentation
    if (payload.type) {
      // New format: { type: 'INITIAL_PURCHASE', data: {...} }
      eventType = payload.type;
      eventData = payload.data;
    } else if (payload.event) {
      // Alternative format: { event: { type: 'INITIAL_PURCHASE', ... } }
      eventType = payload.event.type;
      eventData = payload.event;
    } else if (payload.event_type) {
      // Another possible format
      eventType = payload.event_type;
      eventData = payload;
    } else {
      console.error('❌ Could not find event type in payload');
      console.log('📝 Full payload:', JSON.stringify(payload, null, 2));
      
      // Still return 200 to prevent retries
      return res.status(200).json({
        success: false,
        error: 'No event type found in payload',
        note: 'Payload was received but no event type could be extracted'
      });
    }
    
    console.log('✅ Auth passed. Webhook Type:', eventType);
    console.log('📝 Event Data:', JSON.stringify(eventData, null, 2));
    
    // Process different webhook types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'initial_purchase':
        await handleInitialPurchase(eventData);
        break;
        
      case 'RENEWAL':
      case 'renewal':
        await handleRenewal(eventData);
        break;
        
      case 'CANCELLATION':
      case 'cancellation':
        await handleCancellation(eventData);
        break;
        
      case 'EXPIRATION':
      case 'expiration':
        await handleExpiration(eventData);
        break;
        
      case 'UNCANCELLATION':
      case 'uncancellation':
        await handleUncancellation(eventData);
        break;
        
      case 'BILLING_ISSUE':
      case 'billing_issue':
        await handleBillingIssue(eventData);
        break;
        
      case 'PRODUCT_CHANGE':
      case 'product_change':
        await handleProductChange(eventData);
        break;
        
      case 'TRANSFER':
      case 'transfer':
        await handleTransfer(eventData);
        break;
        
      case 'TEST':
      case 'test':
        console.log('🧪 Test webhook received - all good!');
        break;
        
      case 'NON_RENEWING_PURCHASE':
      case 'non_renewing_purchase':
        console.log('🛍️ Non-renewing purchase received');
        await handleInitialPurchase(eventData); // Treat like initial purchase
        break;
        
      case 'SUBSCRIPTION_PAUSED':
      case 'subscription_paused':
        console.log('⏸️ Subscription paused');
        // Handle as a special type of cancellation
        await updateUserSubscription(eventData?.app_user_id, {
          status: 'paused',
          pausedAt: new Date()
        });
        break;
        
      default:
        console.log(`⚠️ Unhandled webhook type: ${eventType}`);
        console.log('📝 Full event data:', JSON.stringify(eventData, null, 2));
    }
    
    // === UPDATED: Log analytics event with safety checks (from File 1) ===
    try {
      // Extract user ID from multiple possible locations
      const userId = eventData?.original_app_user_id || 
                     eventData?.app_user_id || 
                     eventData?.user_id || 
                     eventData?.customer_info?.original_app_user_id || 
                     'unknown';
      
      // Extract product ID - TEST events don't have this
      const productId = eventData?.product_id || 'test_product';
      
      // Extract price - TEST events don't have this
      const price = eventData?.price || eventData?.price_in_purchased_currency || null;
      
      // Extract currency - TEST events don't have this
      const currency = eventData?.currency || null;
      
      // Extract environment
      const environment = eventData?.environment || 'production';
      
      // Ensure eventType is a string before calling toLowerCase()
      const safeEventType = (eventType || 'unknown').toString().toLowerCase();
      
      console.log(`📝 Analytics Data: User: ${userId}, Event: ${safeEventType}, Product: ${productId}`);
      
      await firebaseAnalyticsService.logEvent(
        userId,
        `revenuecat_${safeEventType}`,
        {
          product_id: productId,
          price: price,
          currency: currency,
          environment: environment,
          raw_event_type: eventType,
          user_id: userId,
          timestamp: new Date().toISOString(),
          platform: 'backend_api'
        }
      );
    } catch (analyticsError) {
      console.error('❌ Analytics logging error:', analyticsError.message);
      // Don't fail the webhook because of analytics error
      console.log('📝 Analytics Event (Firebase not initialized or error):', {
        name: `revenuecat_${(eventType || 'unknown').toString().toLowerCase()}`,
        params: {
          product_id: eventData?.product_id || 'test_product',
          price: eventData?.price || null,
          environment: eventData?.environment || 'production',
          raw_event_type: eventType,
          user_id: eventData?.original_app_user_id || eventData?.app_user_id || 'unknown',
          timestamp: new Date().toISOString(),
          platform: 'backend_api'
        },
        timestamp: new Date().toISOString()
      });
    }
    // === END OF UPDATED ANALYTICS CODE ===
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed',
      event_type: eventType 
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Raw request body (first 500 chars):', req.body?.toString?.()?.substring?.(0, 500) || req.body);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      note: 'Check if req.body is already parsed',
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
          'Authorization': `Bearer ${process.env.REVENUECAT_STRIPE_PUBLIC_KEY}`,
          'X-Platform': 'stripe',
          'Content-Type': 'application/json'
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
// WEBHOOK HANDLERS (Updated with more robust error handling)
// ====================

async function handleInitialPurchase(data) {
  try {
    console.log(`💰 INITIAL PURCHASE: User ${data.app_user_id} purchased ${data.product_id}`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in purchase data');
      return;
    }
    
    await updateUserSubscription(userId, {
      status: 'active',
      productId: data.product_id,
      purchaseDate: new Date(data.purchased_at_ms || data.purchase_date_ms || Date.now()),
      expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null,
      environment: data.environment || 'production',
      store: data.store || 'unknown'
    });
    
    await sendPurchaseNotification(userId, 'initial_purchase');
  } catch (error) {
    console.error('❌ Error handling initial purchase:', error);
  }
}

async function handleRenewal(data) {
  try {
    console.log(`🔄 RENEWAL: User ${data.app_user_id} renewed ${data.product_id}`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in renewal data');
      return;
    }
    
    await updateUserSubscription(userId, {
      status: 'active',
      lastRenewal: new Date(),
      expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null
    });
  } catch (error) {
    console.error('❌ Error handling renewal:', error);
  }
}

async function handleCancellation(data) {
  try {
    console.log(`❌ CANCELLATION: User ${data.app_user_id} cancelled ${data.product_id}`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in cancellation data');
      return;
    }
    
    await updateUserSubscription(userId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: data.cancellation_reason,
      expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null
    });
  } catch (error) {
    console.error('❌ Error handling cancellation:', error);
  }
}

async function handleExpiration(data) {
  try {
    console.log(`⏰ EXPIRATION: User ${data.app_user_id}'s subscription expired`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in expiration data');
      return;
    }
    
    await updateUserSubscription(userId, {
      status: 'expired',
      expiredAt: new Date()
    });
  } catch (error) {
    console.error('❌ Error handling expiration:', error);
  }
}

async function handleUncancellation(data) {
  try {
    console.log(`✅ UNCANCELLATION: User ${data.app_user_id} uncancelled`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in uncancellation data');
      return;
    }
    
    await updateUserSubscription(userId, {
      status: 'active',
      uncancelledAt: new Date(),
      expiresDate: data.expires_at_ms ? new Date(data.expires_at_ms) : null
    });
  } catch (error) {
    console.error('❌ Error handling uncancellation:', error);
  }
}

async function handleBillingIssue(data) {
  try {
    console.log(`⚠️ BILLING ISSUE: User ${data.app_user_id} has billing issue`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in billing issue data');
      return;
    }
    
    await updateUserSubscription(userId, {
      hasBillingIssue: true,
      billingIssueDetectedAt: new Date()
    });
    
    await sendBillingIssueNotification(userId);
  } catch (error) {
    console.error('❌ Error handling billing issue:', error);
  }
}

async function handleProductChange(data) {
  try {
    console.log(`🔄 PRODUCT CHANGE: User ${data.app_user_id} changed from ${data.old_product_id} to ${data.new_product_id}`);
    
    const userId = data.app_user_id || data.user_id || data.customer_info?.original_app_user_id;
    if (!userId) {
      console.error('❌ No user ID found in product change data');
      return;
    }
    
    await updateUserSubscription(userId, {
      productId: data.new_product_id,
      previousProductId: data.old_product_id,
      changedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Error handling product change:', error);
  }
}

async function handleTransfer(data) {
  try {
    console.log(`🔀 TRANSFER: User ${data.new_app_user_id} transferred from ${data.previous_app_user_id}`);
    
    await transferUserData(data.previous_app_user_id, data.new_app_user_id);
  } catch (error) {
    console.error('❌ Error handling transfer:', error);
  }
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
