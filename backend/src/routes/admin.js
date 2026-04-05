const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllTransactions,
  flagTransaction,
  getExchangeRates,
  updateExchangeRate,
  getSystemStats,
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All admin routes require admin authentication
router.use(adminAuth);

// GET /api/admin/stats - System statistics
router.get('/stats', getSystemStats);

// GET /api/admin/users - Get all users
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - Get user details
router.get('/users/:id', getUserDetails);

// PATCH /api/admin/users/:id/status - Update user status
router.patch(
  '/users/:id/status',
  [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  updateUserStatus
);

// GET /api/admin/transactions - Get all transactions
router.get('/transactions', getAllTransactions);

// PATCH /api/admin/transactions/:id/flag - Flag a transaction
router.patch(
  '/transactions/:id/flag',
  [
    body('flagged').isBoolean().withMessage('flagged must be a boolean'),
    body('reason').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  flagTransaction
);

// GET /api/admin/exchange-rates - Get exchange rates
router.get('/exchange-rates', getExchangeRates);

// PATCH /api/admin/exchange-rates/:currency - Update exchange rate
router.patch(
  '/exchange-rates/:currency',
  [
    body('rate')
      .isFloat({ min: 0.000001 })
      .withMessage('Rate must be a positive number'),
  ],
  validate,
  updateExchangeRate
);

module.exports = router;
