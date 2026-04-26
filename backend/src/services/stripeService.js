/**
 * StripeService.js
 * 
 * Stripe payment operations for subscriptions
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const User = require('../models/User');
const Payment = require('../models/Payment');

class StripeService {
  /**
   * Create payment intent for subscription
   */
  static async createSubscriptionPaymentIntent(userId, planDuration, amount) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert dollars to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          userId: userId.toString(),
          planDuration: planDuration,
          type: 'subscription',
        },
        description: `Premium subscription - ${planDuration} month(s)`,
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm subscription payment and upgrade user
   */
  static async confirmSubscriptionPayment(paymentIntentId, userId) {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
      }

      // Verify the payment belongs to the user
      if (paymentIntent.metadata.userId !== userId.toString()) {
        throw new Error('Payment intent does not belong to this user');
      }

      // Get user and upgrade
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const planDuration = parseInt(paymentIntent.metadata.planDuration);

      // Upgrade user to premium
      user.upgradeToPremium(planDuration);
      await user.save();

      // Create payment record
      const payment = await Payment.create({
        user: userId,
        type: 'subscription',
        planDuration,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        currency: paymentIntent.currency.toUpperCase(),
        status: 'completed',
        paymentMethod: 'stripe',
        paymentIntentId: paymentIntentId,
        description: `Premium subscription - ${planDuration} month(s)`,
        paidAt: new Date(),
        expiresAt: user.premiumExpiresAt,
      });

      return {
        success: true,
        user: user.getPublicProfile(),
        payment: payment,
        subscription: {
          isPremium: user.isPremium,
          planDuration: user.planDuration,
          expiresAt: user.premiumExpiresAt,
        },
      };
    } catch (error) {
      throw new Error(`Failed to confirm subscription payment: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('Payment intent succeeded:', event.data.object.id);
          // Already handled by confirmSubscriptionPayment
          break;

        case 'payment_intent.payment_failed':
          console.log('Payment intent failed:', event.data.object.id);
          // Update payment record
          await Payment.findOneAndUpdate(
            { paymentIntentId: event.data.object.id },
            { status: 'failed' }
          );
          break;

        case 'charge.refunded':
          console.log('Charge refunded:', event.data.object.id);
          // Handle refund logic
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Webhook handler error: ${error.message}`);
    }
  }

  /**
   * Create refund for a payment
   */
  static async refundPayment(paymentIntentId) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Update payment record
      await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntentId },
        { status: 'refunded', refundedAt: new Date(), refundId: refund.id }
      );

      return refund;
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Retrieve payment intent details
   */
  static async getPaymentIntentDetails(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Get Stripe public key (for frontend)
   */
  static getPublicKey() {
    const publicKey = process.env.STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('Stripe public key not configured');
    }
    return publicKey;
  }

  /**
   * Create Stripe Checkout session for category enrollment
   */
  static async createCheckoutSession(userId, categoryId, categoryName, price) {
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${categoryName} - Internship Enrollment`,
                description: `Enroll in internship: ${categoryName}`,
              },
              unit_amount: Math.round(price * 100), // Convert dollars to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/categories?cancelled=true`,
        customer_email: undefined, // Will be set from user, if needed
        metadata: {
          userId: userId.toString(),
          categoryId: categoryId.toString(),
          type: 'category_enrollment',
        },
      });

      return session;
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Handle Stripe Checkout session completion
   */
  static async handleCheckoutSessionCompleted(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        throw new Error(`Payment not completed. Status: ${session.payment_status}`);
      }

      const { userId, categoryId } = session.metadata;

      if (!userId || !categoryId) {
        throw new Error('Missing userId or categoryId in session metadata');
      }

      return {
        success: true,
        userId,
        categoryId,
        sessionId,
        amount: session.amount_total / 100, // Convert cents to dollars
        currency: session.currency.toUpperCase(),
      };
    } catch (error) {
      throw new Error(`Failed to handle checkout session: ${error.message}`);
    }
  }
}

module.exports = StripeService;
