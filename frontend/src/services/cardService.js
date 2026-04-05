import api from './api';

export const cardService = {
  getCards: () => api.get('/cards'),
  getCardById: (id) => api.get(`/cards/${id}`),
  lockCard: (id) => api.patch(`/cards/${id}/lock`),
  unlockCard: (id) => api.patch(`/cards/${id}/unlock`),
  cancelCard: (id) => api.delete(`/cards/${id}`),
};
