import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CategoryModal = ({ isOpen, onClose, category, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 8,
    difficulty: 'intermediate',
    price: 0,
    pricePerWeek: 5,
    freeDurationWeeks: 2,
    capacity: 100,
    icon: '📚',
    color: '#3B82F6',
    industry: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: '',
        description: '',
        duration: 8,
        difficulty: 'intermediate',
        price: 0,
        pricePerWeek: 5,
        freeDurationWeeks: 2,
        capacity: 100,
        icon: '📚',
        color: '#3B82F6',
        industry: '',
      });
    }
  }, [category, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numFields = ['duration','price','capacity','pricePerWeek','freeDurationWeeks'];
    setFormData((prev) => ({
      ...prev,
      [name]: numFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error('Category name is required');
        setLoading(false);
        return;
      }

      if (category?._id) {
        // Update
        const res = await api.put(`/admin/categories/${category._id}`, formData);
        toast.success(res.data?.message || 'Category updated successfully');
      } else {
        // Create
        const res = await api.post('/admin/categories', formData);
        toast.success(res.data?.message || 'Category created successfully');
      }

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50 p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {category ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Web Development"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="📚"
                    maxLength="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Free weeks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Duration (weeks)</label>
                  <input type="number" name="freeDurationWeeks" value={formData.freeDurationWeeks} onChange={handleChange} min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>

                {/* Price per week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Extra Week ($)</label>
                  <input type="number" name="pricePerWeek" value={formData.pricePerWeek} onChange={handleChange} min="0" step="0.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (students)
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g., Technology"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Category description..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : category ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CategoryModal;
