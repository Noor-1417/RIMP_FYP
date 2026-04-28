import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg',
    xl: 'w-full max-w-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`${sizeClasses[size]} bg-white rounded-lg shadow-lg`}
      >
        <div className="flex items-center justify-between p-6 border-b border-light">
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-primary transition"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg bg-light text-primary disabled:opacity-50"
      >
        Previous
      </motion.button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = currentPage > 3 ? currentPage + i - 2 : i + 1;
        if (page > totalPages) return null;
        return (
          <motion.button
            key={page}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg ${
              currentPage === page
                ? 'bg-primary text-white'
                : 'bg-light text-primary hover:bg-secondary hover:text-white'
            }`}
          >
            {page}
          </motion.button>
        );
      })}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg bg-light text-primary disabled:opacity-50"
      >
        Next
      </motion.button>
    </div>
  );
};

export const ProgressBar = ({ percentage, label, showLabel = true }) => {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-primary">{label}</span>
          <span className="text-sm font-medium text-primary">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-light rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-primary to-secondary"
        />
      </div>
    </div>
  );
};

export const Alert = ({ type = 'info', message, onClose }) => {
  const bgColors = {
    success: 'bg-green-100 border-green-500',
    error: 'bg-red-100 border-red-500',
    warning: 'bg-yellow-100 border-yellow-500',
    info: 'bg-blue-100 border-blue-500',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border-l-4 p-4 rounded ${bgColors[type]} mb-4`}
    >
      <div className="flex items-center justify-between">
        <p className={`${textColors[type]} font-medium`}>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className={`${textColors[type]} hover:opacity-70`}
          >
            <FiX size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const Card = ({ children, className = '', hoverable = false }) => {
  return (
    <motion.div
      whileHover={hoverable ? { translateY: -4 } : {}}
      className={`bg-white rounded-lg shadow-md p-6 ${hoverable ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const Badge = ({ children, variant = 'primary', size = 'md' }) => {
  const variants = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    light: 'bg-light text-primary',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-block rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
