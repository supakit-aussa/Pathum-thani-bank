const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { getProviders, payBill, getBillHistory } = require('../controllers/billController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All bill routes require authentication
router.use(auth);

// GET /api/bills/providers - Get available bill providers
router.get('/providers', getProviders);

// GET /api/bills/history - Get bill payment history
router.get('/history', getBillHistory);

// POST /api/bills/pay - Pay a bill
router.post(
  '/pay',
  [
    body('fromAccountId').notEmpty().withMessage('Account ID is required'),
    body('providerId').notEmpty().withMessage('Provider ID is required'),
    body('billerAccountNumber')
      .trim()
      .notEmpty()
      .withMessage('Biller account number is required'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least ฿1')
      .custom((value) => {
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
          throw new Error('Amount can have at most 2 decimal places');
        }
        return true;
      }),
    body('description').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  payBill
);

module.exports = router;
