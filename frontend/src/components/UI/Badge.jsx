import React from 'react';

const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800',
  purple: 'bg-purple-100 text-purple-800',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClass} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            variant === 'success'
              ? 'bg-green-500'
              : variant === 'danger'
              ? 'bg-red-500'
              : variant === 'warning'
              ? 'bg-yellow-500'
              : variant === 'primary'
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
