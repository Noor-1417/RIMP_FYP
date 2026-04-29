import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiLogOut, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';
import api from '../../services/api';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  const menuItems = [
    { label: 'Dashboard', href: user?.role === 'admin' ? '/admin' : '/dashboard' },
    { label: 'Internships', href: '/categories' },
    { label: 'My Tasks', href: '/tasks' },
    ...(user?.role === 'intern' ? [{ label: 'Progress', href: '/student-progress' }] : []),
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
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 text-[10px] flex items-center justify-center font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 text-white"
                  >
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-700">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n._id} className={`p-3 flex gap-3 text-left hover:bg-gray-700/50 transition ${!n.isRead ? 'bg-blue-900/20' : ''}`}>
                            <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.isRead ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{n.title}</p>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                            {!n.isRead && (
                              <button onClick={() => markAsRead(n._id)} className="text-gray-400 hover:text-blue-400 p-1" title="Mark as read">
                                <FiCheck size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {user?.role === 'admin' && (
                      <div className="p-2 border-t border-gray-700 text-center bg-gray-900/50">
                        <Link to="/admin/notifications" className="text-xs text-blue-400 hover:text-blue-300" onClick={() => setShowNotifDropdown(false)}>
                          View All Notifications
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
