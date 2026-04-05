import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  QrCode,
  Receipt,
  CreditCard,
  TrendingUp,
  History,
} from 'lucide-react';

const actions = [
  {
    icon: ArrowLeftRight,
    label: 'Transfer',
    description: 'Send money',
    path: '/transfer',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: QrCode,
    label: 'PromptPay',
    description: 'Pay by phone',
    path: '/transfer?tab=promptpay',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: Receipt,
    label: 'Pay Bills',
    description: 'Utilities & more',
    path: '/bills',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    icon: CreditCard,
    label: 'My Cards',
    description: 'Manage cards',
    path: '/cards',
    color: 'bg-purple-100 text-purple-700',
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          className="flex flex-col items-center p-4 rounded-xl border border-gray-100 bg-white hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div
            className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
          >
            <action.icon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-900">{action.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
