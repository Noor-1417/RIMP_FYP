import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { FiPlus, FiTrendingUp, FiUsers, FiCheckCircle, FiClock, FiArrowUpRight, FiDownload, FiBell, FiBook, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import StudentsTable from '../../components/admin/StudentsTable';
import SubmissionsTable from '../../components/admin/SubmissionsTable';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ==========================================
// Constants & Mock Data
// ==========================================

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  },
};

const STAT_CARD_CONFIG = [
  {
    key: 'totalStudents',
    title: 'Total Students',
    icon: FiUsers,
    bgGradient: 'from-blue-900/40 to-blue-800/20',
    borderColor: 'border-blue-700/50 hover:border-blue-600/80',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    trend: '+12%',
    trendDir: 'up',
  },
  {
    key: 'activeEnrollments',
    title: 'Active Today',
    icon: FiCheckCircle,
    bgGradient: 'from-green-900/40 to-green-800/20',
    borderColor: 'border-green-700/50 hover:border-green-600/80',
    badgeColor: 'bg-green-500/20 text-green-400',
    trend: '+8%',
    trendDir: 'up',
  },
  {
    key: 'totalCategories',
    title: 'Categories',
    icon: FiBook,
    bgGradient: 'from-amber-900/40 to-amber-800/20',
    borderColor: 'border-amber-700/50 hover:border-amber-600/80',
    badgeColor: 'bg-amber-500/20 text-amber-400',
    trend: '4 active',
    trendDir: 'neutral',
  },
  {
    key: 'pendingSubmissions',
    title: 'Pending',
    icon: FiClock,
    bgGradient: 'from-red-900/40 to-red-800/20',
    borderColor: 'border-red-700/50 hover:border-red-600/80',
    badgeColor: 'bg-red-500/20 text-red-400',
    trend: 'Need review',
    trendDir: 'neutral',
  },
];

const CATEGORIES = [
  { id: 1, name: 'Web Development', icon: '🌐', students: 450, tasks: 12, completion: 54, newEnrollments: 45 },
  { id: 2, name: 'Mobile Development', icon: '📱', students: 380, tasks: 15, completion: 52, newEnrollments: 38 },
  { id: 3, name: 'Data Science', icon: '📊', students: 320, tasks: 10, completion: 49, newEnrollments: 32 },
  { id: 4, name: 'UI/UX Design', icon: '🎨', students: 280, tasks: 14, completion: 47, newEnrollments: 28 },
  { id: 5, name: 'AI/Machine Learning', icon: '🤖', students: 210, tasks: 8, completion: 47, newEnrollments: 22 },
  { id: 6, name: 'Marketing', icon: '📈', students: 150, tasks: 9, completion: 61, newEnrollments: 15 },
];

// ==========================================
// Component: StatCard
// ==========================================

const StatCard = ({ config, value, isLoading }) => {
  const Icon = config.icon;
  const trendColor = config.trendDir === 'up' ? 'text-green-400' : 'text-gray-400';

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.item}
      className={`bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-xl p-6 transition-all duration-300 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{config.title}</p>
          <h3 className="text-4xl font-bold text-white">
            {isLoading ? '...' : value || 0}
          </h3>
          <p className={`text-xs mt-3 flex items-center gap-1 ${trendColor}`}>
            {config.trendDir === 'up' && <FiArrowUpRight size={14} />}
            {config.trend}
          </p>
        </div>
        <div className={`w-14 h-14 ${config.badgeColor} rounded-lg flex items-center justify-center`}>
          <Icon size={28} />
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// Component: QuickActionButton
// ==========================================

const QuickActionButton = ({ icon: Icon, label, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-lg bg-${color}-500/20 hover:bg-${color}-500/30 border border-${color}-500/50 transition-all text-white hover:text-${color}-300`}
  >
    {typeof Icon === 'string' ? (
      <div className="text-4xl">{Icon}</div>
    ) : (
      <Icon size={24} />
    )}
    <span className="text-xs text-center font-semibold">{label}</span>
  </motion.button>
);

// ==========================================
// Component: CategoryCard
// ==========================================

const CategoryCard = ({ category, onManage }) => (
  <motion.div
    variants={ANIMATION_VARIANTS.item}
    onClick={() => onManage(category)}
    className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="text-4xl">{category.icon}</div>
      <span className="text-2xl font-bold text-blue-400">{category.completion}%</span>
    </div>
    <h3 className="text-lg font-bold text-white mb-4 group-hover:text-blue-300 transition-colors line-clamp-2">
      {category.name}
    </h3>
    <div className="space-y-3 mb-4">
      <StatRow label="Students" value={category.students} />
      <StatRow label="Tasks" value={category.tasks} />
      <StatRow label="New Enrollments" value={`+${category.newEnrollments}`} highlight />
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${category.completion}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
      />
    </div>
    <motion.button
      whileHover={{ scale: 1.02 }}
      className="mt-4 w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold text-sm transition-colors border border-blue-500/50"
    >
      Manage
    </motion.button>
  </motion.div>
);

