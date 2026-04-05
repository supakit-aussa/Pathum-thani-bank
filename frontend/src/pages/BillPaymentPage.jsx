import React, { useState, useEffect } from 'react';
import {
  Search,
  Receipt,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  History,
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { billService } from '../services/billService';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import Badge from '../components/UI/Badge';

const BillPaymentPage = () => {
  const [activeView, setActiveView] = useState('pay'); // 'pay' | 'history'
  const [accounts, setAccounts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [payForm, setPayForm] = useState({
    fromAccountId: '',
    billerAccountNumber: '',
    amount: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [payLoading, setPayLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState({ open: false, data: null });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [accsResponse, providersResponse] = await Promise.all([
          accountService.getAccounts(),
          billService.getProviders(),
        ]);

        if (accsResponse.success) {
          const accs = accsResponse.data.accounts;
          setAccounts(accs);
          if (accs.length > 0) {
            setPayForm((prev) => ({ ...prev, fromAccountId: accs[0].id }));
          }
        }

        if (providersResponse.success) {
          setProviders(providersResponse.data.providers);
          setCategories(providersResponse.data.categories);
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      fetchBillHistory();
    }
  }, [activeView]);

  useEffect(() => {
    const fetchFilteredProviders = async () => {
      try {
        const response = await billService.getProviders({
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
        });
        if (response.success) {
          setProviders(response.data.providers);
        }
      } catch (err) {
        // Silent fail
      }
    };

    const debounce = setTimeout(fetchFilteredProviders, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategory]);

  const fetchBillHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await billService.getBillHistory({ limit: 20 });
      if (response.success) {
        setBillHistory(response.data.billPayments);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const errors = {};
    if (!payForm.fromAccountId) errors.fromAccountId = 'Select an account';
    if (!selectedProvider) errors.provider = 'Select a bill provider';
    if (!payForm.billerAccountNumber) errors.billerAccountNumber = 'Enter biller account/reference number';
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      errors.amount = 'Enter a valid amount';
    }

    const sourceAccount = accounts.find((a) => a.id === payForm.fromAccountId);
    if (sourceAccount && parseFloat(payForm.amount) > parseFloat(sourceAccount.balance)) {
      errors.amount = 'Insufficient balance';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setPayLoading(true);
    try {
      const response = await billService.payBill({
        fromAccountId: payForm.fromAccountId,
        providerId: selectedProvider.id,
        billerAccountNumber: payForm.billerAccountNumber,
        amount: payForm.amount,
        description: payForm.description,
      });

      if (response.success) {
        setSuccessModal({ open: true, data: response.data });
        setPayForm((prev) => ({
          fromAccountId: prev.fromAccountId,
          billerAccountNumber: '',
          amount: '',
          description: '',
        }));
        setSelectedProvider(null);

        // Refresh accounts
        const accsResponse = await accountService.getAccounts();
        if (accsResponse.success) setAccounts(accsResponse.data.accounts);
      } else {
        setErrorMessage(response.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (date) =>
    new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Pay your bills quickly and securely</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveView('pay')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === 'pay' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            Pay Bill
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === 'history' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeView === 'pay' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Provider selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Provider</CardTitle>
              </CardHeader>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category filters */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {formErrors.provider && (
                <p className="text-xs text-red-600 mb-2">{formErrors.provider}</p>
              )}

              {/* Providers list */}
              <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider);
                      setFormErrors((prev) => ({ ...prev, provider: '' }));
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedProvider?.id === provider.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{provider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {provider.name}
                      </p>
                      <p className="text-xs text-gray-500">{provider.category}</p>
                    </div>
                    {selectedProvider?.id === provider.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {providers.length === 0 && (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No providers found
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Payment form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>

              {selectedProvider && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <span className="text-2xl">{selectedProvider.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedProvider.name}
                    </p>
                    <p className="text-xs text-blue-600">{selectedProvider.category}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay From <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={payForm.fromAccountId}
                    onChange={(e) => {
                      setPayForm((prev) => ({ ...prev, fromAccountId: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, fromAccountId: '' }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} — {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                  {formErrors.fromAccountId && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fromAccountId}</p>
                  )}
                </div>

                <Input
                  label="Biller Account / Reference Number"
                  type="text"
                  value={payForm.billerAccountNumber}
                  onChange={(e) => {
                    setPayForm((prev) => ({
                      ...prev,
                      billerAccountNumber: e.target.value,
                    }));
                    setFormErrors((prev) => ({ ...prev, billerAccountNumber: '' }));
                  }}
                  placeholder="Enter account or reference number"
                  error={formErrors.billerAccountNumber}
                  required
                />

                <Input
                  label="Amount (THB)"
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => {
                    setPayForm((prev) => ({ ...prev, amount: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  error={formErrors.amount}
                  required
                />

                <Input
                  label="Note (optional)"
                  type="text"
                  value={payForm.description}
                  onChange={(e) =>
                    setPayForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Add a note"
                  maxLength={200}
                />

                <Button
                  type="submit"
                  loading={payLoading}
                  fullWidth
                  size="lg"
                  disabled={!selectedProvider}
                  icon={Receipt}
                  iconPosition="right"
                >
                  Pay Now
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Bill history */}
      {activeView === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-800" />
            </div>
          ) : billHistory.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No bill payment history</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {billHistory.map((bill) => (
                <div key={bill.id} className="flex items-center gap-4 py-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {bill.provider}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ref: {bill.accountNumber} · {formatDate(bill.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      -{formatCurrency(bill.amount)}
                    </p>
                    <Badge
                      variant={
                        bill.status === 'COMPLETED'
                          ? 'success'
                          : bill.status === 'FAILED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {bill.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Success modal */}
      <Modal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false, data: null })}
        title="Payment Successful"
        size="sm"
      >
        {successModal.data && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">Bill Paid Successfully</p>
            <p className="text-gray-500 text-sm mb-4">{successModal.data.provider}</p>
            <Button
              fullWidth
              onClick={() => setSuccessModal({ open: false, data: null })}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillPaymentPage;
