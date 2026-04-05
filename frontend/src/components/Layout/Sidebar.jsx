import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    path: '/accounts',
    icon: Wallet,
    label: 'Accounts',
  },
  {
    path: '/transfer',
    icon: ArrowLeftRight,
    label: 'Transfer',
  },
  {
    path: '/bills',
    icon: Receipt,
    label: 'Bill Payment',
  },
  {
    path: '/cards',
    icon: CreditCard,
    label: 'Cards',
  },
  {
    path: '/notifications',
    icon: Bell,
    label: 'Notifications',
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={`flex flex-col h-full bg-blue-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo area */}
      <div className="flex items-center px-4 py-5 border-b border-blue-800">
        <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="font-bold text-sm leading-tight">Prathum-Thani</p>
            <p className="text-blue-300 text-xs">Bank</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg hover:bg-blue-800 transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div
              className={`mt-4 mb-2 ${collapsed ? 'px-2' : 'px-3'}`}
            >
              {!collapsed && (
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Admin
                </p>
              )}
              {collapsed && (
                <div className="border-t border-blue-800 my-2" />
              )}
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium">Admin Panel</span>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-blue-800 px-3 py-4">
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-white truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-blue-300 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="ml-3 text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
