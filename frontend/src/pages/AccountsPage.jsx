import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Filter } from 'lucide-react';
import { accountService } from '../services/accountService';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import AccountCard from '../components/Dashboard/AccountCard';
import TransactionList from '../components/Dashboard/TransactionList';
import Badge from '../components/UI/Badge';

const AccountsPage = () => {
  const [searchParams] = useSearchParams();
  const selectedAccountId = searchParams.get('id');

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState('');
  const [txFilter, setTxFilter] = useState('ALL');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await accountService.getAccounts();
        if (response.success) {
          const accs = response.data.accounts;
          setAccounts(accs);

          // Select account from URL param or first account
          const toSelect = accs.find((a) => a.id === selectedAccountId) || accs[0];
          if (toSelect) {
            setSelectedAccount(toSelect);
          }
        }
      } catch (err) {
        setError('Failed to load accounts.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [selectedAccountId]);

  useEffect(() => {
    if (!selectedAccount) return;

    const fetchTransactions = async () => {
      try {
        setTxLoading(true);
        const params = {
          page: currentPage,
          limit: 15,
        };
        if (txFilter !== 'ALL') {
          params.type = txFilter;
        }

        const response = await accountService.getTransactionHistory(
          selectedAccount.id,
          params
        );

        if (response.success) {
          setTransactions(response.data.transactions);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        // Handle error silently - show empty state
      } finally {
        setTxLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedAccount, txFilter, currentPage]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);

  const txTypeFilters = ['ALL', 'TRANSFER', 'PAYMENT', 'DEPOSIT', 'WITHDRAWAL'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your bank accounts</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Total balance summary */}
      <Card className="bg-gradient-to-r from-blue-800 to-blue-600 border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">Total Balance (All Accounts)</p>
            <p className="text-3xl font-bold text-white mt-1">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">{accounts.length} Account(s)</p>
            <Badge variant="primary" className="mt-1 bg-white/20 text-white border-0">
              THB
            </Badge>
          </div>
        </div>
      </Card>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            onClick={() => {
              setSelectedAccount(account);
              setCurrentPage(1);
              setTxFilter('ALL');
            }}
            className={`transition-all duration-200 ${
              selectedAccount?.id === account.id
                ? 'ring-2 ring-blue-500 ring-offset-2 rounded-2xl'
                : ''
            }`}
          >
            <AccountCard account={account} />
          </div>
        ))}
      </div>

      {/* Transaction history for selected account */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Transaction History</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Account: {selectedAccount.accountNumber}
              </p>
            </div>
          </CardHeader>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {txTypeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setTxFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  txFilter === filter
                    ? 'bg-blue-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'ALL' ? 'All Transactions' : filter.charAt(0) + filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-800" />
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              emptyMessage={`No ${txFilter === 'ALL' ? '' : txFilter.toLowerCase() + ' '}transactions found`}
            />
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} transactions)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AccountsPage;
