import { api } from './api';

export const walletService = {
  getWallet: () => api.get('/wallet'),
  topUp: (payload: Record<string, unknown>) => api.post('/wallet/topup', payload),
  withdraw: (payload: Record<string, unknown>) => api.post('/wallet/withdraw', payload),
};
