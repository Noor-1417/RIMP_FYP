/**
 * COMPLETE EXAMPLE: AI Project Page
 * 
 * This is a fully functional example page that integrates:
 * - Project generation
 * - Task submission
 * - Progress tracking
 * - Error handling
 * 
 * Copy this pattern to your own pages
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AIProjectDashboard from './components/ai/AIProjectDashboard';
import AIProjectInitializer from './components/ai/AIProjectInitializer';

/**
 * AIProjectPage - Complete working example
 * 
 * Usage in your app:
 * <Route path="/projects/:enrollmentId" element={<AIProjectPage />} />
 */
export function AIProjectPage() {
  // Get enrollmentId from URL params
  const enrollmentId = new URLSearchParams(window.location.search).get('enrollmentId');
  
  const [projectExists, setProjectExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // Check if project exists when component mounts
  useEffect(() => {
    checkProjectExists();
  }, [enrollmentId]);

  const checkProjectExists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/projects/${enrollmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProjectExists(true);
      }
    } catch (err) {
      // 404 = project doesn't exist, that's ok
      if (err.response?.status !== 404) {
        setError('Error checking project: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading your project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="font-bold text-lg">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {!projectExists ? (
        // Show project generator if no project exists
        <AIProjectInitializer
          enrollmentId={enrollmentId}
          categoryName="AI-Powered Internship"
          onProjectGenerated={() => setProjectExists(true)}
          onError={(err) => setError(err)}
        />
      ) : (
        // Show full project dashboard if project exists
        <AIProjectDashboard
          enrollmentId={enrollmentId}
          categoryName="AI-Powered Internship"
        />
      )}
    </div>
  );
}

/**
 * EXAMPLE: Service Helper File
 * Save as: src/services/projectService.js
 * 
 * Usage in components:
 * import { projectService } from './services/projectService';
 * 
 * const project = await projectService.getProject(enrollmentId);
 */

export const projectService = {
  /**
   * Generate new AI project
   */
  async generateProject(enrollmentId) {
    try {
      const response = await axios.post(
        '/projects/generate-internship',
        { enrollmentId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate project');
    }
  },

  /**
   * Get project details
   */
  async getProject(enrollmentId) {
    try {
      const response = await axios.get(
        `/projects/${enrollmentId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data.project;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Project doesn't exist
      }
      throw error;
    }
  },

  /**
   * Get project progress and stats
   */
  async getProjectProgress(enrollmentId) {
    try {
      const response = await axios.get(
        `/projects/${enrollmentId}/progress`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Submit a task
   */
  async submitTask(enrollmentId, taskId, submissionText) {
    try {
      const response = await axios.post(
        `/projects/${enrollmentId}/submit-task`,
        { taskId, submissionText },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit task');
    }
  },

  /**
   * Update task status
   */
  async updateTaskStatus(enrollmentId, taskId, status) {
    try {
      const response = await axios.put(
        `/projects/${enrollmentId}/tasks/${taskId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Regenerate project
   */
  async regenerateProject(enrollmentId) {
    try {
      const response = await axios.post(
        `/projects/${enrollmentId}/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * EXAMPLE: Hook for AI Project Data
 * Save as: src/hooks/useAIProject.js
 * 
 * Usage in components:
 * const { project, progress, loading, error } = useAIProject(enrollmentId);
 */

export function useAIProject(enrollmentId) {
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enrollmentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const projectData = await projectService.getProject(enrollmentId);
        const progressData = await projectService.getProjectProgress(enrollmentId);

        setProject(projectData);
        setProgress(progressData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enrollmentId]);

  return { project, progress, loading, error };
}

/**
 * EXAMPLE: CV Builder Page with AI Integration
 * Shows how to update CV and regenerate project
 */

export function CVBuilderWithAIPage({ userId, enrollmentId }) {
  const [cvData, setCvData] = useState({
    skills: {
      technical: '',
      soft: '',
    },
    field: '',
    interest: '',
  });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState('');

  const saveCVAndUpdateProject = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Save CV
      await axios.put(
        `/api/auth/profile/${userId}`,
        {
          skills: cvData.skills,
          field: cvData.field,
          interest: cvData.interest,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setMessage('✓ CV saved successfully');

      // Ask if user wants to regenerate
      const shouldRegenerate = window.confirm(
        'Your CV has been updated! Would you like to regenerate your internship project to match your new profile?'
      );

      if (shouldRegenerate) {
        setRegenerating(true);
        await projectService.regenerateProject(enrollmentId);
        setMessage('✓ CV updated and project regenerated!');
      }
    } catch (error) {
      setMessage('✗ Error: ' + error.message);
    } finally {
      setSaving(false);
      setRegenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Build Your CV</h1>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('✓') ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={message.includes('✓') ? 'text-green-700' : 'text-red-700'}>
            {message}
          </p>
        </div>
      )}

      <form className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Technical Skills */}
        <div>
          <label className="block text-sm font-semibold mb-2">Technical Skills</label>
          <textarea
            value={cvData.skills.technical}
            onChange={(e) =>
              setCvData({
                ...cvData,
                skills: { ...cvData.skills, technical: e.target.value },
              })
            }
            placeholder="JavaScript, React, Node.js, MongoDB, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>

        {/* Soft Skills */}
        <div>
          <label className="block text-sm font-semibold mb-2">Soft Skills</label>
          <textarea
            value={cvData.skills.soft}
            onChange={(e) =>
              setCvData({
                ...cvData,
                skills: { ...cvData.skills, soft: e.target.value },
              })
            }
            placeholder="Leadership, Communication, Problem Solving, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>

        {/* Field */}
        <div>
          <label className="block text-sm font-semibold mb-2">Field of Interest</label>
          <input
            type="text"
            value={cvData.field}
            onChange={(e) => setCvData({ ...cvData, field: e.target.value })}
            placeholder="Web Development, Data Science, DevOps, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-semibold mb-2">Specific Interests</label>
          <textarea
            value={cvData.interest}
            onChange={(e) => setCvData({ ...cvData, interest: e.target.value })}
            placeholder="What aspects of your field excite you?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={saveCVAndUpdateProject}
          disabled={saving || regenerating}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
        >
          {saving || regenerating ? 'Processing...' : '💾 Save CV & Update Project'}
        </button>

        <p className="text-sm text-gray-600">
          💡 Your CV is used to generate personalized internship tasks. Keeping it up to date helps get better projects!
        </p>
      </form>
    </div>
  );
}

/**
 * EXAMPLE: Dashboard Widget showing AI Project Progress
 */

export function DashboardAIProjectWidget({ enrollmentId }) {
  const { project, progress, loading, error } = useAIProject(enrollmentId);

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!project) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">🤖 AI Project Progress</h3>
