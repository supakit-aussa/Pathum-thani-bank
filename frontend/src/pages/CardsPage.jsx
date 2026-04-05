import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cardService } from '../services/cardService';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Badge from '../components/UI/Badge';

const cardTypeGradients = {
  DEBIT: 'from-blue-800 to-blue-600',
  CREDIT: 'from-gray-800 to-gray-600',
};

const CardsPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null,
    card: null,
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await cardService.getCards();
      if (response.success) {
        setCards(response.data.cards);
      }
    } catch (err) {
      setError('Failed to load cards.');
    } finally {
      setLoading(false);
    }
  };

  const handleLockToggle = (card) => {
    setConfirmModal({
      open: true,
      action: card.isLocked ? 'unlock' : 'lock',
      card,
    });
  };

  const handleConfirmAction = async () => {
    const { action, card } = confirmModal;
    setConfirmModal({ open: false, action: null, card: null });
    setActionLoading((prev) => ({ ...prev, [card.id]: true }));
    setError('');
    setSuccessMessage('');

    try {
      let response;
      if (action === 'lock') {
        response = await cardService.lockCard(card.id);
      } else {
        response = await cardService.unlockCard(card.id);
      }

      if (response.success) {
        setSuccessMessage(
          `Card ending in ${card.cardNumberMasked?.slice(-4)} ${action === 'lock' ? 'locked' : 'unlocked'} successfully.`
        );
        await fetchCards();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} card.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      year: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Cards</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your debit and credit cards</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {cards.length === 0 ? (
        <Card className="text-center py-16">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Cards</h3>
          <p className="text-gray-500 text-sm">
            You don't have any cards yet. Please visit a branch to apply.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="space-y-3">
              {/* Visual card */}
              <div
                className={`relative bg-gradient-to-br ${
                  cardTypeGradients[card.cardType] || cardTypeGradients.DEBIT
                } rounded-2xl p-5 text-white overflow-hidden ${
                  card.isLocked ? 'opacity-70 grayscale' : ''
                }`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                {card.isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 rounded-2xl">
                    <div className="bg-white/90 rounded-xl px-4 py-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-semibold text-gray-700">Card Locked</span>
                    </div>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-white/70 mb-1">Prathum-Thani Bank</p>
                      <Badge
                        size="sm"
                        className="bg-white/20 text-white border-0 text-xs"
                      >
                        {card.cardType}
                      </Badge>
                    </div>
                    <CreditCard className="w-8 h-8 text-white/70" />
                  </div>

                  {/* Card number */}
                  <p className="font-mono text-lg tracking-widest mb-6">
                    {card.cardNumberMasked || '**** **** **** ****'}
                  </p>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-xs mb-0.5">VALID THRU</p>
                      <p className="text-sm font-medium font-mono">
                        {formatDate(card.expiryDate)}
                      </p>
                    </div>
                    {card.account && (
                      <div className="text-right">
                        <p className="text-white/70 text-xs mb-0.5">BALANCE</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(card.account.balance)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card details & actions */}
              <Card padding="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {card.account?.accountType || 'Account'} Card
                    </p>
                    <p className="text-xs text-gray-500">
                      Account: {card.account?.accountNumber}
                    </p>
                  </div>
                  <Badge
                    variant={card.isLocked ? 'danger' : 'success'}
                    dot
                  >
                    {card.isLocked ? 'Locked' : 'Active'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={card.isLocked ? 'success' : 'secondary'}
                    size="sm"
                    fullWidth
                    icon={card.isLocked ? Unlock : Lock}
                    loading={actionLoading[card.id]}
                    onClick={() => handleLockToggle(card)}
                  >
                    {card.isLocked ? 'Unlock Card' : 'Lock Card'}
                  </Button>
                </div>

                {card.isLocked && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <ShieldAlert className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      This card is locked. No transactions can be made until unlocked.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Confirm lock/unlock modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null, card: null })}
        title={`${confirmModal.action === 'lock' ? 'Lock' : 'Unlock'} Card`}
        size="sm"
      >
        <div className="py-2">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                confirmModal.action === 'lock' ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              {confirmModal.action === 'lock' ? (
                <Lock className="w-6 h-6 text-red-600" />
              ) : (
                <Unlock className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {confirmModal.action === 'lock' ? 'Lock this card?' : 'Unlock this card?'}
              </p>
              <p className="text-sm text-gray-500">
                Card: {confirmModal.card?.cardNumberMasked}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            {confirmModal.action === 'lock'
              ? 'Locking this card will prevent all transactions. You can unlock it at any time.'
              : 'Unlocking this card will restore normal transaction capabilities.'}
          </p>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setConfirmModal({ open: false, action: null, card: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.action === 'lock' ? 'danger' : 'success'}
              fullWidth
              onClick={handleConfirmAction}
            >
              {confirmModal.action === 'lock' ? 'Lock Card' : 'Unlock Card'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CardsPage;
