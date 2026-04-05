const express = require('express');
const router = express.Router();

const {
  getCards,
  getCardById,
  lockCard,
  unlockCard,
  cancelCard,
} = require('../controllers/cardController');
const { auth } = require('../middleware/auth');

// All card routes require authentication
router.use(auth);

// GET /api/cards - Get all cards for authenticated user
router.get('/', getCards);

// GET /api/cards/:id - Get card by ID
router.get('/:id', getCardById);

// PATCH /api/cards/:id/lock - Lock a card
router.patch('/:id/lock', lockCard);

// PATCH /api/cards/:id/unlock - Unlock a card
router.patch('/:id/unlock', unlockCard);

// DELETE /api/cards/:id - Cancel a card
router.delete('/:id', cancelCard);

module.exports = router;
