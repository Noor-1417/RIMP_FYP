import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-light">
      <div className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Remote Internship Management Platform</h1>
            <p className="text-gray-600 mb-6">Run remote internship programs, assign tasks, evaluate submissions with AI, and issue verified certificates — all in one platform.</p>
            <div className="flex gap-4">
              <Link to="/register" className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90">Get Started</Link>
              <Link to="/login" className="px-6 py-3 bg-secondary text-primary rounded-lg hover:opacity-90">Login</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h3 className="text-xl font-semibold text-primary mb-3">Key Features</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Role-based dashboards for Admins and Interns</li>
              <li>Automated task assignment and AI grading</li>
              <li>Certificate generation with QR verification</li>
              <li>Stripe-based subscription and payments</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
