import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import TaskModal from '../../components/admin/TaskModal';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';

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
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                <p className="text-gray-600 mt-2">Create and manage internship tasks.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                <FiPlus size={20} />
                Add Task
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No tasks found. Create one to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 bg-gray-50 border-b">
                        <th className="px-6 py-4 font-bold">Title</th>
                        <th className="px-6 py-4 font-bold">Category</th>
                        <th className="px-6 py-4 font-bold">Priority</th>
                        <th className="px-6 py-4 font-bold">Week</th>
                        <th className="px-6 py-4 font-bold">Points</th>
                        <th className="px-6 py-4 font-bold">Due Date</th>
                        <th className="px-6 py-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t) => (
                        <motion.tr
                          key={t._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{t.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{t.description?.slice(0, 50)}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">{t.category?.name || '-'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                t.priority === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : t.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : t.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">Week {t.week}</td>
                          <td className="px-6 py-4 text-sm font-medium">{t.points}pts</td>
                          <td className="px-6 py-4 text-sm">
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(t)}
                                className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(t._id)}
                                disabled={deleting === t._id}
                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <FiTrash2 size={18} />
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

      <TaskModal isOpen={modalOpen} onClose={handleModalClose} task={selectedTask} onSaved={fetchTasks} categories={categories} />
    </div>
  );
};

export default AdminTasksPage;