const StatRow = ({ label, value, highlight }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-400">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-green-400' : 'text-white'}`}>
      {value}
    </span>
  </div>
);

// ==========================================
// Main Component: AdminDashboardPage
// ==========================================

export const AdminDashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data (will be replaced with API calls)
  const mockCompletionData = [
    { week: 'Week 1', completion: 45, target: 70 },
    { week: 'Week 2', completion: 58, target: 70 },
    { week: 'Week 3', completion: 62, target: 70 },
    { week: 'Week 4', completion: 71, target: 70 },
    { week: 'Week 5', completion: 68, target: 70 },
    { week: 'Week 6', completion: 75, target: 70 },
    { week: 'Week 7', completion: 80, target: 70 },
    { week: 'Week 8', completion: 85, target: 70 },
  ];

  const mockDailyActiveData = [
    { day: 'Mon', active: 120, completed: 85 },
    { day: 'Tue', active: 145, completed: 110 },
    { day: 'Wed', active: 132, completed: 95 },
    { day: 'Thu', active: 158, completed: 125 },
    { day: 'Fri', active: 165, completed: 140 },
    { day: 'Sat', active: 98, completed: 65 },
    { day: 'Sun', active: 85, completed: 55 },
  ];

  const mockCategoryCompletionData = [
    { category: 'Web Dev', completed: 245, total: 450 },
    { category: 'Mobile Dev', completed: 198, total: 380 },
    { category: 'Data Science', completed: 156, total: 320 },
    { category: 'UI/UX', completed: 132, total: 280 },
    { category: 'AI/ML', completed: 98, total: 210 },
  ];

  const mockSubmissionTrendData = [
    { date: 'Mon', submissions: 45, approved: 32 },
    { date: 'Tue', submissions: 62, approved: 48 },
    { date: 'Wed', submissions: 51, approved: 39 },
    { date: 'Thu', submissions: 78, approved: 61 },
    { date: 'Fri', submissions: 89, approved: 72 },
    { date: 'Sat', submissions: 34, approved: 25 },
    { date: 'Sun', submissions: 28, approved: 20 },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingStats(true);
      const statsRes = await api.get('/admin/stats');
      const statsData = statsRes.data?.data || statsRes.data;
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      toast.error('Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }

    try {
      setLoadingStudents(true);
      const studentsRes = await api.get('/admin/students?limit=5');
      const studentsData = studentsRes.data?.data || studentsRes.data;
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }

    try {
      setLoadingSubmissions(true);
      const submissionsRes = await api.get('/admin/submissions?limit=5');
      const submissionsData = submissionsRes.data?.data || submissionsRes.data;
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Compute filtered views for dashboard tables
  const filteredStudents = React.useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const email = (s.email || '').toLowerCase();
      const category = (s.enrollments?.[0]?.category?.name || '').toLowerCase();
      return name.includes(q) || email.includes(q) || category.includes(q);
    });
  }, [students, searchQuery]);

  const filteredSubmissions = React.useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((sub) => {
      const taskTitle = (sub.task?.title || '').toLowerCase();
      const studentName = `${sub.student?.firstName || ''} ${sub.student?.lastName || ''}`.toLowerCase();
      const category = (sub.category?.name || '').toLowerCase();
      const status = (sub.status || '').toLowerCase();
      return taskTitle.includes(q) || studentName.includes(q) || category.includes(q) || status.includes(q);
    });
  }, [submissions, searchQuery]);

  // Action Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard updated');
  };

  const handleAddCategory = () => toast.success('Opening Add Category modal...');
  const handleAddTask = () => toast.success('Opening Add Task modal...');
  const handleAddQuiz = () => toast.success('Opening Add Quiz modal...');
  const handleAddDripSchedule = () => toast.success('Opening Drip Schedule modal...');
  const handleExportData = () => {
    toast.success('Exporting data as CSV...');
    // TODO: Implement CSV export
  };
  const handleSendAnnouncement = () => toast.success('Opening Announcement modal...');
  const handleManageCategory = (category) => toast.success(`Managing ${category.name}`);

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onSearch={setSearchQuery} />

        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <PageHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

            {/* Stats Cards */}
            <motion.div
              variants={ANIMATION_VARIANTS.container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {STAT_CARD_CONFIG.map((config) => (
                <StatCard
                  key={config.key}
                  config={config}
                  value={stats?.[config.key]}
                  isLoading={loadingStats}
                />
              ))}
            </motion.div>

            {/* Quick Actions Panel */}
            <QuickActionsPanel
              onAddCategory={handleAddCategory}
              onAddTask={handleAddTask}
              onAddQuiz={handleAddQuiz}
              onAddDripSchedule={handleAddDripSchedule}
              onExportData={handleExportData}
              onSendAnnouncement={handleSendAnnouncement}
            />

            {/* Charts Section */}
            <ChartsSection
              completionData={mockCompletionData}
              dailyActiveData={mockDailyActiveData}
              categoryCompletionData={mockCategoryCompletionData}
              submissionTrendData={mockSubmissionTrendData}
            />

            {/* Categories Grid */}
            <CategoriesSection categories={CATEGORIES} onManage={handleManageCategory} />

            {/* Data Tables */}
            <TablesSection
              students={filteredStudents}
              submissions={filteredSubmissions}
              loadingStudents={loadingStudents}
              loadingSubmissions={loadingSubmissions}
              onRefresh={fetchDashboardData}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

// ==========================================
// Sub-Components
// ==========================================

const PageHeader = ({ onRefresh, isRefreshing }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Real-time analytics and platform insights</p>
      </div>
      <motion.button
        whileHover={{ rotate: isRefreshing ? 0 : 10 }}
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-blue-300 font-semibold transition-all disabled:opacity-50"
      >
        <FiRefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        Refresh
      </motion.button>
    </div>
  </motion.div>
);

const QuickActionsPanel = ({
  onAddCategory,
  onAddTask,
  onAddQuiz,
  onAddDripSchedule,
  onExportData,
  onSendAnnouncement,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 md:p-8 border border-blue-700/30 backdrop-blur-sm"
  >
    <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <QuickActionButton icon={FiPlus} label="Add Category" color="blue" onClick={onAddCategory} />
      <QuickActionButton icon={FiBook} label="Add Task" color="green" onClick={onAddTask} />
      <QuickActionButton icon="✓" label="Add Quiz" color="amber" onClick={onAddQuiz} />
      <QuickActionButton icon="⏱️" label="Drip Schedule" color="cyan" onClick={onAddDripSchedule} />
      <QuickActionButton icon={FiDownload} label="Export Data" color="indigo" onClick={onExportData} />
      <QuickActionButton icon={FiBell} label="Announcement" color="red" onClick={onSendAnnouncement} />
    </div>
  </motion.div>
);

const ChartsSection = ({
  completionData,
  dailyActiveData,
  categoryCompletionData,
  submissionTrendData,
}) => (
  <div className="space-y-8">
    {/* Row 1: Weekly Completion & Category Distribution */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartCard title="Weekly Completion" subtitle="Internship progress tracking">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={completionData}>
            <defs>
              <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="week" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9CA3AF', paddingTop: '20px' }} />
            <Area
              type="monotone"
              dataKey="completion"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorComp)"
              dot={{ fill: '#3B82F6', r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Daily Activity" subtitle="Active students this week">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyActiveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9CA3AF', paddingTop: '20px' }} />
            <Bar dataKey="active" fill="#3B82F6" name="Active" radius={[6, 6, 0, 0]} />
            <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>

    {/* Row 2: Category Completion & Submission Trend */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartCard title="Completion by Category" subtitle="Progress across all tracks">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryCompletionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="category" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="completed" fill="#3B82F6" name="Completed" radius={[6, 6, 0, 0]} />
            <Bar dataKey="total" fill="#6B7280" name="Total" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Submission Trend" subtitle="Task submissions & approvals">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={submissionTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9CA3AF', paddingTop: '20px' }} />
            <Line type="monotone" dataKey="submissions" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} name="Submissions" />
            <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Approved" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300"
  >
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-gray-300">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
    {children}
  </motion.div>
);

const CategoriesSection = ({ categories, onManage }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
    <div className="flex items-center justify-between mb-6">
      <div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-gray-300">Category Overview</h2>
        <p className="text-gray-400 text-sm mt-1">Manage internship tracks and monitor progress</p>
      </div>
    </div>
    <motion.div
      variants={ANIMATION_VARIANTS.container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} onManage={onManage} />
      ))}
    </motion.div>
  </motion.div>
);

const TablesSection = ({ students, submissions, loadingStudents, loadingSubmissions, onRefresh }) => (
  <div className="grid grid-cols-1 gap-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-800/50 rounded-xl shadow-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm"
    >
      <div className="p-6 md:p-8 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div>
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white/95 to-gray-300">Recent Students</h2>
          <p className="text-sm text-gray-400 mt-1">Latest enrolled interns and progress</p>
        </div>
        <a
          href="/admin/students"
          className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-500/10"
        >
          View All <FiArrowUpRight size={16} />
        </a>
      </div>
      <div className="p-6 md:p-8">
        <StudentsTable students={students} loading={loadingStudents} onRefresh={onRefresh} />
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-800/50 rounded-xl shadow-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm"
    >
      <div className="p-6 md:p-8 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div>
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white/95 to-gray-300">Recent Submissions</h2>
          <p className="text-sm text-gray-400 mt-1">Latest task submissions and AI scores</p>
        </div>
        <a
          href="/admin/submissions"
          className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-500/10"
        >
          View All <FiArrowUpRight size={16} />
        </a>
      </div>
      <div className="p-6 md:p-8">
        <SubmissionsTable submissions={submissions} loading={loadingSubmissions} />
      </div>
    </motion.div>
  </div>
);

export default AdminDashboardPage;