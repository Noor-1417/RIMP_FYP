import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminAnalyticsCharts = () => {
  const [subsOverTime, setSubsOverTime] = useState([]);
  const [taskCompletion, setTaskCompletion] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [a, b, c] = await Promise.all([
        api.get('/admin/analytics/submissions-over-time', { params: { days: 30 } }),
        api.get('/admin/analytics/task-completion', { params: { groupBy: 'category' } }),
        api.get('/admin/analytics/category-performance'),
      ]);

      setSubsOverTime(a.data.data || []);
      setTaskCompletion(b.data.data || []);
      setCategoryPerformance(c.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading analytics...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Submissions (last 30 days)</h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <AreaChart data={subsOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#60a5fa" fillOpacity={1} fill="url(#colorSub)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Task Completion Rate by Category</h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={taskCompletion} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="categoryName" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionRate" fill="#f59e0b" name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 lg:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-2">Category Performance</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={categoryPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksCount" fill="#60a5fa" name="Tasks" />
              <Bar dataKey="studentsCount" fill="#34d399" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsCharts;
