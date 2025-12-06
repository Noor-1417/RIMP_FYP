import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AnnouncementModal = ({ isOpen, onClose, announcement, categories = [], onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target: 'all',
    targetCategories: [],
    targetStudents: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        body: announcement.body || '',
        target: announcement.target || 'all',
        targetCategories: announcement.targetCategories || [],
        targetStudents: announcement.targetStudents || [],
      });
    } else {
      setFormData({
        title: '',
        body: '',
        target: 'all',
        targetCategories: [],
        targetStudents: [],
      });
    }
  }, [announcement, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const cats = prev.targetCategories.includes(categoryId)
        ? prev.targetCategories.filter(id => id !== categoryId)
        : [...prev.targetCategories, categoryId];
      return { ...prev, targetCategories: cats };
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.body.trim()) {
      toast.error('Body/Message is required');
      return false;
    }
    if (formData.target === 'category' && formData.targetCategories.length === 0) {
      toast.error('Select at least one category');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (announcement?._id) {
        await api.put(`/admin/announcements/${announcement._id}`, formData);
        toast.success('Announcement updated successfully');
      } else {
        await api.post('/admin/announcements', formData);
        toast.success('Announcement created successfully');
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 rounded-lg max-w-2xl w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">
                {announcement ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 max-h-96 overflow-y-auto space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., System Maintenance"
                  maxLength={200}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows="5"
                  placeholder="Enter announcement message"
                />
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Audience
                </label>
                <select
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Students</option>
                  <option value="category">Specific Categories</option>
                  <option value="students">Specific Students</option>
                </select>
              </div>

              {/* Category Selection */}
              {formData.target === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Categories
                  </label>
                  <div className="space-y-2 bg-gray-800/50 p-3 rounded-lg">
                    {categories.length === 0 ? (
                      <p className="text-gray-400 text-sm">No categories available</p>
                    ) : (
                      categories.map(cat => (
                        <label key={cat._id} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.targetCategories.includes(cat._id)}
                            onChange={() => handleCategoryToggle(cat._id)}
                            className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-300">{cat.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  {loading ? 'Saving...' : 'Save Announcement'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementModal;
