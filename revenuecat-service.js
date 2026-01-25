// services/revenuecat-service.js
import axios from 'axios';

class RevenueCatService {
  constructor() {
    this.apiKey = process.env.REVENUECAT_API_KEY;
    this.baseURL = 'https://api.revenuecat.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Get customer info
  async getCustomerInfo(userId) {
    try {
      const response = await this.client.get(`/subscribers/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer info:', error.response?.data || error.message);
      throw error;
    }
  }

  // Grant promotional entitlement
  async grantPromotionalEntitlement(userId, entitlement, duration = 'month') {
    try {
      const response = await this.client.post(`/subscribers/${userId}/entitlements`, {
        entitlement: entitlement,
        duration: duration
      });
      return response.data;
    } catch (error) {
      console.error('Error granting promotional entitlement:', error.response?.data || error.message);
      throw error;
    }
  }

  // Revoke promotional entitlement
  async revokePromotionalEntitlement(userId, entitlement) {
    try {
      const response = await this.client.delete(`/subscribers/${userId}/entitlements/${entitlement}`);
      return response.data;
    } catch (error) {
      console.error('Error revoking promotional entitlement:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get subscriber attributes
  async getSubscriberAttributes(userId) {
    try {
      const response = await this.client.get(`/subscribers/${userId}/attributes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscriber attributes:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update subscriber attributes
  async updateSubscriberAttributes(userId, attributes) {
    try {
      const response = await this.client.post(`/subscribers/${userId}/attributes`, attributes);
      return response.data;
    } catch (error) {
      console.error('Error updating subscriber attributes:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get subscription status
  async getSubscriptionStatus(userId) {
    try {
      const response = await this.client.get(`/subscribers/${userId}/subscriptions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error.response?.data || error.message);
      throw error;
    }
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId, productId = null) {
    try {
      const customerInfo = await this.getCustomerInfo(userId);
      const entitlements = customerInfo.entitlements || {};
      
      if (productId) {
        return entitlements[productId] && entitlements[productId].active;
      }
      
      // Check for any active entitlement
      return Object.values(entitlements).some(entitlement => entitlement.active);
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  // Get subscription expiration date
  async getSubscriptionExpiration(userId, productId) {
    try {
      const customerInfo = await this.getCustomerInfo(userId);
      const entitlement = customerInfo.entitlements?.[productId];
      
      if (entitlement && entitlement.active) {
        return entitlement.expires_date;
      }
      return null;
    } catch (error) {
      console.error('Error getting subscription expiration:', error);
      return null;
    }
  }

  // Get purchase history
  async getPurchaseHistory(userId) {
    try {
      const response = await this.client.get(`/subscribers/${userId}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase history:', error.response?.data || error.message);
      throw error;
    }
  }

  // Process refund (admin only)
  async processRefund(userId, transactionId) {
    try {
      const response = await this.client.post(`/subscribers/${userId}/transactions/${transactionId}/refund`);
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error.response?.data || error.message);
      throw error;
    }
  }

  // Validate receipt (for iOS)
  async validateReceipt(receiptData, platform = 'ios') {
    try {
      const response = await this.client.post('/receipts/validate', {
        receipt_data: receiptData,
        platform: platform
      });
      return response.data;
    } catch (error) {
      console.error('Error validating receipt:', error.response?.data || error.message);
      throw error;
    }
  }

  // Webhook handler for RevenueCat events
  async handleWebhook(event) {
    const { type, data } = event;
    
    switch (type) {
      case 'INITIAL_PURCHASE':
        return this.handleInitialPurchase(data);
      case 'RENEWAL':
        return this.handleRenewal(data);
      case 'CANCELLATION':
        return this.handleCancellation(data);
      case 'UNCANCELLATION':
        return this.handleUncancellation(data);
      case 'EXPIRATION':
        return this.handleExpiration(data);
      case 'BILLING_ISSUE':
        return this.handleBillingIssue(data);
      case 'PRODUCT_CHANGE':
        return this.handleProductChange(data);
      default:
        console.log('Unhandled webhook event type:', type);
        return { success: true, message: 'Event received but not processed' };
    }
  }

  // Webhook event handlers
  async handleInitialPurchase(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Initial purchase:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }

  async handleRenewal(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Subscription renewal:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }

  async handleCancellation(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Subscription cancelled:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }

  async handleUncancellation(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Subscription uncancelled:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }

  async handleExpiration(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Subscription expired:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }

  async handleBillingIssue(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Billing issue:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }

  async handleProductChange(data) {
    const { subscriber, event_timestamp_ms } = data;
    console.log('Product changed:', subscriber.user_id);
    // Add your business logic here
    return { success: true };
  }
}

export default new RevenueCatService();
