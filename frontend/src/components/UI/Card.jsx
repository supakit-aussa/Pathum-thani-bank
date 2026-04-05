import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-6',
  hover = false,
  onClick,
  ...props
}) => {
  const hoverClass = hover
    ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200'
    : '';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-card ${padding} ${hoverClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default Card;
