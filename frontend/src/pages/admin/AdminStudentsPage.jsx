import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiLock, FiUnlock } from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import StudentModal from '../../components/admin/StudentModal';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminStudentsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchCategories();
  }, [searchTerm, categoryFilter, statusFilter, page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students', {
        params: {
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          limit: 20,
        },
      });

      const data = res.data;
      setStudents(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch students');
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

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;

    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSuspend = async (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const statusBadgeColor = (isActive) => {
    return isActive ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300';
  };

  const statusBadgeText = (isActive) => {
    return isActive ? 'Active' : 'Suspended';
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (statusFilter === 'active' && !student.isActive) return false;
      if (statusFilter === 'suspended' && student.isActive) return false;
      if (categoryFilter && !student.enrollments.find(e => e.category._id === categoryFilter)) return false;
      return true;
    });
  }, [students, statusFilter, categoryFilter]);

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
                Student Management
              </h1>
              <p className="text-gray-400">
                Total: {pagination.total || 0} students
              </p>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('all');
                  setPage(1);
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 px-4 rounded-lg transition"
              >
                Reset Filters
              </button>
            </motion.div>

            {/* Students Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
            >
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  {students.length === 0 ? 'No students found' : 'No students matching filters'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Student Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Enrollment Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Enrollments
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-900/50 transition"
                        >
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {student.firstName} {student.lastName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(student.enrollmentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs font-medium">
                              {student.totalEnrollments} ({student.activeEnrollments} active)
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(student.isActive)}`}>
                              {statusBadgeText(student.isActive)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="p-2 hover:bg-blue-900/30 rounded-lg transition text-blue-400 hover:text-blue-300"
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleSuspend(student)}
                                className={`p-2 hover:bg-yellow-900/30 rounded-lg transition ${
                                  student.isActive
                                    ? 'text-yellow-400 hover:text-yellow-300'
                                    : 'text-green-400 hover:text-green-300'
                                }`}
                                title={student.isActive ? 'Suspend' : 'Reactivate'}
                              >
                                {student.isActive ? (
                                  <FiLock size={18} />
                                ) : (
                                  <FiUnlock size={18} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(student._id)}
                                disabled={deleting[student._id]}
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

      <StudentModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        student={selectedStudent}
        categories={categories}
        onSave={fetchStudents}
      />
    </div>
  );
};

export default AdminStudentsPage;
