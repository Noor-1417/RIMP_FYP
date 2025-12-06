import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, ProgressBar, Badge } from '../../components/common/LayoutElements';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { taskService, quizService, certificateService } from '../../services';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-white rounded-lg shadow p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-primary mt-2">{value}</p>
        {trend && <p className="text-green-600 text-xs mt-1">↑ {trend}% from last week</p>}
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </motion.div>
);

export const InternDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    quizzesTaken: 0,
    certificatesEarned: 0,
    progressPercentage: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch tasks
        const tasksResponse = await taskService.getAll({ limit: 5 });
        const tasks = tasksResponse.data.data.filter((t) => t.assignedTo.some((a) => a._id === user._id));
        const completedTasks = tasks.filter((t) => t.status === 'completed').length;

        // Fetch quizzes
        const quizzesResponse = await quizService.getAll({ limit: 10 });
        const quizzes = quizzesResponse.data.data;
        const userAttempts = quizzes.reduce((acc, q) => {
          const attempts = q.attempts.filter((a) => a.intern === user._id);
          return acc + attempts.length;
        }, 0);

        // Fetch certificates
        const certificatesResponse = await certificateService.getAll({ limit: 10 });
        const certificates = certificatesResponse.data.data.length;

        setStats({
          tasksCompleted: completedTasks,
          quizzesTaken: userAttempts,
          certificatesEarned: certificates,
          progressPercentage: 65,
        });

        setRecentTasks(tasks.slice(0, 5));

        // Mock chart data
        setChartData([
          { week: 'Week 1', tasks: 3, quizzes: 1, points: 50 },
          { week: 'Week 2', tasks: 5, quizzes: 2, points: 120 },
          { week: 'Week 3', tasks: 4, quizzes: 1, points: 85 },
          { week: 'Week 4', tasks: 6, quizzes: 3, points: 180 },
          { week: 'Week 5', tasks: 7, quizzes: 2, points: 150 },
          { week: 'Week 6', tasks: 5, quizzes: 4, points: 220 },
          { week: 'Week 7', tasks: 8, quizzes: 3, points: 250 },
          { week: 'Week 8', tasks: 6, quizzes: 2, points: 190 },
        ]);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Here's your internship progress overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon="✓" label="Tasks Completed" value={stats.tasksCompleted} trend="12" />
          <StatCard icon="❓" label="Quizzes Taken" value={stats.quizzesTaken} trend="25" />
          <StatCard icon="🎓" label="Certificates" value={stats.certificatesEarned} trend="0" />
          <StatCard icon="📈" label="Overall Progress" value={`${stats.progressPercentage}%`} />
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <h3 className="text-xl font-bold text-primary mb-6">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#0A3D62"
                  strokeWidth={2}
                  dot={{ fill: '#0A3D62' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#74B9FF"
                  strokeWidth={2}
                  dot={{ fill: '#74B9FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-primary mb-6">Achievement Stats</h3>
            <div className="space-y-4">
              <div>
                <ProgressBar percentage={75} label="Tasks" showLabel={true} />
              </div>
              <div>
                <ProgressBar percentage={60} label="Quizzes" showLabel={true} />
              </div>
              <div>
                <ProgressBar percentage={90} label="Attendance" showLabel={true} />
              </div>
              <div className="pt-4 border-t border-light">
                <Badge variant="success" className="w-full text-center block py-2">
                  On Track to Complete!
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-primary">Recent Tasks</h3>
            <Badge variant="secondary">View All</Badge>
          </div>

          <div className="space-y-4">
            {recentTasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-light rounded-lg hover:bg-gray-200 transition"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-primary">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.category?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={task.priority === 'high' ? 'danger' : 'primary'}>
                    {task.priority}
                  </Badge>
                  <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                    {task.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
