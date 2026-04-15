import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiUsers, FiFolder, FiCheckSquare, FiFileText, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: FiHome },
    { label: 'Students', path: '/admin/students', icon: FiUsers },
    { label: 'Applications', path: '/admin/applications', icon: FiFileText },
    { label: 'Categories', path: '/admin/categories', icon: FiFolder },
    { label: 'Tasks', path: '/admin/tasks', icon: FiCheckSquare },
    { label: 'Submissions', path: '/admin/submissions', icon: FiFileText },
    { label: 'Analytics', path: '/admin/analytics', icon: FiBarChart2 },
    { label: 'Settings', path: '/admin/settings', icon: FiSettings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static left-0 top-0 w-72 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6 overflow-y-auto z-40 border-r border-gray-700/50 shadow-2xl transition-transform duration-300`}
      >
        {/* Branding */}
        <div className="mb-8 pb-6 border-b border-gray-700">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">RIMP Admin</h1>
              <p className="text-xs text-gray-400">Management Portal</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-4">Menu</p>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} className={`transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto h-2 w-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-700 my-6" />

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all font-medium text-sm"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </motion.button>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            RIMP v1.0<br />
            © 2025 All rights reserved
          </p>
        </div>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
