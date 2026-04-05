const prisma = require('../config/database');

// Mock bill payment providers
const BILL_PROVIDERS = [
  {
    id: 'MEA',
    name: 'Metropolitan Electricity Authority',
    category: 'Electricity',
    icon: '⚡',
    prefix: 'MEA',
  },
  {
    id: 'PEA',
    name: 'Provincial Electricity Authority',
    category: 'Electricity',
    icon: '⚡',
    prefix: 'PEA',
  },
  {
    id: 'MWA',
    name: 'Metropolitan Waterworks Authority',
    category: 'Water',
    icon: '💧',
    prefix: 'MWA',
  },
  {
    id: 'PWA',
    name: 'Provincial Waterworks Authority',
    category: 'Water',
    icon: '💧',
    prefix: 'PWA',
  },
  {
    id: 'AIS',
    name: 'AIS Mobile Service',
    category: 'Telephone',
    icon: '📱',
    prefix: 'AIS',
  },
  {
    id: 'DTAC',
    name: 'DTAC Service',
    category: 'Telephone',
    icon: '📱',
    prefix: 'DTAC',
  },
  {
    id: 'TRUE',
    name: 'True Move H',
    category: 'Telephone',
    icon: '📱',
    prefix: 'TRUE',
  },
  {
    id: 'NT',
    name: 'NBTC Broadband',
    category: 'Internet',
    icon: '🌐',
    prefix: 'NT',
  },
  {
    id: 'TOT',
    name: 'TOT Internet',
    category: 'Internet',
    icon: '🌐',
    prefix: 'TOT',
  },
  {
    id: 'KRUNGTHAI',
    name: 'Krungthai Credit Card',
    category: 'Credit Card',
    icon: '💳',
    prefix: 'KTC',
  },
  {
    id: 'SCB_CC',
    name: 'SCB Credit Card',
    category: 'Credit Card',
    icon: '💳',
    prefix: 'SCB',
  },
  {
    id: 'INSURANCE_TH',
    name: 'Thai Life Insurance',
    category: 'Insurance',
    icon: '🛡️',
    prefix: 'TLI',
  },
];

/**
 * GET /api/bills/providers
 * Get all available bill payment providers
 */
const getProviders = async (req, res) => {
  try {
    const { search, category } = req.query;

    let providers = BILL_PROVIDERS;

    if (search) {
      const searchLower = search.toLowerCase();
      providers = providers.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.id.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      providers = providers.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Get unique categories for filter options
    const categories = [...new Set(BILL_PROVIDERS.map((p) => p.category))];

    res.json({
      success: true,
      data: {
        providers,
        categories,
        total: providers.length,
      },
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bill providers.',
    });
  }
};

/**
 * POST /api/bills/pay
 * Pay a bill
 *
 * ACID Compliance:
 * - Atomicity: Account debit and bill payment record creation happen in one transaction.
 *   If bill creation fails, the debit is rolled back.
 * - Consistency: Balance check ensures sufficient funds before debit.
 * - Isolation: Transaction prevents concurrent debit operations on the same account.
 * - Durability: PostgreSQL WAL ensures the committed payment is durable.
 */
const payBill = async (req, res) => {
  try {
    const { fromAccountId, providerId, billerAccountNumber, amount, description } = req.body;
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount.',
      });
    }

    // Find the provider
    const provider = BILL_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Bill provider not found.',
      });
    }

    // Execute bill payment atomically
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: fromAccountId,
          userId: req.user.id,
          isActive: true,
        },
      });

      if (!account) {
        throw new Error('ACCOUNT_NOT_FOUND');
      }

      if (parseFloat(account.balance) < paymentAmount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Debit the account
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: paymentAmount } },
      });

      // Create bill payment record
      const billPayment = await tx.billPayment.create({
        data: {
          userId: req.user.id,
          provider: provider.name,
          accountNumber: billerAccountNumber,
          amount: paymentAmount,
          status: 'COMPLETED',
        },
      });

      // Create transaction record for audit trail
      await tx.transaction.create({
        data: {
          fromAccountId: account.id,
          amount: paymentAmount,
          type: 'PAYMENT',
          status: 'COMPLETED',
          description: description || `Bill payment to ${provider.name}`,
          metadata: {
            billPaymentId: billPayment.id,
            provider: provider.name,
            billerAccountNumber,
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: req.user.id,
          title: 'Bill Payment Successful',
          message: `Payment of ฿${paymentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} to ${provider.name} (${billerAccountNumber}) was successful.`,
          type: 'TRANSACTION',
        },
      });

      return billPayment;
    });

    res.json({
      success: true,
      message: 'Bill payment completed successfully.',
      data: {
        billPayment: result,
        provider: provider.name,
      },
    });
  } catch (error) {
    if (error.message === 'ACCOUNT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    console.error('Pay bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Bill payment failed. Please try again.',
    });
  }
};

/**
 * GET /api/bills/history
 * Get bill payment history for the authenticated user
 */
const getBillHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [billPayments, total] = await Promise.all([
      prisma.billPayment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.billPayment.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: {
        billPayments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get bill history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bill payment history.',
    });
  }
};

module.exports = { getProviders, payBill, getBillHistory };
