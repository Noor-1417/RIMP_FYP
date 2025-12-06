import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import SubmissionsTable from '../../components/admin/SubmissionsTable';
import GradingModal from '../../components/admin/GradingModal';
import { Button } from '../../components/common/FormElements';
import api from '../../services/api';

export const AdminSubmissionsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingOpen, setGradingOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [status, page]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/submissions', {
        params: { status, page, limit: 20 },
      });
      const data = res.data || res;
      setSubmissions(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'grading', label: 'Grading' },
    { value: 'graded-passed', label: 'Passed' },
    { value: 'graded-failed', label: 'Failed' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
              <p className="text-gray-600 mt-2">Review task submissions and AI grading results.</p>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Status</label>
              <div className="flex gap-2 flex-wrap">
                {statuses.map((s) => (
                  <Button
                    key={s.value}
                    onClick={() => {
                      setStatus(s.value);
                      setPage(1);
                    }}
                    variant={status === s.value ? 'primary' : 'outline'}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Submissions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-6"
            >
              <SubmissionsTable submissions={submissions} loading={loading} onGrade={(sub) => { setSelectedSubmission(sub); setGradingOpen(true); }} />
            </motion.div>

            <GradingModal
              isOpen={gradingOpen}
              onClose={() => { setGradingOpen(false); setSelectedSubmission(null); }}
              submission={selectedSubmission}
              onGraded={() => fetchSubmissions()}
            />

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-2"
              >
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    variant={page === pageNum ? 'primary' : 'outline'}
                  >
                    {pageNum}
                  </Button>
                ))}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSubmissionsPage;
