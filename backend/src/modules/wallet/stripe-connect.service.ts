import Stripe from 'stripe';

// Stripe SDK types are the source of truth here.
type StripeConnectAccount = Stripe.Account;
type StripeAccountLink = Stripe.AccountLink;
type StripeLoginLink = Stripe.LoginLink;
type StripePayout = Stripe.Payout;
type StripeWebhookEvent = Stripe.Event;

class StripeConnectService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  // Account Creation
  async createExpressAccount(
    email: string,
    country: string,
    metadata: Record<string, string> = {}
  ): Promise<StripeConnectAccount> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email,
      country,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata,
    });
    return account;
  }

  // Account Link for Onboarding
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
    type: 'account_onboarding' | 'account_update' = 'account_onboarding'
  ): Promise<StripeAccountLink> {
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type,
    });
  }

  // Login Link for Dashboard
  async createLoginLink(accountId: string): Promise<StripeLoginLink> {
    return this.stripe.accounts.createLoginLink(accountId);
  }

  // Get Account Details
  async getAccount(accountId: string): Promise<StripeConnectAccount> {
    return this.stripe.accounts.retrieve(accountId);
  }

  async updateAccount(
    accountId: string,
    updates: Stripe.AccountUpdateParams
  ): Promise<StripeConnectAccount> {
    return this.stripe.accounts.update(accountId, updates);
  }

  // External Account (Bank Account) Management
  async createExternalAccount(
    accountId: string,
    bankAccount: {
      object: 'bank_account';
      country: string;
      currency: string;
      routing_number: string;
      account_number: string;
      account_holder_name: string;
      account_holder_type: 'individual' | 'company';
    }
  ): Promise<any> {
    return this.stripe.accounts.createExternalAccount(accountId, {
      external_account: bankAccount,
    });
  }

  async getExternalAccounts(accountId: string): Promise<any[]> {
    const accounts = await this.stripe.accounts.listExternalAccounts(accountId, {
      object: 'bank_account',
    });
    return accounts.data;
  }

  async deleteExternalAccount(accountId: string, externalAccountId: string): Promise<any> {
    return this.stripe.accounts.deleteExternalAccount(accountId, externalAccountId);
  }

  // Payout Management
  async createPayout(
    accountId: string,
    amount: number,
    currency: string,
    options?: {
      method?: 'standard' | 'instant';
      destination?: string;
      statement_descriptor?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<StripePayout> {
    return this.stripe.payouts.create(
      {
        amount,
        currency,
        ...options,
      },
      {
        stripeAccount: accountId,
      }
    );
  }

  async getPayout(accountId: string, payoutId: string): Promise<StripePayout> {
    return this.stripe.payouts.retrieve(payoutId, {
      stripeAccount: accountId,
    });
  }

  async listPayouts(accountId: string, params?: Stripe.PayoutListParams): Promise<StripePayout[]> {
    const payouts = await this.stripe.payouts.list(params, {
      stripeAccount: accountId,
    });
    return payouts.data;
  }

  // Webhook Verification
  verifyWebhookSignature(payload: string | Buffer, signature: string, endpointSecret: string): StripeWebhookEvent {
    return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  }

  // Account Status Check
  isAccountOnboardingComplete(account: StripeConnectAccount): boolean {
    return account.charges_enabled && account.payouts_enabled && account.details_submitted;
  }

  getAccountRequirements(account: StripeConnectAccount): {
    currentDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    disabledReason?: string;
  } {
    return {
      currentDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pastDue: account.requirements?.past_due || [],
      disabledReason: account.requirements?.disabled_reason ?? undefined,
    };
  }
}

export const stripeConnectService = new StripeConnectService();