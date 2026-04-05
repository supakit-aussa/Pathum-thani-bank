import api from './api';

export const accountService = {
  getAccounts: () => api.get('/accounts'),
  getAccountById: (id) => api.get(`/accounts/${id}`),
  getTransactionHistory: (id, params = {}) =>
    api.get(`/accounts/${id}/transactions`, { params }),
  getRecentTransactions: (limit = 10) =>
    api.get('/accounts/transactions/recent', { params: { limit } }),
};
