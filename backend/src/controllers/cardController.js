const prisma = require('../config/database');

/**
 * GET /api/cards
 * Get all cards for the authenticated user
 */
const getCards = async (req, res) => {
  try {
    const cards = await prisma.card.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      select: {
        id: true,
        cardNumber: true,
        cardType: true,
        isLocked: true,
        expiryDate: true,
        isActive: true,
        createdAt: true,
        account: {
          select: {
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mask card numbers for security (show only last 4 digits)
    const maskedCards = cards.map((card) => ({
      ...card,
      cardNumberMasked: `**** **** **** ${card.cardNumber.slice(-4)}`,
      cardNumber: undefined, // Remove full card number from response
    }));

    res.json({
      success: true,
      data: { cards: maskedCards },
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cards.',
    });
  }
};

/**
 * GET /api/cards/:id
 * Get a specific card by ID
 */
const getCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findFirst({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
      select: {
        id: true,
        cardNumber: true,
        cardType: true,
        isLocked: true,
        expiryDate: true,
        isActive: true,
        createdAt: true,
        account: {
          select: {
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found.',
      });
    }

    res.json({
      success: true,
      data: {
        card: {
          ...card,
          cardNumberMasked: `**** **** **** ${card.cardNumber.slice(-4)}`,
          cardNumber: undefined,
        },
      },
    });
  } catch (error) {
    console.error('Get card by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve card.',
    });
  }
};

/**
 * PATCH /api/cards/:id/lock
 * Lock a card to prevent unauthorized transactions
 */
const lockCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findFirst({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found.',
      });
    }

    if (card.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Card is already locked.',
      });
    }

    const updatedCard = await prisma.card.update({
      where: { id },
      data: { isLocked: true },
      select: {
        id: true,
        cardType: true,
        isLocked: true,
        cardNumber: true,
      },
    });

    // Create security notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Card Locked',
        message: `Your card ending in ${updatedCard.cardNumber.slice(-4)} has been locked.`,
        type: 'SECURITY',
      },
    });

    res.json({
      success: true,
      message: 'Card locked successfully.',
      data: {
        card: {
          id: updatedCard.id,
          cardType: updatedCard.cardType,
          isLocked: updatedCard.isLocked,
          cardNumberMasked: `**** **** **** ${updatedCard.cardNumber.slice(-4)}`,
        },
      },
    });
  } catch (error) {
    console.error('Lock card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock card.',
    });
  }
};

/**
 * PATCH /api/cards/:id/unlock
 * Unlock a previously locked card
 */
const unlockCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findFirst({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found.',
      });
    }

    if (!card.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Card is not locked.',
      });
    }

    const updatedCard = await prisma.card.update({
      where: { id },
      data: { isLocked: false },
      select: {
        id: true,
        cardType: true,
        isLocked: true,
        cardNumber: true,
      },
    });

    // Create security notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Card Unlocked',
        message: `Your card ending in ${updatedCard.cardNumber.slice(-4)} has been unlocked.`,
        type: 'SECURITY',
      },
    });

    res.json({
      success: true,
      message: 'Card unlocked successfully.',
      data: {
        card: {
          id: updatedCard.id,
          cardType: updatedCard.cardType,
          isLocked: updatedCard.isLocked,
          cardNumberMasked: `**** **** **** ${updatedCard.cardNumber.slice(-4)}`,
        },
      },
    });
  } catch (error) {
    console.error('Unlock card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock card.',
    });
  }
};

/**
 * DELETE /api/cards/:id
 * Deactivate (cancel) a card
 */
const cancelCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findFirst({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found.',
      });
    }

    await prisma.card.update({
      where: { id },
      data: { isActive: false, isLocked: true },
    });

    res.json({
      success: true,
      message: 'Card cancelled successfully.',
    });
  } catch (error) {
    console.error('Cancel card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel card.',
    });
  }
};

module.exports = { getCards, getCardById, lockCard, unlockCard, cancelCard };
