import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const AIChatbot = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingProject, setGeneratingProject] = useState(false);
  const [project, setProject] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chatbot on component mount
  useEffect(() => {
    const enrollmentId = searchParams.get('enrollmentId');
    initializeChatbot(enrollmentId);
  }, []);

  const initializeChatbot = async (enrollmentId) => {
    try {
      setLoading(true);
      
      // Get enrollment ID from search params or fetch user's latest enrollment
      let actualEnrollmentId = enrollmentId;

      if (!actualEnrollmentId) {
        // If not provided, try to get from API or user context
        // For now, assume it's passed in URL params
        throw new Error('Enrollment ID is required');
      }

      setEnrollment(actualEnrollmentId);

      // Add AI welcome message
      const welcomeMsg = {
        id: 1,
        sender: 'ai',
        text: '👋 Hi! I\'m your AI internship guide. I will generate your personalized internship tasks based on your CV and skills.',
        timestamp: new Date(),
      };

      const infoMsg = {
        id: 2,
        sender: 'ai',
        text: 'Let me generate your project tasks now... This usually takes 2-3 seconds.',
        timestamp: new Date(),
      };

      setMessages([welcomeMsg, infoMsg]);

      // Call API to start internship
      const response = await api.post('/ai/start-internship', {
        enrollmentId: actualEnrollmentId,
      });

      if (response.data?.success) {
        const generatedProject = response.data.project;
        setProject(generatedProject);

        // Add success message
        setTimeout(() => {
          const successMsg = {
            id: 3,
            sender: 'ai',
            text: `🎉 Great! I've generated your project: "${generatedProject.title}"`,
            timestamp: new Date(),
          };

          const descMsg = {
            id: 4,
            sender: 'ai',
            text: generatedProject.description,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, successMsg, descMsg]);
        }, 1500);
      } else {
        throw new Error(response.data?.message || 'Failed to generate project');
      }
    } catch (err) {
      console.error('Error initializing chatbot:', err);
      
      const errorMsg = {
        id: 'error',
        sender: 'ai',
        text: `❌ ${err.response?.data?.message || err.message || 'Failed to generate project. Please try again.'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMsg]);
      toast.error('Failed to generate internship project');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToTasks = () => {
    if (project && enrollment) {
      navigate(`/tasks?enrollmentId=${enrollment}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-2xl h-[600px] flex flex-col overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-2xl font-bold">🤖 AI Internship Guide</h1>
            <p className="text-blue-100 mt-1">Generating your personalized project tasks...</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map((message, idx) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    message.sender === 'ai'
                      ? 'bg-blue-100 text-blue-900 rounded-bl-none'
                      : 'bg-blue-600 text-white rounded-br-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {generatingProject && (
              <motion.div
                className="flex justify-start"
                animate={{ opacity: [0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className="bg-blue-100 text-blue-900 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Project Display */}
          {project && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-gray-200 p-6 bg-white"
            >
              <div className="space-y-4">
                {/* Project Title */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Project: {project.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                </div>

                {/* Task Summary */}
                {project.tasks && project.tasks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      📋 Your Tasks ({project.totalTasks} total):
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {project.tasks.slice(0, 5).map((task, idx) => (
                        <div key={task._id} className="flex items-start gap-3 p-2 bg-blue-50 rounded">
                          <span className="font-semibold text-blue-600 text-sm">Week {task.order + 1}</span>
                          <span className="text-sm text-gray-700 flex-1">{task.title}</span>
                        </div>
                      ))}
                      {project.totalTasks > 5 && (
                        <p className="text-xs text-gray-500 italic">
                          ... and {project.totalTasks - 5} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleProceedToTasks}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Tasks →
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {!loading && messages.some(m => m.id === 'error') && !project && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-gray-200 p-6 bg-red-50"
            >
              <div className="text-center">
                <p className="text-red-700 font-semibold mb-4">
                  ❌ Failed to generate project
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/categories')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Browse Categories
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-lg shadow p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">What's happening?</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="text-2xl">🤖</span>
              <p>
                <strong>AI generates personalized tasks</strong> based on your CV, skills, and field of study
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📝</span>
              <p>
                <strong>Each task has a deadline</strong> and is designed to challenge and develop your skills
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✅</span>
              <p>
                <strong>Submit your work</strong> and get AI-powered feedback and scoring instantly
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
