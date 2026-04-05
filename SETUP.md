# Prathum-Thani Bank — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

## Quick Start

### 1. Database Setup
Create a PostgreSQL database:
```sql
CREATE DATABASE prathum_thani_bank;
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env — set your DATABASE_URL and JWT_SECRET

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Demo Credentials
- **User:** demo@example.com / User@1234
- **Admin:** admin@prathumthanibank.com / Admin@1234

## Available Features
- Login / Register with JWT auth
- Dashboard with account overview and charts
- Multiple account types (Savings, eSavings, Fixed Deposit)
- Internal bank transfers (ACID-compliant)
- PromptPay transfers by phone number
- Bill payment with 12+ providers
- Card management (lock/unlock)
- Notifications with unread badge
- Admin panel: users, transactions, exchange rates
