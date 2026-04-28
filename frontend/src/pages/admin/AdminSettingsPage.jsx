import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { FiSave, FiMoon, FiSun, FiBell, FiShield, FiMail, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const AdminSettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      const data = res.data || res;
      setSettings(data.data || {});
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleFeatureChange = (key, value) => {
    setSettings((s) => ({ ...s, features: { ...(s.features || {}), [key]: value } }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const id = settings?._id;
      const payload = {
        siteName: settings.siteName,
        maintenanceMode: !!settings.maintenanceMode,
        version: settings.version,
        contactEmail: settings.contactEmail,
        supportUrl: settings.supportUrl,
        theme: theme || 'dark',
        autoApproveStudents: !!settings.autoApproveStudents,
        emailNotifications: !!settings.emailNotifications,
        features: settings.features || {},
      };

      let res;
      if (id) {
        res = await api.put(`/admin/settings/${id}`, payload);
      } else {
        res = await api.post('/admin/settings', payload);
      }

      toast.success(res.data?.message || 'Settings saved');
      setSettings(res.data.data || settings);
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-cyan-300 transition-colors">Platform Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors">Manage system configuration, preferences, and feature flags.</p>
              </div>
              <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg">
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>

            {loading && !settings._id ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
                <p className="mt-3 text-gray-400">Loading settings...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General Settings */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl p-6 shadow-lg space-y-5 transition-colors">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 transition-colors">
                    <FiGlobe className="text-blue-500 dark:text-cyan-400" /> General Info
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                    <input type="text" value={settings?.siteName || ''} onChange={(e) => handleChange('siteName', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-cyan-300 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                    <input type="email" value={settings?.contactEmail || ''} onChange={(e) => handleChange('contactEmail', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-cyan-300 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support URL</label>
                    <input type="text" value={settings?.supportUrl || ''} onChange={(e) => handleChange('supportUrl', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-cyan-300 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                    <input type="text" value={settings?.version || ''} onChange={(e) => handleChange('version', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-cyan-300 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none transition-colors" />
                  </div>
                </motion.div>

                {/* Preferences */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl p-6 shadow-lg space-y-5 transition-colors">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 transition-colors">
                    <FiShield className="text-purple-500 dark:text-purple-400" /> Preferences & Security
                  </h2>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50 transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">System Theme</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Default dashboard theme for users</div>
                    </div>
                    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-700 transition-colors">
                      <button onClick={() => setTheme('light')} className={`p-1.5 rounded-md flex items-center gap-1 transition-colors ${theme === 'light' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        <FiSun size={14} /> <span className="text-xs font-medium">Light</span>
                      </button>
                      <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-md flex items-center gap-1 transition-colors ${theme === 'dark' ? 'bg-gray-700 dark:bg-gray-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        <FiMoon size={14} /> <span className="text-xs font-medium">Dark</span>
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Maintenance Mode</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Lock the platform for updates</div>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" checked={!!settings?.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} className="peer sr-only" />
                      <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Auto-Approve Users</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Allow instant student access</div>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" checked={!!settings?.autoApproveStudents} onChange={(e) => handleChange('autoApproveStudents', e.target.checked)} className="peer sr-only" />
                      <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email Alerts</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Send system emails to admins</div>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" checked={!!settings?.emailNotifications} onChange={(e) => handleChange('emailNotifications', e.target.checked)} className="peer sr-only" />
                      <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </div>
                  </label>
                </motion.div>

                {/* Feature Flags */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl p-6 shadow-lg space-y-5 md:col-span-2 transition-colors">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 transition-colors">
                    <FiBell className="text-green-500 dark:text-green-400" /> Feature Flags
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['exports', 'announcements', 'dripScheduling'].map(feature => (
                      <label key={feature} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50 cursor-pointer hover:border-blue-300 dark:hover:border-gray-500 transition-colors">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="relative inline-block w-8 h-4">
                          <input type="checkbox" checked={!!settings?.features?.[feature]} onChange={(e) => handleFeatureChange(feature, e.target.checked)} className="peer sr-only" />
                          <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
