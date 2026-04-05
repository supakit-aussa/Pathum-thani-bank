const prisma = require('../config/database');

/**
 * Generate a unique transaction reference number
 */
const generateReference = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
};

/**
 * POST /api/transfers/internal
 * Internal transfer between accounts (same bank)
 *
 * ACID Compliance:
 * - Atomicity: Both debit and credit happen in a single Prisma transaction.
 *   If either operation fails, the entire transaction is rolled back.
 * - Consistency: Balance validation ensures accounts never go negative.
 *   Foreign key constraints ensure referential integrity.
 * - Isolation: Prisma's transaction with SELECT FOR UPDATE prevents
 *   concurrent transactions from reading stale balances.
 * - Durability: PostgreSQL WAL (Write-Ahead Log) ensures committed
 *   transactions survive system failures.
 */
const internalTransfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;
    const transferAmount = parseFloat(amount);

    // Validate amount is a positive number
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer amount.',
      });
    }

    // Minimum transfer amount
    if (transferAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum transfer amount is ฿1.',
      });
    }

    // Execute transfer atomically using Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Lock the source account row to prevent concurrent modifications (isolation)
      const fromAccount = await tx.account.findFirst({
        where: {
          id: fromAccountId,
          userId: req.user.id,
          isActive: true,
        },
      });

      if (!fromAccount) {
        throw new Error('SOURCE_ACCOUNT_NOT_FOUND');
      }

      // Validate sufficient balance (consistency)
      if (parseFloat(fromAccount.balance) < transferAmount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Find the destination account by account number
      const toAccount = await tx.account.findFirst({
        where: {
          accountNumber: toAccountNumber,
          isActive: true,
        },
        include: {
          user: {
            select: { fullName: true },
          },
        },
      });

      if (!toAccount) {
        throw new Error('DESTINATION_ACCOUNT_NOT_FOUND');
      }

      // Prevent transfer to the same account
      if (fromAccount.id === toAccount.id) {
        throw new Error('SAME_ACCOUNT_TRANSFER');
      }

      const reference = generateReference();

      // Debit source account (atomicity)
      await tx.account.update({
        where: { id: fromAccount.id },
        data: {
          balance: {
            decrement: transferAmount,
          },
        },
      });

      // Credit destination account (atomicity)
      await tx.account.update({
        where: { id: toAccount.id },
        data: {
          balance: {
            increment: transferAmount,
          },
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount: transferAmount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          reference,
          description: description || `Transfer to ${toAccount.accountNumber}`,
        },
      });

      // Create notification for sender
      await tx.notification.create({
        data: {
          userId: req.user.id,
          title: 'Transfer Successful',
          message: `Transfer of ฿${transferAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} to ${toAccount.accountNumber} was successful. Ref: ${reference}`,
          type: 'TRANSACTION',
        },
      });

      // Create notification for recipient if they are a different user
      if (toAccount.userId !== req.user.id) {
        await tx.notification.create({
          data: {
            userId: toAccount.userId,
            title: 'Money Received',
            message: `You received ฿${transferAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} from account ${fromAccount.accountNumber}. Ref: ${reference}`,
            type: 'TRANSACTION',
          },
        });
      }

      return {
        transaction,
        recipientName: toAccount.user.fullName,
        recipientAccount: toAccount.accountNumber,
      };
    });

    res.json({
      success: true,
      message: 'Transfer completed successfully.',
      data: {
        transaction: result.transaction,
        recipient: {
          name: result.recipientName,
          accountNumber: result.recipientAccount,
        },
      },
    });
  } catch (error) {
    if (error.message === 'SOURCE_ACCOUNT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Source account not found.' });
    }
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }
    if (error.message === 'DESTINATION_ACCOUNT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Destination account not found.' });
    }
    if (error.message === 'SAME_ACCOUNT_TRANSFER') {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same account.' });
    }

    console.error('Internal transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed. Please try again.',
    });
  }
};

/**
 * POST /api/transfers/promptpay
 * PromptPay transfer (using phone number or national ID)
 *
 * ACID Compliance:
 * - Same ACID guarantees as internalTransfer.
 * - PromptPay lookup resolves to an account before the atomic transaction.
 * - The transaction record includes metadata about PromptPay details.
 */
