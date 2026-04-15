import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, ProgressBar, Badge } from '../../components/common/LayoutElements';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { taskService, quizService, certificateService } from '../../services';
import api from '../../utils/api';
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
  const [application, setApplication] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

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
      // load student application for CV status
      (async () => {
        try {
          setAppLoading(true);
          const res = await api.get(`/applications/user/${user._id}`);
          if (res.data && res.data.data) setApplication(res.data.data);
        } catch (err) {
          if (err.response && err.response.status === 404) setApplication(null);
          else console.error('Failed to load application', err);
        } finally {
          setAppLoading(false);
        }
      })();
    }
  }, [user]);

  const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const buildCvHtmlFromApp = (p) => {
    const style = `body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:#f3f4f6;margin:0;padding:32px;color:#0f172a}.cv-container{max-width:800px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.08)}.cv-head{background:linear-gradient(90deg,#0ea5e9 -10%,#06b6d4 40%,#10b981 100%);color:#fff;padding:28px 32px}.name{font-size:28px;margin:0;font-weight:800}.title{margin-top:6px;opacity:.95}.contact{margin-top:10px;font-size:13px;opacity:.95;display:flex;gap:12px;flex-wrap:wrap}.cv-body{padding:28px 32px;display:grid;grid-template-columns:1fr;gap:18px}.section h4{margin:0 0 10px 0;font-size:16px;color:#0f172a;font-weight:700;border-left:4px solid #06b6d4;padding-left:12px;background:linear-gradient(90deg,rgba(6,182,212,0.03),transparent);border-radius:4px;padding:8px 12px;display:inline-block}.card{padding:12px 14px;border-radius:8px;background:#f8fafc;border:1px solid #e6eef3;margin-bottom:10px}`;
    const esc = escapeHtml;
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.fullName||'CV')}</title><style>${style}</style></head><body><div class="cv-container"><div class="cv-head"><h1 class="name">${esc(p.fullName)}</h1><div class="title">${esc(p.title||'')}</div><div class="contact">${esc(p.email||'')}</div></div><div class="cv-body"><div class="section"><h4>Summary</h4><div class="card">${esc(p.summary||'')}</div></div><div class="section"><h4>Education</h4>${(p.education||[]).map(e=>`<div class="card"><div style="font-weight:700">${esc(e.degree||'')} • ${esc(e.institution||'')}</div><div class="muted">${esc(e.year||'')} ${e.gpa? '• GPA ' + esc(e.gpa):''}</div></div>`).join('')}</div><div class="section"><h4>Experience</h4>${(p.experience||[]).map(ex=>`<div class="card"><div style="font-weight:700">${esc(ex.role||'')} • ${esc(ex.company||'')}</div><div class="muted">${esc(ex.start||'')} ${ex.end? '—' + esc(ex.end):''}</div><div>${esc(ex.description||'')}</div></div>`).join('')}</div><div class="section"><h4>Projects</h4>${(p.projects||[]).map(pr=>`<div class="card"><div style="font-weight:700">${esc(pr.name||'')}</div><div>${esc(pr.description||'')}</div><div class="muted">Tech: ${esc(pr.technologies||'')}</div></div>`).join('')}</div></div></div></body></html>`;
    return html;
  };

  const downloadHtml = (app) => {
    if (!app) return;
    const html = buildCvHtmlFromApp(app);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(app.fullName||'cv').replace(/\s+/g,'_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const generatePdfFromHtml = async (htmlContent, fileName = 'cv.pdf') => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '842px';
    container.style.padding = '20px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await (await import('html2canvas')).default(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const jsPDFModule = (await import('jspdf')).default;
      const pdf = new jsPDFModule({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      container.remove();
    }
  };

  const downloadPdf = async (app) => {
    if (!app) return;
    const html = buildCvHtmlFromApp(app);
    await generatePdfFromHtml(html, `${(app.fullName||'cv').replace(/\s+/g,'_').toLowerCase()}.pdf`);
  };

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

        {/* CV Status Card */}
        <div className="mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-primary">Your CV</h3>
                <p className="text-gray-600">Status & quick actions</p>
              </div>
              <div>
                {appLoading ? (
                  <span className="text-gray-500">Checking…</span>
                ) : application ? (
                  <span className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold">Submitted</span>
                ) : (
                  <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold">Not Submitted</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <p className="text-gray-700">{application ? application.fullName : `${user?.firstName || ''} ${user?.lastName || ''}`}</p>
                <p className="text-gray-500 text-sm">{application ? application.email : user?.email}</p>
              </div>
              <div className="flex gap-3 md:justify-end">
                <button className="bg-blue-600 text-white px-4 py-2 rounded">{application ? 'View / Edit CV' : 'Complete CV'}</button>
                <button disabled={!application} className={`px-4 py-2 rounded ${application ? 'bg-green-600 text-white' : 'bg-gray-400 text-gray-800 cursor-not-allowed'}`}>Download CV</button>
              </div>
            </div>
          </Card>
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
