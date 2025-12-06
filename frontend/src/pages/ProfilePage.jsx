import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../context/store';
import { authService } from '../services';
import { Button, Input } from '../components/common/FormElements';
import { Card } from '../components/common/LayoutElements';

export const ProfilePage = () => {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '' });
    }
  }, [user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async () => {
    try {
      setSaving(true);
      const res = await authService.updateProfile(form);
      // Assume API returns updated user
      const updated = res.data || res;
      setUser(updated.user || updated, localStorage.getItem('token'));
      localStorage.setItem('user', JSON.stringify(updated.user || updated));
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
        <div className="space-y-4">
          <Input label="First Name" name="firstName" value={form.firstName} onChange={onChange} />
          <Input label="Last Name" name="lastName" value={form.lastName} onChange={onChange} />
          <Input label="Email" name="email" value={form.email} onChange={onChange} />
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
