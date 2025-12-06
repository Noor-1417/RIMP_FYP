import React from 'react';
import { motion } from 'framer-motion';

export const AdminCard = ({ icon, title, value, trend, color = 'primary' }) => {
  const bgColor = {
    primary: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-orange-500 to-orange-600',
    danger: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  }[color];

  const borderColor = {
    primary: 'border-blue-400',
    success: 'border-green-400',
    warning: 'border-orange-400',
    danger: 'border-red-400',
    purple: 'border-purple-400',
    indigo: 'border-indigo-400',
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${bgColor} text-white rounded-lg p-6 shadow-lg hover:shadow-2xl transition-all border-2 ${borderColor}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <h3 className="text-4xl font-bold mt-2">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-200' : 'text-red-200'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className="text-6xl opacity-30">{icon}</div>
      </div>
    </motion.div>
  );
};

export default AdminCard;
