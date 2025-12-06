import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: user?.role === 'admin' ? '/admin' : '/dashboard' },
    { label: 'Internships', href: '/categories' },
    { label: 'My Tasks', href: '/tasks' },
    { label: 'Certificates', href: '/certificates' },
  ];

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-bold">
              R
            </div>
            <span className="text-xl font-bold">RIMP</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="hover:text-secondary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <FiBell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3"
                aria-label="Open profile"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
                <div className="text-sm text-left hidden sm:block">
                  <p className="font-semibold">{user?.firstName}</p>
                  <p className="text-xs text-gray-300">{user?.role === 'manager' ? 'Admin' : user?.role}</p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1 bg-secondary text-primary rounded hover:opacity-90 hidden md:inline-flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-secondary"
            >
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="block py-2 hover:text-secondary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                className="w-full text-left py-2 flex items-center gap-2 hover:text-secondary transition-colors"
              >
                <FiLogOut size={18} />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminMenuItems = [
    { label: 'Dashboard', icon: '📊', href: '/admin' },
    { label: 'Users', icon: '👥', href: '/admin/users' },
    { label: 'Categories', icon: '📚', href: '/admin/categories' },
    { label: 'Tasks', icon: '✓', href: '/admin/tasks' },
    { label: 'Quizzes', icon: '❓', href: '/admin/quizzes' },
    { label: 'Certificates', icon: '🎓', href: '/admin/certificates' },
    { label: 'Payments', icon: '💳', href: '/admin/payments' },
  ];

  const internMenuItems = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { label: 'My Tasks', icon: '✓', href: '/my-tasks' },
    { label: 'Quizzes', icon: '❓', href: '/my-quizzes' },
    { label: 'Certificates', icon: '🎓', href: '/my-certificates' },
    { label: 'Progress', icon: '📈', href: '/progress' },
  ];

  const items = user?.role === 'admin' ? adminMenuItems : internMenuItems;

  return (
    <div className="w-64 bg-primary text-white p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-8">RIMP</h2>
      
      <nav className="space-y-2">
        {items.map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ paddingLeft: '1rem' }}
            onClick={() => navigate(item.href)}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
          >
            <span>{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>
    </div>
  );
};
