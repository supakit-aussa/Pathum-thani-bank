import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      iconPosition = 'left',
      rightElement,
      className = '',
      containerClassName = '',
      required = false,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon
                className={`w-4 h-4 ${hasError ? 'text-red-400' : 'text-gray-400'}`}
              />
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full rounded-lg border px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-colors
              ${hasError
                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500 bg-white'
              }
              ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${rightElement ? 'pr-10' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
              ${className}
            `}
            {...props}
          />

          {Icon && iconPosition === 'right' && !rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icon
                className={`w-4 h-4 ${hasError ? 'text-red-400' : 'text-gray-400'}`}
              />
            </div>
          )}

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span>{error}</span>
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
