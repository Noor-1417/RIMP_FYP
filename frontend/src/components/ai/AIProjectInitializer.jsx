import React, { useState } from 'react';
import axios from 'axios';

/**
 * AIProjectInitializer Component
 * Generates AI project after enrollment
 * Can be placed on enrollment success page or dashboard
 */
export const AIProjectInitializer = ({
  enrollmentId,
  categoryName,
  onProjectGenerated,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const handleGenerateProject = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        '/projects/generate-internship',
        { enrollmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setGenerated(true);
        if (onProjectGenerated) {
          onProjectGenerated(response.data.project);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (generated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✓</span>
          <div>
            <h3 className="font-semibold text-green-900">AI Project Generated!</h3>
            <p className="text-sm text-green-700">
              Your personalized internship project has been created based on your CV. Visit your dashboard to start working on tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        🤖 Start Your AI-Powered Internship
      </h3>

      <p className="text-gray-700 mb-4">
        Our AI system will analyze your CV and create a personalized internship project tailored to your skills and interests. Ready to begin?
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleGenerateProject}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              Generating Project...
            </>
          ) : (
            '✨ Generate My Project'
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        This process uses AI to create custom tasks based on your profile. It typically takes 30-60 seconds.
      </p>
    </div>
  );
};

export default AIProjectInitializer;
