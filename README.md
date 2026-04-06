# Prathum-Thani Bank

A comprehensive full-stack digital banking platform with secure authentication, account management, fund transfers, bill payments, card services, and an admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 18 |
| ORM | Prisma |
| Auth | JWT + bcrypt |

---

## Prerequisites

Make sure you have the following installed before cloning:

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/download/) v14 or higher (running on port 5432)
- npm (comes with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Fullstack-Project-By-Prompting-Claude
```

### 2. Set up the database

Open **pgAdmin 4** or **psql** and create the database:

```sql
CREATE DATABASE prathum_thani_bank;
```

Or via terminal:

```bash
psql -U postgres -c "CREATE DATABASE prathum_thani_bank;"
```

### 3. Configure the backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/prathum_thani_bank?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV=development
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

> Replace `postgres` with your PostgreSQL username and `YOUR_PASSWORD` with your password.

### 4. Install backend dependencies and run migrations

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

This will:
- Create all database tables
- Seed demo users, accounts, cards, transactions, and exchange rates

### 5. Start the backend server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`  
Health check: `http://localhost:5000/health`

### 6. Install frontend dependencies and start

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| User | demo@example.com | User@1234 |
| Admin | admin@prathumthanibank.com | Admin@1234 |

---

## Project Structure

```
/
├── frontend/                   # React + Vite application
│   └── src/
│       ├── components/
│       │   ├── Dashboard/      # AccountCard, TransactionList, QuickActions
│       │   ├── Layout/         # Navbar, Sidebar, Layout wrapper
│       │   └── UI/             # Button, Card, Modal, Badge, Input
│       ├── context/            # AuthContext (JWT state management)
│       ├── hooks/              # useAuth
│       ├── pages/              # LoginPage, Dashboard, Accounts, Transfer, etc.
│       └── services/           # Axios API calls (auth, accounts, transfers...)
│
└── backend/                    # Node.js + Express application
    ├── prisma/
    │   ├── schema.prisma       # Database models
    │   └── seed.js             # Demo data seeder
    └── src/
        ├── config/             # Prisma client singleton
        ├── controllers/        # Route handlers (auth, accounts, transfers...)
        ├── middleware/         # JWT auth, input validation
        └── routes/             # API route definitions
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |
| GET | `/api/accounts` | List all user accounts | Yes |
| GET | `/api/accounts/:id` | Get account details | Yes |
| GET | `/api/accounts/:id/transactions` | Get transaction history | Yes |
| POST | `/api/transfers/internal` | Transfer between accounts | Yes |
| POST | `/api/transfers/promptpay` | PromptPay transfer | Yes |
| GET | `/api/bills/providers` | List bill providers | Yes |
| POST | `/api/bills/pay` | Pay a bill | Yes |
| GET | `/api/cards` | List user cards | Yes |
| PATCH | `/api/cards/:id/lock` | Lock a card | Yes |
| PATCH | `/api/cards/:id/unlock` | Unlock a card | Yes |
| GET | `/api/notifications` | Get notifications | Yes |
| PATCH | `/api/notifications/:id/read` | Mark notification as read | Yes |
| GET | `/api/admin/users` | List all users (admin) | Admin |
| PATCH | `/api/admin/transactions/:id/flag` | Flag a transaction (admin) | Admin |
| PUT | `/api/admin/exchange-rates` | Update exchange rate (admin) | Admin |

---

## Features

- **Authentication** — JWT-based login/register with bcrypt password hashing
- **Dashboard** — Account balances, recent transactions, spending chart (Recharts)
- **Accounts** — Multiple account types: Savings, Fixed Deposit, e-Savings
- **Transfers** — Internal transfers and PromptPay simulation (ACID-compliant via Prisma transactions)
- **Bill Payments** — Searchable provider list with payment history
- **Cards** — Virtual debit/credit card management with lock/unlock
- **Notifications** — Real-time alert center for transactions and security events
- **Admin Panel** — User management, transaction flagging, exchange rate updates

---

## Environment Variables Reference

```env
# backend/.env
DATABASE_URL=        # PostgreSQL connection string
JWT_SECRET=          # Secret key for signing JWT tokens
PORT=                # Backend port (default: 5000)
NODE_ENV=            # development | production
JWT_EXPIRES_IN=      # Token expiry e.g. 7d
BCRYPT_ROUNDS=       # bcrypt salt rounds (default: 12)
```

---

## Useful Commands

```bash
# Backend
npm run dev              # Start backend with hot reload (nodemon)
npm start                # Start backend without hot reload
npx prisma studio        # Open Prisma database GUI
npx prisma migrate dev   # Apply new migrations
npx prisma db seed       # Re-seed demo data

# Frontend
npm run dev              # Start frontend dev server
npm run build            # Build for production
npm run preview          # Preview production build
```
