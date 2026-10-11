import Stripe from 'stripe';
import { AppError } from '../../common/errors/AppError.js';

interface StripeConnectAccount {
  id: string;
  email: string;
  country: string;
  default_currency: string;
  capabilities: {
    transfers: { requested: boolean; pending?: boolean };
    card_payments?: { requested: boolean; pending?: boolean };
  };
  business_type: 'individual' | 'company';
  business_profile?: {
    name?: string;
    url?: string;
    mcc?: string;
    support_email?: string;
    support_phone?: string;
  };
  individual?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    dob?: {
      day: number;
      month: number;
      year: number;
    };
    verification?: {
      details?: string;
      details_code?: string;
      document?: string;
      status: 'pending' | 'verified' | 'failed';
    };
  };
  external_accounts?: {
    data: Array<{
      id: string;
      object: 'bank_account' | 'card';
      bank_name?: string;
      last4?: string;
      currency: string;
      status: 'new' | 'validated' | 'verified' | 'verification_failed' | 'errored';
    }>;
  };
  requirements?: {
    current_deadline?: number;
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
    disabled_reason?: string;
  };
  settings?: {
    payouts: {
      schedule: {
        interval: 'manual' | 'daily' | 'weekly' | 'monthly';
        delay_days?: number;
      };
    };
  };
}

interface StripeAccountLink {
  object: 'account_link';
  created: number;
  expires_at: number;
  url: string;
}

interface StripeLoginLink {
  object: 'login_link';
  created: number;
  url: string;
}

interface StripePayout {
  id: string;
  object: 'payout';
  amount: number;
  currency: string;
  arrival_date: number;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  destination: string;
  failure_code?: string;
  failure_message?: string;
  method: 'standard' | 'instant';
  source_type: 'bank_account' | 'card';
  statement_descriptor?: string;
}

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

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
    updates: Partial<StripeConnectAccount>
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

  async listPayouts(accountId: string, params?: {
    limit?: number;
    status?: string;
    created_after?: number;
    created_before?: number;
  }): Promise<StripePayout[]> {
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
      disabledReason: account.requirements?.disabled_reason,
    };
  }
}

export const stripeConnectService = new StripeConnectService();