import React, { useState } from 'react';
import { Eye, EyeOff, ArrowUpRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const accountTypeLabels = {
  SAVINGS: 'Savings Account',
  ESAVINGS: 'e-Savings Account',
  FIXED_DEPOSIT: 'Fixed Deposit',
};

const accountTypeGradients = {
  SAVINGS: 'from-blue-800 to-blue-600',
  ESAVINGS: 'from-indigo-700 to-blue-600',
  FIXED_DEPOSIT: 'from-blue-900 to-indigo-800',
};

const AccountCard = ({ account }) => {
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();

  const formatBalance = (balance) => {
    if (!showBalance) return '฿ ••••••';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(balance);
  };

  const formatAccountNumber = (number) => {
    if (!number) return '';
    return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  const gradient = accountTypeGradients[account.accountType] || accountTypeGradients.SAVINGS;

  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={() => navigate(`/accounts?id=${account.id}`)}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Card content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-1">
              {accountTypeLabels[account.accountType] || account.accountType}
            </p>
            <p className="text-white/80 text-sm font-mono tracking-wider">
              {formatAccountNumber(account.accountNumber)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance(!showBalance);
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? (
                <EyeOff className="w-4 h-4 text-white" />
              ) : (
                <Eye className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-blue-200 text-xs mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-white">
            {formatBalance(account.balance)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200 text-xs">{account.currency}</span>
          </div>
          <div
            className={`flex items-center gap-1 text-xs ${
              account.isActive ? 'text-green-300' : 'text-red-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                account.isActive ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            {account.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
