import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiDownload } from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AnnouncementModal from '../../components/admin/AnnouncementModal';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminAnnouncementsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [deleting, setDeleting] = useState({});
  const [exportLoading, setExportLoading] = useState({});

  useEffect(() => {
    fetchAnnouncements();
    fetchCategories();
  }, [searchTerm, page, fetchAnnouncements, fetchCategories]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/announcements', {
        params: { search: searchTerm, page, limit: 20 },
      });

      const data = res.data;
      setAnnouncements(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories', { params: { limit: 100 } });
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;

    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await api.delete(`/admin/announcements/${id}`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExport = async (type) => {
    setExportLoading(prev => ({ ...prev, [type]: true }));
    try {
      let url = '';
      if (type === 'users') url = '/admin/exports/users';
      if (type === 'submissions') url = '/admin/exports/submissions';
      if (type === 'tasks') url = '/admin/exports/tasks';

      const res = await api.get(url);
      const data = res.data;

      // Create blob and download
      const blob = new Blob([data.data], { type: 'text/csv' });
      const url_link = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_link;
      a.download = data.filename || `export_${type}.csv`;
      a.click();
      window.URL.revokeObjectURL(url_link);

      toast.success(`${type} exported successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to export ${type}`);
    } finally {
      setExportLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const targetBadgeColor = (target) => {
    const colors = {
      all: 'bg-blue-900/30 text-blue-300',
      category: 'bg-purple-900/30 text-purple-300',
      students: 'bg-pink-900/30 text-pink-300',
    };
    return colors[target] || colors.all;
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Announcements & Exports
              </h1>
              <p className="text-gray-400">
                Send announcements to students and export data
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <button
                onClick={handleCreate}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <FiPlus size={20} />
                New Announcement
              </button>

              <button
                onClick={() => handleExport('users')}
                disabled={exportLoading.users}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <FiDownload size={20} />
                {exportLoading.users ? 'Exporting...' : 'Export Users'}
              </button>

              <button
                onClick={() => handleExport('submissions')}
                disabled={exportLoading.submissions}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <FiDownload size={20} />
                {exportLoading.submissions ? 'Exporting...' : 'Export Submissions'}
              </button>

              <button
                onClick={() => handleExport('tasks')}
                disabled={exportLoading.tasks}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <FiDownload size={20} />
                {exportLoading.tasks ? 'Exporting...' : 'Export Tasks'}
              </button>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </motion.div>

            {/* Announcements Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
            >
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No announcements yet. Create your first one!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Target
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Created
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {announcements.map((ann, index) => (
                        <motion.tr
                          key={ann._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-900/50 transition"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{ann.title}</p>
                              <p className="text-gray-400 text-sm truncate">
                                {ann.body.substring(0, 60)}...
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${targetBadgeColor(ann.target)}`}>
                              {ann.target === 'all' && 'All Students'}
                              {ann.target === 'category' && `${ann.targetCategories?.length || 0} Categories`}
                              {ann.target === 'students' && `${ann.targetStudents?.length || 0} Students`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(ann)}
                                className="p-2 hover:bg-blue-900/30 rounded-lg transition text-blue-400 hover:text-blue-300"
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(ann._id)}
                                disabled={deleting[ann._id]}
                                className="p-2 hover:bg-red-900/30 rounded-lg transition text-red-400 hover:text-red-300 disabled:opacity-50"
                                title="Delete"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex items-center justify-center gap-2"
              >
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition"
                >
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, pagination.pages))}
                  disabled={page === pagination.pages}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition"
                >
                  Next
                </button>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      <AnnouncementModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        announcement={selectedAnnouncement}
        categories={categories}
        onSave={fetchAnnouncements}
      />
    </div>
  );
};

export default AdminAnnouncementsPage;
