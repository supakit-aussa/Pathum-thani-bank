import React, { useState, useEffect } from 'react';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { accountService } from '../services/accountService';
import { useAuth } from '../hooks/useAuth';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import AccountCard from '../components/Dashboard/AccountCard';
import TransactionList from '../components/Dashboard/TransactionList';
import QuickActions from '../components/Dashboard/QuickActions';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [accountsRes, transactionsRes] = await Promise.all([
          accountService.getAccounts(),
          accountService.getRecentTransactions(10),
        ]);

        if (accountsRes.success) {
          setAccounts(accountsRes.data.accounts);
        }
        if (transactionsRes.success) {
          setTransactions(transactionsRes.data.transactions);
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0
  );

  // Generate chart data from transactions (last 7 days)
  const getChartData = () => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('th-TH', {
        month: 'short',
        day: 'numeric',
      });

      const dayTransactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.createdAt);
        return txnDate.toDateString() === date.toDateString();
      });

      const income = dayTransactions
        .filter(
          (t) =>
            t.type === 'DEPOSIT' ||
            (t.type === 'TRANSFER' && t.direction === 'CREDIT')
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expense = dayTransactions
        .filter(
          (t) =>
            t.type === 'WITHDRAWAL' ||
            t.type === 'PAYMENT' ||
            (t.type === 'TRANSFER' && t.direction === 'DEBIT')
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      data.push({ date: dateStr, income, expense });
    }
    return data;
  };

  const chartData = getChartData();

  // Calculate stats from transactions
  const totalIncome = transactions
    .filter(
      (t) =>
        t.type === 'DEPOSIT' ||
        (t.type === 'TRANSFER' && t.direction === 'CREDIT')
    )
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpense = transactions
    .filter(
      (t) =>
        t.type === 'WITHDRAWAL' ||
        t.type === 'PAYMENT' ||
        (t.type === 'TRANSFER' && t.direction === 'DEBIT')
    )
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your accounts and recent activity
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-800 to-blue-700 border-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-200 text-sm font-medium">Total Balance</p>
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</p>
          <p className="text-blue-200 text-xs mt-1">{accounts.length} account(s)</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Recent Income</p>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <p className="text-gray-400 text-xs mt-1">Last 10 transactions</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Recent Expenses</p>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpense)}</p>
          <p className="text-gray-400 text-xs mt-1">Last 10 transactions</p>
        </Card>
      </div>

      {/* Accounts */}
      {accounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">My Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Chart and transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Transaction Activity</CardTitle>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [formatCurrency(value)]}
              />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#16a34a"
                fill="#dcfce7"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stackId="2"
                stroke="#1565c0"
                fill="#dbeafe"
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <TransactionList
            transactions={transactions.slice(0, 5)}
            emptyMessage="No recent transactions"
          />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
