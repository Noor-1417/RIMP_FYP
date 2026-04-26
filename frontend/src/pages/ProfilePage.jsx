import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../context/store';
import { authService } from '../services';
import { Button, Input } from '../components/common/FormElements';
import { Card } from '../components/common/LayoutElements';

export const ProfilePage = () => {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: '',
    company: '',
    department: '',
    internshipTitle: '',
    skills: { technical: '', soft: '' },
    field: '',
    interest: '',
  });

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [recommendations, setRecommendations] = useState(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profileImage: user.profileImage || '',
        company: user.company || '',
        department: user.department || '',
        internshipTitle: user.internshipTitle || '',
        skills: user.skills || { technical: '', soft: '' },
        field: user.field || '',
        interest: user.interest || '',
      });
    }
  }, [user]);

  // Handle simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle nested skills input
  const handleSkillsChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [name]: value,
      },
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.field.trim()) newErrors.field = 'Field of interest is required';
    if (!form.interest.trim()) newErrors.interest = 'Learning interest is required';
    if (!form.skills.technical.trim() && !form.skills.soft.trim()) {
      newErrors.skills = 'Please add at least one skill (technical or soft)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in your form');
      return;
    }

    try {
      setSaving(true);
      const res = await authService.updateProfile(form);
      
      if (res.data?.success) {
        const updated = res.data.user;
        setUser(updated, localStorage.getItem('token'));
        localStorage.setItem('user', JSON.stringify(updated));
        toast.success('✓ Profile updated successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Generate internship recommendations via AI
  const handleGenerateRecommendations = async () => {
    if (!validateForm()) {
      toast.error('Please complete all required fields first');
      return;
    }

    try {
      setGenerating(true);
      const payload = {
        skills: form.skills,
        field: form.field,
        interest: form.interest,
      };

      const res = await authService.generateInternship(payload);

      if (res.data?.success) {
        setRecommendations(res.data.data);
        toast.success('✓ Recommendations generated!');
      } else {
        toast.error(res.data?.message || 'Failed to generate recommendations');
      }
    } catch (err) {
      console.error('Generate recommendations error:', err);
      toast.error(err.response?.data?.message || 'Error generating recommendations');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Update your profile information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.firstName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.lastName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleInputChange}
                    placeholder="Tech Corp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleInputChange}
                    placeholder="Engineering"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Title/Position
                  </label>
                  <input
                    type="text"
                    name="internshipTitle"
                    value={form.internshipTitle}
                    onChange={handleInputChange}
                    placeholder="Software Engineer Intern"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Skills & Interest Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Skills & Interests
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technical Skills (comma separated) *
                  </label>
                  <input
                    type="text"
                    name="technical"
                    value={form.skills.technical}
                    onChange={handleSkillsChange}
                    placeholder="React, Node.js, Python, SQL..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soft Skills (comma separated) *
                  </label>
                  <input
                    type="text"
                    name="soft"
                    value={form.skills.soft}
                    onChange={handleSkillsChange}
                    placeholder="Leadership, Communication, Problem-solving..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {errors.skills && (
                  <p className="text-red-500 text-sm">{errors.skills}</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field of Interest *
                  </label>
                  <select
                    name="field"
                    value={form.field}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.field
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Field</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="AI/Machine Learning">AI/Machine Learning</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.field && (
                    <p className="text-red-500 text-xs mt-1">{errors.field}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What would you like to learn? *
                  </label>
                  <textarea
                    name="interest"
                    value={form.interest}
                    onChange={handleInputChange}
                    placeholder="Describe your learning interests and career goals..."
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.interest
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.interest && (
                    <p className="text-red-500 text-xs mt-1">{errors.interest}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving || generating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
              >
                {saving ? 'Saving...' : '💾 Save Profile'}
              </button>
              <button
                onClick={handleGenerateRecommendations}
                disabled={saving || generating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
              >
                {generating ? 'Generating...' : '🤖 AI Recommendations'}
              </button>
            </div>
          </div>

          {/* Sidebar - Recommendations & Quick Links */}
          <div className="space-y-6">
            {recommendations && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🎯 Your Recommendations
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Internship Opportunities
                    </h4>
                    <div className="space-y-2">
                      {recommendations.recommendations?.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded border border-gray-200"
                        >
                          <p className="font-medium text-sm text-gray-900">
                            {rec.title}
                          </p>
                          <p className="text-xs text-gray-600">{rec.company}</p>
                          <div className="mt-1 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                            {rec.skillMatch}% Match
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Skills to Develop
                    </h4>
                    <ul className="space-y-1">
                      {recommendations.skillSuggestions?.map((skill, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Learning Path
                    </h4>
                    <p className="text-sm text-gray-700">
                      {recommendations.learningPath}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Application Tips
                    </h4>
                    <ul className="space-y-1">
                      {recommendations.applicationTips?.map((tip, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 mt-1">→</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Completion</span>
                  <span className="font-medium text-sm text-blue-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: '85%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Complete your profile to unlock AI-powered recommendations
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
