import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { transferService } from '../services/transferService';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';

const TransferPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'promptpay' ? 'promptpay' : 'internal';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Internal transfer state
  const [internalForm, setInternalForm] = useState({
    fromAccountId: '',
    toAccountNumber: '',
    amount: '',
    description: '',
  });
  const [internalLookup, setInternalLookup] = useState(null);
  const [internalLookupLoading, setInternalLookupLoading] = useState(false);
  const [internalErrors, setInternalErrors] = useState({});

  // PromptPay state
  const [promptPayForm, setPromptPayForm] = useState({
    fromAccountId: '',
    promptPayId: '',
    amount: '',
    description: '',
  });
  const [promptPayLookup, setPromptPayLookup] = useState(null);
  const [promptPayLookupLoading, setPromptPayLookupLoading] = useState(false);
  const [promptPayErrors, setPromptPayErrors] = useState({});

  // Shared state
  const [transferLoading, setTransferLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, data: null });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await accountService.getAccounts();
        if (response.success) {
          const accs = response.data.accounts;
          setAccounts(accs);
          if (accs.length > 0) {
            setInternalForm((prev) => ({ ...prev, fromAccountId: accs[0].id }));
            setPromptPayForm((prev) => ({ ...prev, fromAccountId: accs[0].id }));
          }
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleInternalLookup = async () => {
    if (!internalForm.toAccountNumber) return;
    setInternalLookupLoading(true);
    setInternalLookup(null);
    setInternalErrors({});

    try {
      const response = await transferService.lookupAccount(internalForm.toAccountNumber);
      if (response.success) {
        setInternalLookup(response.data);
      } else {
        setInternalErrors({ toAccountNumber: 'Account not found' });
      }
    } catch (err) {
      setInternalErrors({ toAccountNumber: err.message || 'Account not found' });
    } finally {
      setInternalLookupLoading(false);
    }
  };

  const handlePromptPayLookup = async () => {
    if (!promptPayForm.promptPayId) return;
    setPromptPayLookupLoading(true);
    setPromptPayLookup(null);
    setPromptPayErrors({});

    try {
      const response = await transferService.lookupPromptPay(promptPayForm.promptPayId);
      if (response.success) {
        setPromptPayLookup(response.data);
      } else {
        setPromptPayErrors({ promptPayId: 'PromptPay ID not registered' });
      }
    } catch (err) {
      setPromptPayErrors({ promptPayId: err.message || 'PromptPay ID not found' });
    } finally {
      setPromptPayLookupLoading(false);
    }
  };

  const handleInternalTransfer = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const errors = {};
    if (!internalForm.fromAccountId) errors.fromAccountId = 'Select source account';
    if (!internalForm.toAccountNumber) errors.toAccountNumber = 'Enter account number';
    if (!internalLookup) errors.toAccountNumber = 'Please verify account first';
    if (!internalForm.amount || parseFloat(internalForm.amount) <= 0) {
      errors.amount = 'Enter a valid amount';
    }

    const sourceAccount = accounts.find((a) => a.id === internalForm.fromAccountId);
    if (sourceAccount && parseFloat(internalForm.amount) > parseFloat(sourceAccount.balance)) {
      errors.amount = 'Insufficient balance';
    }

    if (Object.keys(errors).length > 0) {
      setInternalErrors(errors);
      return;
    }

    setTransferLoading(true);
    try {
      const response = await transferService.internalTransfer(internalForm);
      if (response.success) {
        setSuccessModal({ open: true, data: response.data });
        setInternalForm((prev) => ({
          fromAccountId: prev.fromAccountId,
          toAccountNumber: '',
          amount: '',
          description: '',
        }));
        setInternalLookup(null);
        // Refresh accounts
        const accsResponse = await accountService.getAccounts();
        if (accsResponse.success) setAccounts(accsResponse.data.accounts);
      } else {
        setErrorMessage(response.message);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Transfer failed. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handlePromptPayTransfer = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const errors = {};
    if (!promptPayForm.fromAccountId) errors.fromAccountId = 'Select source account';
    if (!promptPayForm.promptPayId) errors.promptPayId = 'Enter PromptPay ID';
    if (!promptPayLookup) errors.promptPayId = 'Please verify PromptPay ID first';
    if (!promptPayForm.amount || parseFloat(promptPayForm.amount) <= 0) {
      errors.amount = 'Enter a valid amount';
    }

    if (Object.keys(errors).length > 0) {
      setPromptPayErrors(errors);
      return;
    }

    setTransferLoading(true);
    try {
      const response = await transferService.promptPayTransfer(promptPayForm);
      if (response.success) {
        setSuccessModal({ open: true, data: response.data });
        setPromptPayForm((prev) => ({
          fromAccountId: prev.fromAccountId,
          promptPayId: '',
          amount: '',
          description: '',
        }));
        setPromptPayLookup(null);
        const accsResponse = await accountService.getAccounts();
        if (accsResponse.success) setAccounts(accsResponse.data.accounts);
      } else {
        setErrorMessage(response.message);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Transfer failed. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);

  const getSelectedAccountBalance = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? parseFloat(account.balance) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Money</h1>
        <p className="text-gray-500 text-sm mt-1">Send money securely to any account</p>
      </div>

      {/* Tab selector */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => {
            setActiveTab('internal');
            setErrorMessage('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'internal'
              ? 'bg-white text-blue-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Bank Transfer
        </button>
        <button
          onClick={() => {
            setActiveTab('promptpay');
            setErrorMessage('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'promptpay'
              ? 'bg-white text-blue-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          PromptPay
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Internal Transfer Form */}
      {activeTab === 'internal' && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer</CardTitle>
          </CardHeader>
          <form onSubmit={handleInternalTransfer} className="space-y-4">
            {/* From account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Account <span className="text-red-500">*</span>
              </label>
              <select
                value={internalForm.fromAccountId}
                onChange={(e) => {
                  setInternalForm((prev) => ({
                    ...prev,
                    fromAccountId: e.target.value,
                  }));
                  setInternalErrors((prev) => ({ ...prev, fromAccountId: '' }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} ({acc.accountType}) — {formatCurrency(acc.balance)}
                  </option>
                ))}
              </select>
              {internalErrors.fromAccountId && (
                <p className="text-xs text-red-600 mt-1">{internalErrors.fromAccountId}</p>
              )}
              {internalForm.fromAccountId && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCurrency(getSelectedAccountBalance(internalForm.fromAccountId))}
                </p>
              )}
            </div>

            {/* To account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Account Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={internalForm.toAccountNumber}
                  onChange={(e) => {
                    setInternalForm((prev) => ({
                      ...prev,
                      toAccountNumber: e.target.value,
                    }));
                    setInternalLookup(null);
                    setInternalErrors((prev) => ({ ...prev, toAccountNumber: '' }));
                  }}
                  placeholder="Enter account number"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleInternalLookup}
                  loading={internalLookupLoading}
                  icon={Search}
                >
                  Verify
                </Button>
              </div>
              {internalErrors.toAccountNumber && (
                <p className="text-xs text-red-600 mt-1">{internalErrors.toAccountNumber}</p>
              )}
              {internalLookup && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {internalLookup.recipientName}
                    </p>
                    <p className="text-xs text-green-600">
                      {internalLookup.accountType} — {internalLookup.accountNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <Input
              label="Amount (THB)"
              type="number"
              value={internalForm.amount}
              onChange={(e) => {
                setInternalForm((prev) => ({ ...prev, amount: e.target.value }));
                setInternalErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder="0.00"
              min="1"
              step="0.01"
              error={internalErrors.amount}
              required
            />

            {/* Description */}
            <Input
              label="Description (optional)"
              type="text"
              value={internalForm.description}
              onChange={(e) =>
                setInternalForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="What's this transfer for?"
              maxLength={200}
            />

            <Button
              type="submit"
              loading={transferLoading}
              fullWidth
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              disabled={!internalLookup}
            >
              Transfer Now
            </Button>
          </form>
        </Card>
      )}

      {/* PromptPay Transfer Form */}
      {activeTab === 'promptpay' && (
        <Card>
          <CardHeader>
            <CardTitle>PromptPay Transfer</CardTitle>
          </CardHeader>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              Enter the recipient's registered phone number (10 digits) to transfer via PromptPay.
            </p>
          </div>
          <form onSubmit={handlePromptPayTransfer} className="space-y-4">
            {/* From account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Account <span className="text-red-500">*</span>
              </label>
              <select
                value={promptPayForm.fromAccountId}
                onChange={(e) => {
                  setPromptPayForm((prev) => ({
                    ...prev,
                    fromAccountId: e.target.value,
                  }));
                  setPromptPayErrors((prev) => ({ ...prev, fromAccountId: '' }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} ({acc.accountType}) — {formatCurrency(acc.balance)}
                  </option>
                ))}
              </select>
              {promptPayErrors.fromAccountId && (
                <p className="text-xs text-red-600 mt-1">{promptPayErrors.fromAccountId}</p>
              )}
            </div>

            {/* PromptPay ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PromptPay ID (Phone Number) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptPayForm.promptPayId}
                  onChange={(e) => {
                    setPromptPayForm((prev) => ({
                      ...prev,
                      promptPayId: e.target.value,
                    }));
                    setPromptPayLookup(null);
                    setPromptPayErrors((prev) => ({ ...prev, promptPayId: '' }));
                  }}
                  placeholder="0812345678"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePromptPayLookup}
                  loading={promptPayLookupLoading}
                  icon={Search}
                >
                  Verify
                </Button>
              </div>
              {promptPayErrors.promptPayId && (
                <p className="text-xs text-red-600 mt-1">{promptPayErrors.promptPayId}</p>
              )}
              {promptPayLookup && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {promptPayLookup.recipientName}
                    </p>
                    <p className="text-xs text-green-600">
                      PromptPay: {promptPayLookup.promptPayId}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <Input
              label="Amount (THB)"
              type="number"
              value={promptPayForm.amount}
              onChange={(e) => {
                setPromptPayForm((prev) => ({ ...prev, amount: e.target.value }));
                setPromptPayErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder="0.00"
              min="1"
              max="2000000"
              step="0.01"
              error={promptPayErrors.amount}
              hint="Maximum: ฿2,000,000 per transaction"
              required
            />

            {/* Description */}
            <Input
              label="Note (optional)"
              type="text"
              value={promptPayForm.description}
              onChange={(e) =>
                setPromptPayForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="What's this for?"
              maxLength={200}
            />

            <Button
              type="submit"
              loading={transferLoading}
              fullWidth
              size="lg"
              icon={QrCode}
              iconPosition="right"
              disabled={!promptPayLookup}
            >
              Send via PromptPay
            </Button>
          </form>
        </Card>
      )}

      {/* Success Modal */}
      <Modal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false, data: null })}
        title="Transfer Successful"
        size="sm"
      >
        {successModal.data && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              {formatCurrency(successModal.data.transaction?.amount)}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Transferred to{' '}
              <span className="font-semibold text-gray-700">
                {successModal.data.recipient?.name}
              </span>
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-left space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-gray-700 text-xs">
                  {successModal.data.transaction?.reference}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 font-medium">Completed</span>
              </div>
            </div>
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

export default TransferPage;
