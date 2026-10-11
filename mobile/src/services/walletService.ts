import { api } from './api';

export type TransactionType = 
  | 'topup' 
  | 'topup_reversal' 
  | 'escrow_lock' 
  | 'escrow_release' 
  | 'escrow_refund' 
  | 'platform_fee' 
  | 'payout' 
  | 'payout_reversal' 
  | 'adjustment' 
  | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Wallet {
  _id: string;
  userId: string;
  type: string;
  balance: number; // in USD cents
  currency: string;
  escrowBalance: number;
  availableBalance: number;
  isActive: boolean;
  lastTransactionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  transactionId: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // in USD cents (positive for credit, negative for debit)
  currency: string;
  netAmount: number;
  feeAmount: number;
  description: string;
  metadata: Record<string, any>;
  ledgerEntries: string[];
  completedAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  balance: number;
  escrowBalance: number;
  availableBalance: number;
  currency: string;
  transactionStats: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface TransactionHistoryParams {
  type?: TransactionType;
  status?: TransactionStatus;
  limit?: number;
  skip?: number;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
}

export interface Payout {
  _id: string;
  payoutId: string;
  providerId: string;
  walletId: string;
  amount: number;
  currency: string;
  netAmount: number;
  feeAmount: number;
  status: string;
  wiseTransferId?: string;
  wiseQuoteId?: string;
  destinationAccountId?: string;
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequest {
  amountCents: number;
  currency?: string;
  destinationAccountId?: string;
}

export interface TopUpRequest {
  amountCents: number;
  currency?: string;
  paymentMethodId?: string;
  idempotencyKey: string;
}

export interface ConfirmTopUpRequest {
  paymentIntentId: string;
}

export const walletService = {
  // Get wallet balance
  getBalance: async (): Promise<{ balance: number; escrowBalance: number; availableBalance: number; currency: string }> => {
    const res = await api.get('/wallet/balance');
    return res.data.data;
  },

  // Get wallet details
  getWallet: async (): Promise<Wallet> => {
    const res = await api.get('/wallet');
    return res.data.data;
  },

  // Create top-up payment intent
  createTopUp: async (payload: TopUpRequest): Promise<{ clientSecret: string; transactionId: string; amountCents: number }> => {
    const res = await api.post('/wallet/topup', payload);
    return res.data.data;
  },

  // Confirm top-up after Stripe payment
  confirmTopUp: async (paymentIntentId: string): Promise<Transaction> => {
    const res = await api.post('/wallet/topup/confirm', { paymentIntentId });
    return res.data.data;
  },

  // Get transaction history
  getTransactionHistory: async (params: TransactionHistoryParams = {}): Promise<TransactionHistoryResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/wallet/transactions?${queryParams.toString()}`);
    return res.data.data;
  },

  // Get wallet stats
  getWalletStats: async (): Promise<WalletStats> => {
    const res = await api.get('/wallet/stats');
    return res.data.data;
  },

  // Request payout (provider only)
  requestPayout: async (payload: PayoutRequest): Promise<Payout> => {
    const res = await api.post('/wallet/payout', payload);
    return res.data.data;
  },

  // Get payout history
  getPayoutHistory: async (): Promise<{ payouts: Payout[]; total: number }> => {
    const res = await api.get('/wallet/payouts');
    return res.data.data;
  },
};