const express = require('express');
const router = express.Router();

const {
  getAccounts,
  getAccountById,
  getTransactionHistory,
  getRecentTransactions,
} = require('../controllers/accountController');
const { auth } = require('../middleware/auth');

// All account routes require authentication
router.use(auth);

// GET /api/accounts - Get all accounts for authenticated user
router.get('/', getAccounts);

// GET /api/accounts/transactions/recent - Get recent transactions
router.get('/transactions/recent', getRecentTransactions);

// GET /api/accounts/:id - Get account by ID
router.get('/:id', getAccountById);

// GET /api/accounts/:id/transactions - Get transaction history for an account
router.get('/:id/transactions', getTransactionHistory);

module.exports = router;
