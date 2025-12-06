import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiBell, FiSearch } from 'react-icons/fi';

export const AdminNavbar = ({ onMenuToggle, onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => onSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 shadow-2xl px-8 py-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm"
    >
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
        >
          <FiMenu size={24} />
        </button>
        <h2 className="sr-only">Admin Dashboard</h2>
      </div>

      {/* Middle Section - Search */}
      <div className="flex-1 max-w-md mx-8 hidden md:flex">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, tasks..."
            className="w-full bg-gray-800/50 text-gray-100 placeholder-gray-500 px-4 py-2 pl-10 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
        >
          <FiBell size={22} />
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </motion.button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700/50" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-gray-200 text-sm">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogout}
          className="px-4 py-2 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all shadow-lg"
        >
          Logout
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default AdminNavbar;
