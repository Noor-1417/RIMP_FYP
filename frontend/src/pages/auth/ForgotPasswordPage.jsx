import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authService } from '../../services';
import toast from 'react-hot-toast';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.data.success) {
        setSent(true);
        toast.success('Reset link sent to your email!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🔑
            </div>
            <h1 className="text-2xl font-bold text-primary">Forgot Password?</h1>
            <p className="text-slate-500 mt-2">Enter your email to receive a password reset link.</p>
        </div>

        {sent ? (
            <div className="text-center py-4">
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6">
                    <p className="font-medium">Check your inbox!</p>
                    <p className="text-sm mt-1">We've sent a recovery link to <b>{email}</b></p>
                </div>
                <Link to="/login" className="text-primary font-bold hover:underline">
                    Back to Login
                </Link>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="john@example.com"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                    {loading ? 'Sending Link...' : 'Send Reset Link'}
                </button>

                <div className="text-center">
                    <Link to="/login" className="text-sm text-slate-500 hover:text-primary transition-colors">
                        Remembered your password? <span className="font-bold text-primary">Login</span>
                    </Link>
                </div>
            </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
