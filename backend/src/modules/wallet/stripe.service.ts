import Stripe from 'stripe';
import { AppError } from '../../common/errors/AppError.js';

let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new AppError('Stripe secret key not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }
  return stripeInstance;
};

export const stripeService = {
  createPaymentIntent: async (amountCents: number, currency: string, metadata: Record<string, string>, idempotencyKey: string) => {
    const stripe = getStripe();
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: { enabled: true },
      }, {
        idempotencyKey,
      });
      return paymentIntent;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe error: ${error.message}`, 400, 'STRIPE_ERROR');
      }
      throw error;
    }
  },

  confirmPaymentIntent: async (paymentIntentId: string, paymentMethodId?: string) => {
    const stripe = getStripe();
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, params);
      return paymentIntent;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe error: ${error.message}`, 400, 'STRIPE_ERROR');
      }
      throw error;
    }
  },

  createRefund: async (paymentIntentId: string, amountCents?: number, reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer') => {
    const stripe = getStripe();
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountCents,
        reason,
      });
      return refund;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe refund error: ${error.message}`, 400, 'STRIPE_REFUND_ERROR');
      }
      throw error;
    }
  },

  getPaymentIntent: async (paymentIntentId: string) => {
    const stripe = getStripe();
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe error: ${error.message}`, 400, 'STRIPE_ERROR');
      }
      throw error;
    }
  },

  createCustomer: async (email: string, name: string, metadata: Record<string, string> = {}) => {
    const stripe = getStripe();
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata,
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe customer error: ${error.message}`, 400, 'STRIPE_CUSTOMER_ERROR');
      }
      throw error;
    }
  },

  createConnectedAccount: async (email: string, country: string, metadata: Record<string, string> = {}) => {
    const stripe = getStripe();
    try {
      return await stripe.accounts.create({
        type: 'express',
        email,
        country,
        capabilities: {
          transfers: { requested: true },
        },
        metadata,
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe account error: ${error.message}`, 400, 'STRIPE_ACCOUNT_ERROR');
      }
      throw error;
    }
  },

  createAccountLink: async (accountId: string, refreshUrl: string, returnUrl: string) => {
    const stripe = getStripe();
    try {
      return await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe account link error: ${error.message}`, 400, 'STRIPE_ACCOUNT_LINK_ERROR');
      }
      throw error;
    }
  },

  createPayout: async (amountCents: number, currency: string, destinationAccountId: string, metadata: Record<string, string> = {}) => {
    const stripe = getStripe();
    try {
      return await stripe.payouts.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        destination: destinationAccountId,
        metadata,
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Stripe payout error: ${error.message}`, 400, 'STRIPE_PAYOUT_ERROR');
      }
      throw error;
    }
  },

  verifyWebhookSignature: (payload: string | Buffer, signature: string, endpointSecret: string): Stripe.Event => {
    const stripe = getStripe();
    try {
      return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        throw new AppError('Webhook signature verification failed', 400, 'INVALID_WEBHOOK_SIGNATURE');
      }
      throw error;
    }
  },

  calculatePlatformFee: (amountCents: number, feePercent: number = 10): number => {
    return Math.round(amountCents * (feePercent / 100));
  },

  formatAmountForStripe: (amountCents: number): number => {
    return amountCents; // Stripe expects amount in smallest currency unit (cents for USD)
  },

  formatAmountFromStripe: (amount: number): number => {
    return amount; // Stripe returns amount in smallest currency unit
  },
};