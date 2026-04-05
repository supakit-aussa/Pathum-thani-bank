import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: (params = {}) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) =>
    api.patch(`/admin/users/${id}/status`, { isActive }),
  getAllTransactions: (params = {}) =>
    api.get('/admin/transactions', { params }),
  flagTransaction: (id, flagged, reason) =>
    api.patch(`/admin/transactions/${id}/flag`, { flagged, reason }),
  getExchangeRates: () => api.get('/admin/exchange-rates'),
  updateExchangeRate: (currency, rate) =>
    api.patch(`/admin/exchange-rates/${currency}`, { rate }),
};
