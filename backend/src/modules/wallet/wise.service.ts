import { AppError } from '../../common/errors/AppError.js';

interface WiseCredentials {
  apiToken: string;
  baseUrl: string;
}

interface WiseProfile {
  id: number;
  type: 'personal' | 'business';
  details: {
    legalName: string;
    email: string;
    phoneNumber?: string;
  };
}

interface WiseRecipient {
  id: number;
  profile: number;
  accountHolderName: string;
  currency: string;
  type: 'bank_account' | 'email' | 'phone';
  details: {
    legalType: 'PRIVATE' | 'BUSINESS';
    sortCode?: string;
    accountNumber?: string;
    iban?: string;
    swiftBic?: string;
    bankName?: string;
    bankAddress?: string;
    bankCountry?: string;
    routingNumber?: string;
    accountType?: 'CHECKING' | 'SAVINGS';
    address?: {
      country: string;
      city: string;
      postCode: string;
      firstLine: string;
    };
  };
}

interface WiseQuote {
  id: number;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  fee: number;
  payInMethod: string;
  payOutMethod: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface WiseTransfer {
  id: number;
  profile: number;
  targetAccount: number;
  quote: number;
  reference: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'bounced' | 'charged_back' | 'refunded';
  statusDescription?: string;
  createdAt: string;
  completedAt?: string;
  cancellationReason?: string;
}

interface WiseWebhookEvent {
  event_type: 'transfers#state-change' | 'balances#credit' | 'transfers#cancelled' | 'batch-transfers#state-change';
  schema_version: string;
  sent_at: string;
  data: {
    resource: {
      id: number;
      profile: number;
      status: string;
      created: string;
      updated: string;
      reference: string;
      source_currency: string;
      target_currency: string;
      source_amount: number;
      target_amount: number;
      rate: number;
      fee: number;
      failure_reason?: string;
    };
    current_state: string;
    previous_state: string;
    occurred_at: string;
  };
}

class WiseService {
  private credentials: WiseCredentials;
  private baseUrl: string;

  constructor() {
    this.credentials = {
      apiToken: process.env.WISE_API_TOKEN || '',
      baseUrl: process.env.WISE_BASE_URL || 'https://api.transferwise.com',
    };
    this.baseUrl = this.credentials.baseUrl;

    if (!this.credentials.apiToken) {
      console.warn('Wise API token not configured');
    }
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    if (!this.credentials.apiToken) {
      throw new AppError('Wise API token not configured', 500, 'WISE_NOT_CONFIGURED');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.credentials.apiToken}`,
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new AppError(
          `Wise API error: ${data.errors?.[0]?.message || data.message || 'Unknown error'}`,
          response.status,
          'WISE_API_ERROR'
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Wise request failed: ${error}`, 500, 'WISE_REQUEST_FAILED');
    }
  }

  // Profile Management
  async getProfile(): Promise<WiseProfile> {
    return this.request<WiseProfile>('GET', '/v1/profiles');
  }

  async getProfiles(): Promise<WiseProfile[]> {
    return this.request<WiseProfile[]>('GET', '/v1/profiles');
  }

  // Recipient Management
  async createRecipient(recipient: Omit<WiseRecipient, 'id'>): Promise<WiseRecipient> {
    return this.request<WiseRecipient>('POST', '/v1/accounts', recipient);
  }

  async getRecipient(id: number): Promise<WiseRecipient> {
    return this.request<WiseRecipient>(`/v1/accounts/${id}`);
  }

  async getRecipients(profileId?: number): Promise<WiseRecipient[]> {
    const query = profileId ? `?profile=${profileId}` : '';
    return this.request<WiseRecipient[]>(`/v1/accounts${query}`);
  }

  async deleteRecipient(id: number): Promise<void> {
    await this.request<void>('DELETE', `/v1/accounts/${id}`);
  }

  // Quote Management
  async createQuote(quote: {
    sourceCurrency: string;
    targetCurrency: string;
    sourceAmount?: number;
    targetAmount?: number;
    profile: number;
    payInMethod?: string;
    payOutMethod?: string;
  }): Promise<WiseQuote> {
    return this.request<WiseQuote>('POST', '/v1/quotes', quote);
  }

  async getQuote(id: number): Promise<WiseQuote> {
    return this.request<WiseQuote>(`/v1/quotes/${id}`);
  }

  // Transfer Management
  async createTransfer(transfer: {
    targetAccount: number;
    quote: number;
    reference: string;
    customerTransactionId: string;
    details?: {
      reference?: string;
    };
  }): Promise<WiseTransfer> {
    return this.request<WiseTransfer>('POST', '/v1/transfers', transfer);
  }

  async getTransfer(id: number): Promise<WiseTransfer> {
    return this.request<WiseTransfer>(`/v1/transfers/${id}`);
  }

  async getTransfers(params?: {
    profile?: number;
    status?: string;
    targetAccount?: number;
    createdAfter?: string;
    createdBefore?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: WiseTransfer[]; total: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return this.request<{ items: WiseTransfer[]; total: number }>(`/v1/transfers?${query.toString()}`);
  }

  async cancelTransfer(id: number): Promise<WiseTransfer> {
    return this.request<WiseTransfer>(`/v1/transfers/${id}/cancel`);
  }

  // Exchange Rates
  async getExchangeRate(source: string, target: string): Promise<{ rate: number; timestamp: string }> {
    const data = await this.request<{ rate: number; timestamp: string }>(
      `/v1/rates?source=${source}&target=${target}`
    );
    return data;
  }

  // Webhook Verification
  verifyWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
    // Wise uses HMAC-SHA256 for webhook signatures
    // Implementation depends on the specific webhook secret format
    // This is a simplified version - actual implementation should use crypto.timingSafeEqual
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  parseWebhookEvent(payload: string): WiseWebhookEvent {
    return JSON.parse(payload);
  }

  // Balance Management
  async getBalance(profileId: number, currency: string): Promise<{ amount: number; currency: string }> {
    return this.request<{ amount: number; currency: string }>(
      `/v1/profiles/${profileId}/balances/${currency}`
    );
  }

  async getBalances(profileId: number): Promise<Array<{ currency: string; amount: number }>> {
    return this.request<Array<{ currency: string; amount: number }>>(
      `/v1/profiles/${profileId}/balances`
    );
  }
}

export const wiseService = new WiseService();