import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiLock, FiUnlock, FiEye } from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import StudentModal from '../../components/admin/StudentModal';
import AdminStudentReportModal from '../../components/admin/AdminStudentReportModal';
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

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStudent, setReportStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
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
  }, [searchTerm, categoryFilter, statusFilter, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/admin/categories', { params: { limit: 100 } });
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchCategories();
  }, [fetchStudents, fetchCategories]);

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleViewReport = (student) => {
    setReportStudent(student);
    setReportOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSuspend = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (statusFilter === 'active' && !student.isActive) return false;
      if (statusFilter === 'suspended' && student.isActive) return false;
      if (
        categoryFilter &&
        !student.enrollments?.find((e) => e.category?._id === categoryFilter)
      )
        return false;
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
                Total: {pagination.total || 0} students enrolled
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
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-cyan-300 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />

              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter('all'); setPage(1); }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 px-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                Reset Filters
              </button>
            </motion.div>

            {/* Students Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 border border-gray-700/60 rounded-xl overflow-hidden"
            >
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-3" />
                  <p className="text-gray-400">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  {students.length === 0 ? 'No students found' : 'No students matching filters'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/60 border-b border-gray-700/60">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Enrollments
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/40">
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-gray-700/20 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {student.firstName?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="text-cyan-300 font-medium">
                                {student.firstName} {student.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-cyan-300 text-sm">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 text-gray-200 text-sm">
                            {student.enrollmentDate
                              ? new Date(student.enrollmentDate).toLocaleDateString()
                              : student.createdAt
                              ? new Date(student.createdAt).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-6 py-4">
                            {student.enrollments?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {student.enrollments.slice(0, 2).map((en) => (
                                  <span key={en._id}
                                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                                      en.status === 'active'
                                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40'
                                        : en.status === 'completed'
                                        ? 'bg-blue-900/40 text-blue-300 border-blue-700/40'
                                        : 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40'
                                    }`}>
                                    {en.category?.name || 'Unknown'}
                                  </span>
                                ))}
                                {student.enrollments.length > 2 && (
                                  <span className="text-xs text-gray-500">+{student.enrollments.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-xs italic">Not enrolled</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                student.isActive
                                  ? 'bg-emerald-900/30 text-emerald-300'
                                  : 'bg-red-900/30 text-red-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {student.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              {/* View Full Report */}
                              <button
                                onClick={() => handleViewReport(student)}
                                className="p-2 hover:bg-cyan-900/30 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300"
                                title="View Full Report"
                              >
                                <FiEye size={17} />
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => handleEdit(student)}
                                className="p-2 hover:bg-blue-900/30 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                                title="Edit"
                              >
                                <FiEdit2 size={17} />
                              </button>
                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => handleSuspend(student)}
                                className={`p-2 hover:bg-yellow-900/30 rounded-lg transition-colors ${
                                  student.isActive
                                    ? 'text-yellow-400 hover:text-yellow-300'
                                    : 'text-green-400 hover:text-green-300'
                                }`}
                                title={student.isActive ? 'Suspend' : 'Reactivate'}
                              >
                                {student.isActive ? <FiLock size={17} /> : <FiUnlock size={17} />}
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(student._id)}
                                disabled={deleting[student._id]}
                                className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-red-400 hover:text-red-300 disabled:opacity-50"
                                title="Delete"
                              >
                                <FiTrash2 size={17} />
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
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-colors text-sm"
                >
                  ← Previous
                </button>
                <span className="text-gray-400 text-sm px-2">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-colors text-sm"
                >
                  Next →
                </button>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Student Edit Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        student={selectedStudent}
        categories={categories}
        onSave={fetchStudents}
      />

      {/* Student Full Report Modal */}
      <AdminStudentReportModal
        isOpen={reportOpen}
        onClose={() => { setReportOpen(false); setReportStudent(null); }}
        studentId={reportStudent?._id}
        studentName={reportStudent ? `${reportStudent.firstName} ${reportStudent.lastName}` : ''}
      />
    </div>
  );
};

export default AdminStudentsPage;