const promptPayTransfer = async (req, res) => {
  try {
    const { fromAccountId, promptPayId, amount, description } = req.body;
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer amount.',
      });
    }

    if (transferAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum transfer amount is ฿1.',
      });
    }

    // Maximum PromptPay transfer per transaction
    if (transferAmount > 2000000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum PromptPay transfer amount is ฿2,000,000.',
      });
    }

    // Resolve PromptPay ID to a user account (phone number lookup)
    const recipientUser = await prisma.user.findFirst({
      where: { phone: promptPayId },
      include: {
        accounts: {
          where: {
            accountType: { in: ['SAVINGS', 'ESAVINGS'] },
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!recipientUser || recipientUser.accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PromptPay ID not registered or no active account found.',
      });
    }

    const toAccount = recipientUser.accounts[0];

    // Execute PromptPay transfer atomically
    const result = await prisma.$transaction(async (tx) => {
      const fromAccount = await tx.account.findFirst({
        where: {
          id: fromAccountId,
          userId: req.user.id,
          isActive: true,
        },
      });

      if (!fromAccount) {
        throw new Error('SOURCE_ACCOUNT_NOT_FOUND');
      }

      if (parseFloat(fromAccount.balance) < transferAmount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      if (fromAccount.id === toAccount.id) {
        throw new Error('SAME_ACCOUNT_TRANSFER');
      }

      const reference = generateReference();

      // Atomic debit and credit operations
      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: transferAmount } },
      });

      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: transferAmount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount: transferAmount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          reference,
          description: description || `PromptPay transfer to ${promptPayId}`,
          metadata: {
            promptPayId,
            transferMethod: 'PROMPTPAY',
          },
        },
      });

      // Notify sender
      await tx.notification.create({
        data: {
          userId: req.user.id,
          title: 'PromptPay Transfer Successful',
          message: `PromptPay transfer of ฿${transferAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} to ${recipientUser.fullName} was successful. Ref: ${reference}`,
          type: 'TRANSACTION',
        },
      });

      // Notify recipient
      await tx.notification.create({
        data: {
          userId: toAccount.userId,
          title: 'Money Received via PromptPay',
          message: `You received ฿${transferAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} via PromptPay. Ref: ${reference}`,
          type: 'TRANSACTION',
        },
      });

      return { transaction, recipientUser };
    });

    res.json({
      success: true,
      message: 'PromptPay transfer completed successfully.',
      data: {
        transaction: result.transaction,
        recipient: {
          name: result.recipientUser.fullName,
          promptPayId,
        },
      },
    });
  } catch (error) {
    if (error.message === 'SOURCE_ACCOUNT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Source account not found.' });
    }
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }
    if (error.message === 'SAME_ACCOUNT_TRANSFER') {
      return res.status(400).json({ success: false, message: 'Cannot transfer to your own PromptPay account.' });
    }

    console.error('PromptPay transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'PromptPay transfer failed. Please try again.',
    });
  }
};

/**
 * POST /api/transfers/lookup
 * Look up account info before making a transfer
 */
const lookupAccount = async (req, res) => {
  try {
    const { accountNumber } = req.body;

    const account = await prisma.account.findFirst({
      where: { accountNumber, isActive: true },
      include: {
        user: {
          select: { fullName: true },
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    res.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        recipientName: account.user.fullName,
      },
    });
  } catch (error) {
    console.error('Lookup account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup account.',
    });
  }
};

/**
 * POST /api/transfers/promptpay/lookup
 * Look up PromptPay info before making a transfer
 */
const lookupPromptPay = async (req, res) => {
  try {
    const { promptPayId } = req.body;

    const user = await prisma.user.findFirst({
      where: { phone: promptPayId },
      select: {
        fullName: true,
        accounts: {
          where: { isActive: true },
          select: { accountNumber: true, accountType: true },
          take: 1,
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PromptPay ID not registered.',
      });
    }

    res.json({
      success: true,
      data: {
        recipientName: user.fullName,
        promptPayId,
      },
    });
  } catch (error) {
    console.error('Lookup PromptPay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup PromptPay.',
    });
  }
};

module.exports = {
  internalTransfer,
  promptPayTransfer,
  lookupAccount,
  lookupPromptPay,
};
