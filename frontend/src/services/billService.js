import api from './api';

export const billService = {
  getProviders: (params = {}) => api.get('/bills/providers', { params }),
  payBill: (data) => api.post('/bills/pay', data),
  getBillHistory: (params = {}) => api.get('/bills/history', { params }),
};
