import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowLeftRight,
  TrendingUp,
  DollarSign,
  Flag,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import Input from '../components/UI/Input';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [rateEditModal, setRateEditModal] = useState({
    open: false,
    currency: '',
    rate: '',
  });
  const [rateUpdateLoading, setRateUpdateLoading] = useState(false);
  const [flagModal, setFlagModal] = useState({
    open: false,
    transaction: null,
    reason: '',
  });

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const response = await adminService.getStats();
        if (response.success) setStats(response.data);
      } else if (activeTab === 'users') {
        const response = await adminService.getAllUsers({ limit: 30 });
        if (response.success) setUsers(response.data.users);
      } else if (activeTab === 'transactions') {
        const response = await adminService.getAllTransactions({ limit: 30 });
        if (response.success) setTransactions(response.data.transactions);
      } else if (activeTab === 'rates') {
        const response = await adminService.getExchangeRates();
        if (response.success) setExchangeRates(response.data.rates);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const response = await adminService.updateUserStatus(userId, !currentStatus);
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
        );
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleFlagTransaction = async () => {
    const { transaction, reason } = flagModal;
    try {
      const isFlagged = transaction.status !== 'FAILED';
      await adminService.flagTransaction(transaction.id, isFlagged, reason);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id
            ? { ...t, status: isFlagged ? 'FAILED' : 'COMPLETED' }
            : t
        )
      );
      setFlagModal({ open: false, transaction: null, reason: '' });
    } catch (err) {
      // Silent fail
    }
  };

  const handleUpdateRate = async () => {
    setRateUpdateLoading(true);
    try {
      const response = await adminService.updateExchangeRate(
        rateEditModal.currency,
        parseFloat(rateEditModal.rate)
      );
      if (response.success) {
        setExchangeRates((prev) =>
          prev.map((r) =>
            r.currency === rateEditModal.currency
              ? { ...r, rate: rateEditModal.rate }
              : r
          )
        );
        setRateEditModal({ open: false, currency: '', rate: '' });
      }
    } catch (err) {
      // Silent fail
    } finally {
      setRateUpdateLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date) =>
    new Intl.DateTimeFormat('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'rates', label: 'Exchange Rates', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">System administration and monitoring</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchTabData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-800" />
        </div>
      )}

      {/* Overview tab */}
      {!loading && activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.stats.totalUsers}</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.stats.activeUsers} active
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-700" />
                </div>
                <p className="text-sm text-gray-500">Total Transactions</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.stats.totalTransactions}
              </p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-700" />
                </div>
                <p className="text-sm text-gray-500">Transaction Volume</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.stats.totalTransactionVolume)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Completed only</p>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-orange-700" />
                </div>
                <p className="text-sm text-gray-500">Active Accounts</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.stats.totalAccounts}
              </p>
              <p className="text-xs text-gray-400 mt-1">All accounts</p>
            </Card>
          </div>

          {/* Recent transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-50">
              {stats.recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {txn.type} — {txn.reference?.slice(-8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(txn.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(txn.amount)}
                    </p>
                    <Badge
                      variant={
                        txn.status === 'COMPLETED'
                          ? 'success'
                          : txn.status === 'FAILED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Users tab */}
      {!loading && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Card padding="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Accounts
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.role === 'ADMIN' ? 'warning' : 'primary'}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {user._count?.accounts || 0} account(s)
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.isActive ? 'success' : 'danger'}
                          dot
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            handleUserStatusToggle(user.id, user.isActive)
                          }
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            user.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No users found
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Transactions tab */}
      {!loading && activeTab === 'transactions' && (
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-gray-700">
                        {txn.reference?.slice(-10)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary" size="sm">
                        {txn.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(txn.amount)}
                      </p>
                      {parseFloat(txn.amount) > 500000 && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High value
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">
                        {txn.fromAccount?.user?.fullName || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {txn.fromAccount?.accountNumber || ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          txn.status === 'COMPLETED'
                            ? 'success'
                            : txn.status === 'FAILED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {txn.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500">
                        {formatDate(txn.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setFlagModal({
                            open: true,
                            transaction: txn,
                            reason: '',
                          })
                        }
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        {txn.status === 'FAILED' ? 'Unflag' : 'Flag'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-sm">
                No transactions found
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Exchange rates tab */}
      {!loading && activeTab === 'rates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exchangeRates.map((rate) => (
            <Card key={rate.id} hover>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-800">
                    {rate.currency}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setRateEditModal({
                      open: true,
                      currency: rate.currency,
                      rate: parseFloat(rate.rate).toString(),
                    })
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ฿{parseFloat(rate.rate).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                1 {rate.currency} = ฿{parseFloat(rate.rate).toFixed(4)} THB
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Rate edit modal */}
      <Modal
        isOpen={rateEditModal.open}
        onClose={() => setRateEditModal({ open: false, currency: '', rate: '' })}
        title={`Update ${rateEditModal.currency} Exchange Rate`}
        size="sm"
      >
        <div className="space-y-4 py-2">
          <Input
            label={`Rate (1 ${rateEditModal.currency} = ฿ THB)`}
            type="number"
            value={rateEditModal.rate}
            onChange={(e) =>
              setRateEditModal((prev) => ({ ...prev, rate: e.target.value }))
            }
            placeholder="0.00"
            min="0.000001"
            step="0.01"
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setRateEditModal({ open: false, currency: '', rate: '' })}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              loading={rateUpdateLoading}
              onClick={handleUpdateRate}
            >
              Update Rate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Flag transaction modal */}
      <Modal
        isOpen={flagModal.open}
        onClose={() => setFlagModal({ open: false, transaction: null, reason: '' })}
        title="Flag Transaction"
        size="sm"
      >
        {flagModal.transaction && (
          <div className="space-y-4 py-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Transaction: <span className="font-mono">{flagModal.transaction.reference?.slice(-10)}</span>
              </p>
              <p className="text-sm font-semibold text-yellow-900">
                Amount: {formatCurrency(flagModal.transaction.amount)}
              </p>
            </div>
            <Input
              label="Flag Reason (optional)"
              type="text"
              value={flagModal.reason}
              onChange={(e) =>
                setFlagModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Reason for flagging..."
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setFlagModal({ open: false, transaction: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleFlagTransaction}
              >
                {flagModal.transaction.status === 'FAILED' ? 'Unflag' : 'Flag'} Transaction
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPage;
