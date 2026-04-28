import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiDownload, FiCheck, FiTrash2, FiSend } from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminNotificationsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', target: 'all' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!newNotification.title || !newNotification.message) {
      toast.error('Title and message are required');
      return;
    }
    try {
      await api.post('/notifications/admin-send', newNotification);
      toast.success('Notification sent successfully');
      setShowSendModal(false);
      setNewNotification({ title: '', message: '', target: 'all' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    }
  };

  const handleExport = async (type) => {
    setExportLoading(prev => ({ ...prev, [type]: true }));
    try {
      let url = '';
      if (type === 'users') url = '/admin/exports/users';
      if (type === 'submissions') url = '/admin/exports/submissions';
      if (type === 'tasks') url = '/admin/exports/tasks';

      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url_link = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_link;
      a.download = `export_${type}_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url_link);
      toast.success(`${type} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    } finally {
      setExportLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-cyan-300 flex items-center gap-3">
                  <FiBell className="text-blue-400" /> Notifications & Exports
                </h1>
                <p className="text-gray-400 mt-2">Manage system notifications and export data.</p>
              </div>
              <button 
                onClick={() => setShowSendModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <FiSend /> Send Update
              </button>
            </motion.div>

            {/* Exports Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => handleExport('users')} disabled={exportLoading.users} className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 hover:border-blue-500 text-white font-medium py-3 px-4 rounded-lg transition">
                <FiDownload size={18} /> {exportLoading.users ? 'Exporting...' : 'Export Users'}
              </button>
              <button onClick={() => handleExport('submissions')} disabled={exportLoading.submissions} className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 hover:border-blue-500 text-white font-medium py-3 px-4 rounded-lg transition">
                <FiDownload size={18} /> {exportLoading.submissions ? 'Exporting...' : 'Export Submissions'}
              </button>
              <button onClick={() => handleExport('tasks')} disabled={exportLoading.tasks} className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 hover:border-blue-500 text-white font-medium py-3 px-4 rounded-lg transition">
                <FiDownload size={18} /> {exportLoading.tasks ? 'Exporting...' : 'Export Tasks'}
              </button>
            </motion.div>

            {/* Notifications List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
                <h2 className="font-semibold text-cyan-300">Your Notifications</h2>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={markAllAsRead} className="text-sm text-blue-400 hover:text-blue-300">Mark all as read</button>
                )}
              </div>
              
              <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No notifications found.</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif._id} className={`p-4 flex gap-4 hover:bg-gray-700/30 transition ${!notif.isRead ? 'bg-blue-900/10' : ''}`}>
                      <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-sm ${!notif.isRead ? 'text-cyan-300 font-semibold' : 'text-gray-300 font-medium'}`}>{notif.title}</h3>
                          <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                        {!notif.isRead && (
                          <button onClick={() => markAsRead(notif._id)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700" title="Mark as read">
                            <FiCheck size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notif._id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700" title="Delete">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-cyan-300 mb-4">Send System Update</h2>
            <p className="text-gray-400 text-sm mb-6">Broadcast a notification to all active students.</p>
            
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input 
                  type="text" required
                  value={newNotification.title}
                  onChange={e => setNewNotification({...newNotification, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. System Maintenance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea 
                  required rows="4"
                  value={newNotification.message}
                  onChange={e => setNewNotification({...newNotification, message: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowSendModal(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700 font-medium transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2">
                  <FiSend size={16} /> Send Now
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
