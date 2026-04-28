import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import TaskModal from '../../components/admin/TaskModal';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const PRIORITY_COLORS = {
  critical: 'bg-red-900/40 text-red-300 border-red-700/40',
  high:     'bg-orange-900/40 text-orange-300 border-orange-700/40',
  medium:   'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  low:      'bg-green-900/40 text-green-300 border-green-700/40',
};

export const AdminTasksPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tasks', { params: { limit: 100 } });
      const data = res.data || res;
      setTasks(data.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories?limit=100');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setDeleting(taskId);
      const res = await api.delete(`/admin/tasks/${taskId}`);
      toast.success(res.data?.message || 'Task deleted successfully');
      await fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = () => {
    setSelectedTask(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Tasks
                </h1>
                <p className="text-gray-400">Create and manage internship tasks.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                <FiPlus size={20} />
                Add Task
              </motion.button>
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 border border-gray-700/60 rounded-xl overflow-hidden"
            >
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent mb-3" />
                  <p className="text-gray-400">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-400">No tasks found. Create one to get started.</p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    + Create Task
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-900/60 border-b border-gray-700/60">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Week</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/40">
                      {tasks.map((t, idx) => (
                        <motion.tr
                          key={t._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-gray-700/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-cyan-300">{t.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {t.description?.slice(0, 60)}…
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">
                            {t.category?.name || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm font-medium">
                            Week {t.week}
                          </td>
                          <td className="px-6 py-4 text-cyan-400 text-sm font-bold">
                            {t.points}pts
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(t)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={17} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(t._id)}
                                disabled={deleting === t._id}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <FiTrash2 size={17} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        task={selectedTask}
        onSaved={fetchTasks}
        categories={categories}
      />
    </div>
  );
};

export default AdminTasksPage;
