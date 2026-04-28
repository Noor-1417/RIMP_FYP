import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import AdminAnalyticsCharts from '../../components/admin/AdminAnalyticsCharts';

export const AdminAnalyticsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      const data = res.data || res;
      setAnalytics(data.data || {});
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-2">Overview and reports for platform activity.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full p-6 bg-white rounded-lg shadow">Loading...</div>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Total Students</div>
                    <div className="text-2xl font-bold mt-2">{analytics?.totalStudents ?? 0}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Total Tasks</div>
                    <div className="text-2xl font-bold mt-2">{analytics?.totalTasks ?? 0}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Categories</div>
                    <div className="text-2xl font-bold mt-2">{analytics?.totalCategories ?? 0}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Submissions</div>
                    <div className="text-2xl font-bold mt-2">{analytics?.totalSubmissions ?? 0}</div>
                  </div>
                </>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Submissions by Status</h3>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="space-y-2">
                  {(analytics?.submissionsByStatus || []).map((s) => (
                    <div key={s._id} className="flex justify-between">
                      <div className="capitalize text-gray-700">{s._id || 'unknown'}</div>
                      <div className="font-semibold">{s.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="mt-6">
              <AdminAnalyticsCharts />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
