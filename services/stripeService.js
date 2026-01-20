// services/stripeService.js
import Stripe from 'stripe';

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  
  async createCheckoutSession(userId, priceId) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: `${userId}@nbafantasyapp.com`,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://yourapp.com/cancel',
        metadata: {
          userId: userId
        }
      });
      
      return { success: true, sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('❌ Stripe checkout error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log(`🔔 Stripe webhook: ${event.type}`);
      
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Stripe webhook error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async handleCheckoutCompleted(session) {
    // Forward to RevenueCat
    const response = await axios.post(
      'https://api.revenuecat.com/v1/receipts',
      {
        app_user_id: session.metadata.userId,
        fetch_token: session.subscription
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'stripe',
          'Authorization': `Bearer ${process.env.REVENUECAT_SERVER_API_KEY}`
        }
      }
    );
    
    console.log(`✅ Stripe checkout forwarded to RevenueCat for user: ${session.metadata.userId}`);
  }
}

export default new StripeService();
