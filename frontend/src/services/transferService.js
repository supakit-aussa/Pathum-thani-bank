import api from './api';

export const transferService = {
  internalTransfer: (data) => api.post('/transfers/internal', data),
  promptPayTransfer: (data) => api.post('/transfers/promptpay', data),
  lookupAccount: (accountNumber) =>
    api.post('/transfers/lookup', { accountNumber }),
  lookupPromptPay: (promptPayId) =>
    api.post('/transfers/promptpay/lookup', { promptPayId }),
};
