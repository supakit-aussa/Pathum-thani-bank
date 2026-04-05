const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  internalTransfer,
  promptPayTransfer,
  lookupAccount,
  lookupPromptPay,
} = require('../controllers/transferController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All transfer routes require authentication
router.use(auth);

// POST /api/transfers/internal - Internal bank transfer
router.post(
  '/internal',
  [
    body('fromAccountId').notEmpty().withMessage('Source account ID is required'),
    body('toAccountNumber')
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Valid destination account number is required'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least ฿1')
      .custom((value) => {
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
          throw new Error('Amount can have at most 2 decimal places');
        }
        return true;
      }),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long'),
  ],
  validate,
  internalTransfer
);

// POST /api/transfers/promptpay - PromptPay transfer
router.post(
  '/promptpay',
  [
    body('fromAccountId').notEmpty().withMessage('Source account ID is required'),
    body('promptPayId')
      .trim()
      .matches(/^(0[0-9]{9}|[0-9]{13})$/)
      .withMessage('Valid PromptPay ID (phone number or national ID) is required'),
    body('amount')
      .isFloat({ min: 1, max: 2000000 })
      .withMessage('Amount must be between ฿1 and ฿2,000,000')
      .custom((value) => {
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
          throw new Error('Amount can have at most 2 decimal places');
        }
        return true;
      }),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long'),
  ],
  validate,
  promptPayTransfer
);

// POST /api/transfers/lookup - Look up account before transfer
router.post(
  '/lookup',
  [
    body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
  ],
  validate,
  lookupAccount
);

// POST /api/transfers/promptpay/lookup - Look up PromptPay before transfer
router.post(
  '/promptpay/lookup',
  [
    body('promptPayId')
      .trim()
      .matches(/^(0[0-9]{9}|[0-9]{13})$/)
      .withMessage('Valid PromptPay ID is required'),
  ],
  validate,
  lookupPromptPay
);

module.exports = router;
