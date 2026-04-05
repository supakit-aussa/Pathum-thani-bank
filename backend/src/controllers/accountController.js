const prisma = require('../config/database');

/**
 * GET /api/accounts
 * Get all accounts for the authenticated user
 */
const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate total balance across all accounts
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + parseFloat(acc.balance),
      0
    );

    res.json({
      success: true,
      data: {
        accounts,
        totalBalance: totalBalance.toFixed(2),
        currency: 'THB',
      },
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve accounts.',
    });
  }
};

/**
 * GET /api/accounts/:id
 * Get a specific account by ID (must belong to authenticated user)
 */
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
      data: { account },
    });
  } catch (error) {
    console.error('Get account by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve account.',
    });
  }
};

/**
 * GET /api/accounts/:id/transactions
 * Get transaction history for a specific account
 */
const getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Build filter conditions
    const whereClause = {
      OR: [
        { fromAccountId: id },
        { toAccountId: id },
      ],
    };

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        select: {
          id: true,
          fromAccountId: true,
          toAccountId: true,
          amount: true,
          type: true,
          status: true,
          reference: true,
          description: true,
          createdAt: true,
          fromAccount: {
            select: { accountNumber: true, accountType: true },
          },
          toAccount: {
            select: { accountNumber: true, accountType: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    // Add direction field (debit/credit) relative to the current account
    const transactionsWithDirection = transactions.map((txn) => ({
      ...txn,
      direction: txn.fromAccountId === id ? 'DEBIT' : 'CREDIT',
    }));

    res.json({
      success: true,
      data: {
        transactions: transactionsWithDirection,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction history.',
    });
  }
};

/**
 * GET /api/accounts/transactions/recent
 * Get recent transactions across all user accounts
 */
const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get all account IDs for the user
    const userAccounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      select: { id: true },
    });

    const accountIds = userAccounts.map((acc) => acc.id);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
      select: {
        id: true,
        fromAccountId: true,
        toAccountId: true,
        amount: true,
        type: true,
        status: true,
        reference: true,
        description: true,
        createdAt: true,
        fromAccount: {
          select: { accountNumber: true, accountType: true },
        },
        toAccount: {
          select: { accountNumber: true, accountType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent transactions.',
    });
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  getTransactionHistory,
  getRecentTransactions,
};
