const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prathumthanibank.com' },
    update: {},
    create: {
      email: 'admin@prathumthanibank.com',
      password: adminPassword,
      fullName: 'System Administrator',
      phone: '0800000000',
      role: 'ADMIN',
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('User@1234', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: userPassword,
      fullName: 'Somchai Jaidee',
      phone: '0812345678',
      role: 'USER',
    },
  });

  // Create accounts for demo user
  const savingsAccount = await prisma.account.upsert({
    where: { accountNumber: '1234567890' },
    update: {},
    create: {
      userId: demoUser.id,
      accountNumber: '1234567890',
      accountType: 'SAVINGS',
      balance: 150000.00,
      currency: 'THB',
    },
  });

  const esavingsAccount = await prisma.account.upsert({
    where: { accountNumber: '0987654321' },
    update: {},
    create: {
      userId: demoUser.id,
      accountNumber: '0987654321',
      accountType: 'ESAVINGS',
      balance: 75500.50,
      currency: 'THB',
    },
  });

  // Create a card for demo user
  await prisma.card.upsert({
    where: { cardNumber: '4532015112830366' },
    update: {},
    create: {
      userId: demoUser.id,
      accountId: savingsAccount.id,
      cardNumber: '4532015112830366',
      cardType: 'DEBIT',
      isLocked: false,
      expiryDate: new Date('2027-12-31'),
      cvv: '$2b$12$hashedcvv123',
    },
  });

  // Create sample transactions
  await prisma.transaction.createMany({
    skipDuplicates: true,
    data: [
      {
        fromAccountId: savingsAccount.id,
        toAccountId: esavingsAccount.id,
        amount: 5000.00,
        type: 'TRANSFER',
        status: 'COMPLETED',
        reference: 'TXN001',
        description: 'Transfer to eSavings',
      },
      {
        toAccountId: savingsAccount.id,
        amount: 20000.00,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        reference: 'TXN002',
        description: 'Salary deposit',
      },
      {
        fromAccountId: savingsAccount.id,
        amount: 1500.00,
        type: 'PAYMENT',
        status: 'COMPLETED',
        reference: 'TXN003',
        description: 'Electricity bill payment',
      },
      {
        fromAccountId: savingsAccount.id,
        amount: 3000.00,
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        reference: 'TXN004',
        description: 'ATM withdrawal',
      },
    ],
  });

  // Create exchange rates
  const exchangeRates = [
    { currency: 'USD', rate: 35.25 },
    { currency: 'EUR', rate: 38.50 },
    { currency: 'GBP', rate: 44.75 },
    { currency: 'JPY', rate: 0.24 },
    { currency: 'CNY', rate: 4.87 },
    { currency: 'SGD', rate: 26.15 },
    { currency: 'AUD', rate: 22.80 },
    { currency: 'HKD', rate: 4.51 },
  ];

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.upsert({
      where: { currency: rate.currency },
      update: { rate: rate.rate },
      create: rate,
    });
  }

  // Create notifications for demo user
  await prisma.notification.createMany({
    skipDuplicates: false,
    data: [
      {
        userId: demoUser.id,
        title: 'Welcome to Prathum-Thani Bank',
        message: 'Your account has been successfully created. Enjoy our digital banking services.',
        type: 'SYSTEM',
        isRead: false,
      },
      {
        userId: demoUser.id,
        title: 'Transfer Completed',
        message: 'Your transfer of ฿5,000 has been completed successfully.',
        type: 'TRANSACTION',
        isRead: false,
      },
      {
        userId: demoUser.id,
        title: 'Salary Received',
        message: 'A deposit of ฿20,000 has been credited to your account.',
        type: 'TRANSACTION',
        isRead: true,
      },
    ],
  });

  console.log('Seeding completed!');
  console.log('Admin login: admin@prathumthanibank.com / Admin@1234');
  console.log('Demo login: demo@example.com / User@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
