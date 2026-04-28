import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { certificateService } from '../services';
import { Navbar } from '../components/layout/Navbar';

export const VerifyPage = () => {
  const { certificateNumber } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        const res = await certificateService.verify(certificateNumber);
        if (res.data.success) {
          setCert(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Certificate not found');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateNumber]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Verifying Authenticity...</p>
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center border-t-4 border-red-500">
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Invalid Certificate</h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              We couldn't find a record for certificate <b>{certificateNumber}</b>. 
              Please ensure the URL is correct or contact support.
            </p>
            <Link to="/" className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
                Return Home
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Verified by RIMP AI
                </div>
                <h1 className="text-4xl font-bold mb-2">Certificate of Authenticity</h1>
                <p className="opacity-80">This document confirms the successful completion of an AI-powered internship.</p>
            </div>

            <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Candidate Details</h3>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary border border-blue-100">
                                {cert.intern?.firstName?.[0]}{cert.intern?.lastName?.[0]}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{cert.intern?.firstName} {cert.intern?.lastName}</p>
                                <p className="text-slate-500">{cert.intern?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Internship Category</p>
                                <p className="text-xl font-bold text-primary">{cert.category?.name}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Grade</p>
                                    <p className="text-2xl font-bold text-green-600">{cert.grade}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Final Score</p>
                                    <p className="text-2xl font-bold text-primary">{cert.score}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Validation Info</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Certificate Number</p>
                                    <p className="font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block mt-1">
                                        {cert.certificateNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Issue Date</p>
                                    <p className="text-slate-500 mt-1">
                                        {new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Skills Verified</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {cert.skills?.map(s => (
                                            <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 text-center md:text-left">
                            <p className="text-xs text-slate-400 mb-4">Certified by RIMP AI Platform Automated Verification System.</p>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="font-bold text-slate-700">Authentic Record</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
