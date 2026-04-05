const prisma = require('../config/database');

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              accounts: true,
              cards: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.',
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Get detailed user information (admin only)
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
            isActive: true,
          },
        },
        cards: {
          select: {
            id: true,
            cardType: true,
            isLocked: true,
            expiryDate: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details.',
    });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate a user account (admin only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own account status.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
    });
  }
};

/**
 * GET /api/admin/transactions
 * Get all transactions with filtering (admin only)
 */
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, flagged } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (flagged === 'true') {
      // Flag transactions over 500,000 THB as suspicious
      whereClause.amount = { gt: 500000 };
    }

    const [transactions, total] = await Promise.all([
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
            select: {
              accountNumber: true,
              user: { select: { fullName: true, email: true } },
            },
          },
          toAccount: {
            select: {
              accountNumber: true,
              user: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions.',
    });
  }
};

/**
 * PATCH /api/admin/transactions/:id/flag
 * Flag or unflag a suspicious transaction (admin only)
 */
const flagTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: flagged ? 'FAILED' : 'COMPLETED',
        metadata: {
          ...((transaction.metadata) || {}),
          flagged,
          flagReason: reason || null,
          flaggedAt: flagged ? new Date().toISOString() : null,
          flaggedBy: req.user.id,
        },
      },
    });

    res.json({
      success: true,
      message: `Transaction ${flagged ? 'flagged' : 'unflagged'} successfully.`,
      data: { transaction: updatedTransaction },
    });
  } catch (error) {
    console.error('Flag transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag transaction.',
    });
  }
};

/**
 * GET /api/admin/exchange-rates
 * Get all exchange rates (admin only)
 */
const getExchangeRates = async (req, res) => {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { currency: 'asc' },
    });

    res.json({
      success: true,
      data: { rates },
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve exchange rates.',
    });
  }
};

/**
 * PATCH /api/admin/exchange-rates/:currency
 * Update exchange rate for a currency (admin only)
 */
const updateExchangeRate = async (req, res) => {
  try {
    const { currency } = req.params;
    const { rate } = req.body;

    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exchange rate value.',
      });
    }

    const updatedRate = await prisma.exchangeRate.upsert({
      where: { currency: currency.toUpperCase() },
      update: { rate: rateValue },
      create: { currency: currency.toUpperCase(), rate: rateValue },
    });

    res.json({
      success: true,
      message: `Exchange rate for ${currency.toUpperCase()} updated successfully.`,
      data: { rate: updatedRate },
    });
  } catch (error) {
    console.error('Update exchange rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exchange rate.',
    });
  }
};

/**
 * GET /api/admin/stats
 * Get system statistics (admin only)
 */
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAccounts,
      totalTransactions,
      recentTransactions,
      totalTransactionVolume,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.account.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          reference: true,
          createdAt: true,
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalAccounts,
          totalTransactions,
          totalTransactionVolume: totalTransactionVolume._sum.amount || 0,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics.',
    });
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllTransactions,
  flagTransaction,
  getExchangeRates,
  updateExchangeRate,
  getSystemStats,
};
