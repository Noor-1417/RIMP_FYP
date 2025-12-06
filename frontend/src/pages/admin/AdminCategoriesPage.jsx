import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import CategoryModal from '../../components/admin/CategoryModal';
import { Button } from '../../components/common/FormElements';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

export const AdminCategoriesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/categories');
      const data = res.data || res;
      setCategories(data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setDeleting(categoryId);
      const res = await api.delete(`/admin/categories/${categoryId}`);
      toast.success(res.data?.message || 'Category deleted successfully');
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCategory(null);
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
                <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                <p className="text-gray-600 mt-2">Manage internship categories and tracks.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                <FiPlus size={20} />
                Add Category
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full p-6 bg-white rounded-lg shadow text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="col-span-full p-6 bg-white rounded-lg shadow text-center">
                  <p className="text-gray-500">No categories found. Create one to get started.</p>
                </div>
              ) : (
                categories.map((c) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg shadow p-6 border hover:shadow-lg transition-shadow"
                    style={{ borderLeftColor: c.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{c.icon}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                          <p className="text-sm text-gray-500">{c.industry || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{c.description || '—'}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y">
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="text-lg font-bold text-gray-900">{c.duration} weeks</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Capacity</div>
                        <div className="text-lg font-bold text-gray-900">{c.capacity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Difficulty</div>
                        <div className="text-lg font-bold text-gray-900 capitalize">{c.difficulty}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="text-lg font-bold text-gray-900">${c.price}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(c)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <FiEdit2 size={16} />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(c._id)}
                        disabled={deleting === c._id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        <FiTrash2 size={16} />
                        {deleting === c._id ? 'Deleting...' : 'Delete'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </main>
      </div>

      <CategoryModal isOpen={modalOpen} onClose={handleModalClose} category={selectedCategory} onSaved={fetchCategories} />
    </div>
  );
};

export default AdminCategoriesPage;
