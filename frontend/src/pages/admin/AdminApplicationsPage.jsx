import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const AdminApplicationsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications');
      setApplications(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (app) => setSelected(app);

  const handleClose = () => setSelected(null);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      toast.success('Status updated');
      fetchApplications();
      if (selected && selected._id === id) {
        setSelected({ ...selected, status });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">New Applications</h1>
              <p className="text-gray-400">Review and manage incoming student CV submissions</p>
            </motion.div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No applications found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Education</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Skills</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {applications.map((app) => (
                        <tr key={app._id} className="hover:bg-gray-900/50 transition">
                          <td className="px-6 py-4"><span className="text-gray-100 font-medium">{app.fullName}</span></td>
                          <td className="px-6 py-4 text-gray-400 text-sm">{app.email}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm">{(app.education && app.education[0]) ? `${app.education[0].degree} @ ${app.education[0].institution}` : '-'}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm">{app.skills?.technical ? app.skills.technical.split(',').slice(0,4).join(', ') : '-'}</td>
                          <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300">{app.status}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleView(app)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">View</button>
                              <button onClick={() => updateStatus(app._id, 'Approved')} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                              <button onClick={() => updateStatus(app._id, 'Rejected')} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal */}
            {selected && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-3xl bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-100">{selected.fullName}</h2>
                      <p className="text-gray-400">{selected.email} • {selected.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(selected._id, 'Approved')} className="bg-green-600 px-3 py-1 rounded text-white">Approve</button>
                      <button onClick={() => updateStatus(selected._id, 'Rejected')} className="bg-red-600 px-3 py-1 rounded text-white">Reject</button>
                      <button onClick={handleClose} className="bg-gray-700 px-3 py-1 rounded text-white">Close</button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm text-gray-300 font-semibold">Summary</h4>
                      <p className="text-gray-400 mt-2">{selected.summary || '-'}</p>

                      <h4 className="text-sm text-gray-300 font-semibold mt-4">Education</h4>
                      {selected.education?.length ? selected.education.map((ed, i) => (
                        <div key={i} className="mt-2 bg-gray-900 p-3 rounded">
                          <div className="text-gray-100 font-medium">{ed.degree} • {ed.institution}</div>
                          <div className="text-gray-400 text-sm">{ed.year} {ed.gpa ? `• GPA ${ed.gpa}` : ''}</div>
                        </div>
                      )) : <div className="text-gray-400 mt-2">-</div>}
                    </div>

                    <div>
                      <h4 className="text-sm text-gray-300 font-semibold">Experience</h4>
                      {selected.experience?.length ? selected.experience.map((ex, i) => (
                        <div key={i} className="mt-2 bg-gray-900 p-3 rounded">
                          <div className="text-gray-100 font-medium">{ex.role} • {ex.company}</div>
                          <div className="text-gray-400 text-sm">{ex.start} {ex.end ? `— ${ex.end}` : ''}</div>
                          <div className="text-gray-400 text-sm mt-2">{ex.description}</div>
                        </div>
                      )) : <div className="text-gray-400 mt-2">-</div>}

                      <h4 className="text-sm text-gray-300 font-semibold mt-4">Skills</h4>
                      <div className="text-gray-400 mt-2">{selected.skills?.technical ? selected.skills.technical : '-'}</div>
                      <h4 className="text-sm text-gray-300 font-semibold mt-4">Projects</h4>
                      {selected.projects?.length ? selected.projects.map((p, i) => (
                        <div key={i} className="mt-2 bg-gray-900 p-3 rounded">
                          <div className="text-gray-100 font-medium">{p.name}</div>
                          <div className="text-gray-400 text-sm">{p.description}</div>
                          <div className="text-gray-400 text-sm mt-1">Tech: {p.technologies}</div>
                        </div>
                      )) : <div className="text-gray-400 mt-2">-</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminApplicationsPage;
