/**
 * FRONTEND INTEGRATION GUIDE
 * 
 * How to integrate the AI Project System into your existing React application
 * 
 * This guide shows:
 * 1. How to use AIProjectInitializer after enrollment
 * 2. How to display the AIProjectDashboard on a project page
 * 3. How to update CV information to regenerate projects
 * 4. How to track progress across your dashboard
 */

// ============================================================================
// 1. IMPORT ALL AI COMPONENTS
// ============================================================================
import AIProjectDashboard from './components/ai/AIProjectDashboard';
import AIProjectInitializer from './components/ai/AIProjectInitializer';
import { ProgressBar } from './components/ai/ProgressBar';
import { TaskCard } from './components/ai/TaskCard';
import { TaskSubmissionModal } from './components/ai/TaskSubmissionModal';

// ============================================================================
// 2. EXAMPLE: Show Project Generator After Enrollment
// ============================================================================

/**
 * On your Enrollment Success Page or Modal
 */
function EnrollmentSuccessPage({ enrollmentId, categoryName }) {
  const [projectGenerated, setProjectGenerated] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Enrollment Successful!</h1>

      {!projectGenerated ? (
        <AIProjectInitializer
          enrollmentId={enrollmentId}
          categoryName={categoryName}
          onProjectGenerated={() => setProjectGenerated(true)}
          onError={(error) => console.error(error)}
        />
      ) : (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900">
            ✓ Your project is ready!
          </h2>
          <p className="text-green-700 mt-2">
            Visit your dashboard to view tasks and start your internship.
          </p>
          <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. EXAMPLE: Display Project Dashboard
// ============================================================================

/**
 * On your Dashboard or Project Details Page
 */
function AIProjectPage({ enrollmentId, categoryName }) {
  return (
    <div className="container mx-auto py-8">
      <AIProjectDashboard
        enrollmentId={enrollmentId}
        categoryName={categoryName}
      />
    </div>
  );
}

// ============================================================================
// 4. EXAMPLE: Update CV and Regenerate Project
// ============================================================================

/**
 * Enhanced CV Builder with AI Project Integration
 */
function CVBuilderWithAI({ userId, enrollmentId }) {
  const [cvData, setCvData] = useState({
    skills: {
      technical: '',
      soft: '',
    },
    field: '',
    interest: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSaveCV = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Save CV data to backend
      await axios.put(
        `/api/auth/profile/${userId}`,
        {
          skills: cvData.skills,
          field: cvData.field,
          interest: cvData.interest,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Optional: Regenerate project with new CV data
      const confirmRegenerate = window.confirm(
        'CV updated! Would you like to regenerate your internship project based on the new information?'
      );

      if (confirmRegenerate) {
        await axios.post(
          `/projects/${enrollmentId}/regenerate`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        alert('Project regenerated successfully!');
      }
    } catch (error) {
      alert('Error saving CV: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Build Your CV</h1>

      <form onSubmit={handleSaveCV} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Technical Skills */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Technical Skills
          </label>
          <textarea
            value={cvData.skills.technical}
            onChange={(e) =>
              setCvData({
                ...cvData,
                skills: { ...cvData.skills, technical: e.target.value },
              })
            }
            placeholder="e.g., JavaScript, React, Node.js, MongoDB..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="4"
          />
        </div>

        {/* Soft Skills */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Soft Skills
          </label>
          <textarea
            value={cvData.skills.soft}
            onChange={(e) =>
              setCvData({
                ...cvData,
                skills: { ...cvData.skills, soft: e.target.value },
              })
            }
            placeholder="e.g., Team Leadership, Communication, Problem Solving..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="4"
          />
        </div>

        {/* Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Field of Interest
          </label>
          <input
            type="text"
            value={cvData.field}
            onChange={(e) => setCvData({ ...cvData, field: e.target.value })}
            placeholder="e.g., Web Development, Data Science, DevOps..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Interest */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Specific Interest
          </label>
          <textarea
            value={cvData.interest}
            onChange={(e) => setCvData({ ...cvData, interest: e.target.value })}
            placeholder="What aspects of your field are you most interested in?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
        >
          {saving ? 'Saving...' : '💾 Save CV'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Tip: Updating your CV will allow you to regenerate your internship project
          to better match your current skills and interests.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 5. EXAMPLE: Dashboard Quick Stats with AI Progress
// ============================================================================

/**
 * Add to your main Dashboard showing AI projects
 */
function DashboardAIProjectsWidget({ enrollmentId }) {
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `/projects/${enrollmentId}/progress`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        setProjectStats(response.data);
      } catch (error) {
        console.error('Error fetching project stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [enrollmentId]);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!projectStats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🤖 AI Project Progress</h3>

      <ProgressBar progress={projectStats.progress} />

      <div className="grid grid-cols-4 gap-2 mt-6 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {projectStats.taskStats.total}
          </p>
          <p className="text-xs text-gray-600">Total Tasks</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">
            {projectStats.taskStats.completed}
          </p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600">
            {projectStats.taskStats.inProgress}
          </p>
          <p className="text-xs text-gray-600">In Progress</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">
            {projectStats.taskStats.rejected}
          </p>
          <p className="text-xs text-gray-600">Rejected</p>
        </div>
      </div>

      {projectStats.certificateGenerated && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            🎉 Certificate available! Download from your certificates page.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. EXAMPLE: API Service Helper (Optional)
// ============================================================================

/**
 * Create a service file for AI Project API calls (e.g., services/aiProjectService.js)
 */

// services/aiProjectService.js
export const aiProjectService = {
  // Generate AI project for enrollment
  generateProject: async (enrollmentId) => {
    const response = await axios.post(
      '/projects/generate-internship',
      { enrollmentId },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  // Get project details
  getProject: async (enrollmentId) => {
    const response = await axios.get(`/projects/${enrollmentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },

  // Submit task
  submitTask: async (enrollmentId, taskId, submissionText) => {
    const response = await axios.post(
      `/projects/${enrollmentId}/submit-task`,
      { taskId, submissionText },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  // Get project progress
  getProjectProgress: async (enrollmentId) => {
    const response = await axios.get(`/projects/${enrollmentId}/progress`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },

  // Regenerate project
  regenerateProject: async (enrollmentId) => {
    const response = await axios.post(
      `/projects/${enrollmentId}/regenerate`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },
};

// Usage in component:
// const project = await aiProjectService.generateProject(enrollmentId);

export default {
  EnrollmentSuccessPage,
  AIProjectPage,
  CVBuilderWithAI,
  DashboardAIProjectsWidget,
};
