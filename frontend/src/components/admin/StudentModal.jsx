import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const StudentModal = ({ isOpen, onClose, student, categories = [], onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    categoryId: '',
    status: 'active',
  });

  const [suspensionData, setSuspensionData] = useState({
    reason: '',
    until: '',
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        categoryId: student.enrollments?.[0]?.category?._id || '',
        status: student.isActive ? 'active' : 'suspended',
      });
      if (!student.isActive) {
        setSuspensionData({
          reason: student.suspensionReason || '',
          until: student.suspendedUntil ? student.suspendedUntil.split('T')[0] : '',
        });
      }
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        categoryId: '',
        status: 'active',
      });
      setSuspensionData({ reason: '', until: '' });
    }
    setActiveTab('basic');
  }, [student, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSuspensionChange = (e) => {
    const { name, value } = e.target;
    setSuspensionData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Valid email is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (student?._id) {
        await api.put(`/admin/students/${student._id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        });

        if (formData.categoryId) {
          await api.post(`/admin/students/${student._id}/change-category`, {
            categoryId: formData.categoryId,
          });
        }

        toast.success('Student updated successfully');
      } else {
        toast.info('Create student via registration page');
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!student?._id) return;

    setLoading(true);
    try {
      await api.post(`/admin/students/${student._id}/suspend`, {
        reason: suspensionData.reason,
        until: suspensionData.until,
      });

      toast.success('Student suspended successfully');
      if (onSave) onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to suspend student');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!student?._id) return;

    setLoading(true);
    try {
      await api.post(`/admin/students/${student._id}/reactivate`);
      toast.success('Student reactivated successfully');
      if (onSave) onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reactivate student');
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
                {student ? 'Edit Student' : 'New Student'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 px-4 font-medium transition ${
                  activeTab === 'basic'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Basic Info
              </button>
              {student && (
                <>
                  <button
                    onClick={() => setActiveTab('category')}
                    className={`flex-1 py-3 px-4 font-medium transition ${
                      activeTab === 'category'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    onClick={() => setActiveTab('suspension')}
                    className={`flex-1 py-3 px-4 font-medium transition ${
                      activeTab === 'suspension'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Status
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        placeholder="Enter email"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Category Tab */}
              {activeTab === 'category' && student && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      Current Enrollments: {student.totalEnrollments}
                    </p>
                    <p className="text-sm text-blue-300">
                      Active: {student.activeEnrollments}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (formData.categoryId) {
                          handleInputChange({ target: { name: 'categoryId', value: formData.categoryId } });
                          handleSubmit({ preventDefault: () => {} });
                        }
                      }}
                      disabled={!formData.categoryId || loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      {loading ? 'Changing...' : 'Change Category'}
                    </button>
                  </div>
                </div>
              )}

              {/* Suspension Tab */}
              {activeTab === 'suspension' && student && (
                <div className="space-y-4">
                  {!student.isActive ? (
                    <>
                      <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                        <p className="text-sm text-yellow-300 font-medium">Status: Suspended</p>
                        {student.suspensionReason && (
                          <p className="text-sm text-yellow-300 mt-2">
                            Reason: {student.suspensionReason}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handleReactivate}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        {loading ? 'Reactivating...' : 'Reactivate Student'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Suspension Reason (optional)
                        </label>
                        <textarea
                          name="reason"
                          value={suspensionData.reason}
                          onChange={handleSuspensionChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                          rows="3"
                          placeholder="Enter reason for suspension"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Suspend Until (optional)
                        </label>
                        <input
                          type="date"
                          name="until"
                          value={suspensionData.until}
                          onChange={handleSuspensionChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={handleSuspend}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        {loading ? 'Suspending...' : 'Suspend Student'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudentModal;
