import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-primary text-white hover:bg-opacity-90 focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-opacity-90 focus:ring-secondary',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-light',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};

export const Card = ({ children, className = '', hoverEffect = true, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hoverEffect ? { y: -5 } : {}}
      className={`
        bg-white rounded-lg shadow-md p-6
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    light: 'bg-light text-primary',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-primary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <motion.input
        whileFocus={{ scale: 1.02 }}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${props.className || ''}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export const TextArea = ({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  error,
  required = false,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-primary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <motion.textarea
        whileFocus={{ scale: 1.02 }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`
          w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-all
          ${error ? 'border-red-500' : 'border-light focus:border-primary'}
          resize-none
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export const Select = ({
  label,
  options = [],
  value,
  onChange,
  error,
  required = false,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-primary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <motion.select
        whileFocus={{ scale: 1.02 }}
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-all
          ${error ? 'border-red-500' : 'border-light focus:border-primary'}
          bg-white
        `}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </motion.select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
