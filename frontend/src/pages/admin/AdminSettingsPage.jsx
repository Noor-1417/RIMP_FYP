import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { Button, Input } from '../../components/common/FormElements';
import toast from 'react-hot-toast';

export const AdminSettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

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
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">Basic platform settings and feature flags.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-6">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="space-y-4">
                  <Input label="Site Name" value={settings?.siteName || ''} onChange={(e) => handleChange('siteName', e.target.value)} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Contact Email" value={settings?.contactEmail || ''} onChange={(e) => handleChange('contactEmail', e.target.value)} />
                    <Input label="Support URL" value={settings?.supportUrl || ''} onChange={(e) => handleChange('supportUrl', e.target.value)} />
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Maintenance Mode</div>
                      <div className="text-xs text-gray-400">Toggle maintenance mode for the platform.</div>
                    </div>
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={!!settings?.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} className="form-checkbox h-5 w-5 text-primary" />
                        <span className="ml-3 text-sm">{settings?.maintenanceMode ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Input label="Version" value={settings?.version || ''} onChange={(e) => handleChange('version', e.target.value)} />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Feature Flags</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={!!settings?.features?.exports} onChange={(e) => handleFeatureChange('exports', e.target.checked)} />
                        <span className="text-sm">Exports</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={!!settings?.features?.announcements} onChange={(e) => handleFeatureChange('announcements', e.target.checked)} />
                        <span className="text-sm">Announcements</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={!!settings?.features?.dripScheduling} onChange={(e) => handleFeatureChange('dripScheduling', e.target.checked)} />
                        <span className="text-sm">Drip Scheduling</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} isLoading={loading}>Save</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
