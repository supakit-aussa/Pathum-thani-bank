import React from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Banknote,
  ArrowLeftRight,
} from 'lucide-react';
import Badge from '../UI/Badge';

const typeConfig = {
  TRANSFER: {
    icon: ArrowLeftRight,
    label: 'Transfer',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
  },
  PAYMENT: {
    icon: Receipt,
    label: 'Payment',
    bgClass: 'bg-orange-50',
    iconClass: 'text-orange-600',
  },
  DEPOSIT: {
    icon: ArrowDownLeft,
    label: 'Deposit',
    bgClass: 'bg-green-50',
    iconClass: 'text-green-600',
  },
  WITHDRAWAL: {
    icon: ArrowUpRight,
    label: 'Withdrawal',
    bgClass: 'bg-red-50',
    iconClass: 'text-red-600',
  },
};

const statusVariants = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
};

const TransactionItem = ({ transaction }) => {
  const config = typeConfig[transaction.type] || typeConfig.TRANSFER;
  const Icon = config.icon;

  const isCredit =
    transaction.direction === 'CREDIT' ||
    transaction.type === 'DEPOSIT';

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getCounterpartyLabel = () => {
    if (transaction.type === 'DEPOSIT' && transaction.toAccount) {
      return `To ${transaction.toAccount.accountNumber}`;
    }
    if (transaction.type === 'WITHDRAWAL' && transaction.fromAccount) {
      return `From ${transaction.fromAccount.accountNumber}`;
    }
    if (transaction.fromAccount && transaction.toAccount) {
      if (isCredit) {
        return `From ${transaction.fromAccount.accountNumber}`;
      }
      return `To ${transaction.toAccount.accountNumber}`;
    }
    return transaction.description || config.label;
  };

  return (
    <div className="flex items-center gap-4 py-3 group">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-5 h-5 ${config.iconClass}`} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-900 truncate">
            {transaction.description || config.label}
          </p>
          <Badge
            variant={statusVariants[transaction.status] || 'default'}
            size="sm"
          >
            {transaction.status}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          {getCounterpartyLabel()} · {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-semibold ${
            isCredit ? 'text-green-600' : 'text-gray-900'
          }`}
        >
          {isCredit ? '+' : '-'}
          {formatAmount(transaction.amount)}
        </p>
        <p className="text-xs text-gray-400 font-mono">
          #{transaction.reference?.slice(-8)}
        </p>
      </div>
    </div>
  );
};

const TransactionList = ({ transactions, emptyMessage = 'No transactions yet' }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

export default TransactionList;
