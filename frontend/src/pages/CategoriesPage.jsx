import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Pagination } from '../components/common/LayoutElements';
import { Button } from '../components/common/FormElements';
import { Navbar } from '../components/layout/Navbar';
import { categoryService } from '../services';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Duration Selection Modal ───────────────────────────────────────────────
const DurationModal = ({ category, isOpen, onClose, onConfirm, isLoading }) => {
  const [selectedDuration, setSelectedDuration] = useState(2);

  useEffect(() => {
    if (isOpen) setSelectedDuration(2);
  }, [isOpen]);

  if (!isOpen || !category) return null;

  const freeWeeks     = category.freeDurationWeeks || 2;
  const pricePerWeek  = category.pricePerWeek || 5;
  const maxDuration   = category.duration || 8;

  const durationOptions = [];
  for (let w = 2; w <= maxDuration; w += 2) {
    const extra = Math.max(0, w - freeWeeks);
    durationOptions.push({ weeks: w, price: extra * pricePerWeek });
  }
  if (maxDuration % 2 !== 0 && !durationOptions.find(o => o.weeks === maxDuration)) {
    const extra = Math.max(0, maxDuration - freeWeeks);
    durationOptions.push({ weeks: maxDuration, price: extra * pricePerWeek });
  }

  const currentOption = durationOptions.find(o => o.weeks === selectedDuration) || durationOptions[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          {/* ── Modal Card — scrollable on small screens ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header — sticky */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-bold text-white">📋 Select Internship Duration</h2>
              <p className="text-blue-100 text-sm mt-1">{category.name}</p>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Info Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
                <p className="text-green-800 text-sm font-medium">
                  ✅ First {freeWeeks} weeks are <strong>FREE!</strong> Extra weeks cost ${pricePerWeek}/week.
                </p>
              </div>

              {/* Duration Options */}
              <div className="space-y-3 mb-6">
                {durationOptions.map(option => (
                  <label
                    key={option.weeks}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedDuration === option.weeks
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDuration(option.weeks)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedDuration === option.weeks
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedDuration === option.weeks && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{option.weeks} Weeks</span>
                        {option.weeks <= freeWeeks && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            FREE
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {option.price === 0 ? (
                        <span className="text-green-600 font-bold text-lg">Free</span>
                      ) : (
                        <span className="text-blue-700 font-bold text-lg">${option.price.toFixed(2)}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{selectedDuration} weeks</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Free weeks:</span>
                  <span className="font-semibold text-green-600">{Math.min(selectedDuration, freeWeeks)} weeks</span>
                </div>
                {selectedDuration > freeWeeks && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Paid weeks:</span>
                    <span className="font-semibold">{selectedDuration - freeWeeks} × ${pricePerWeek}</span>
                  </div>
                )}
                <div className="border-t mt-3 pt-3 flex justify-between items-center">
                  <span className="text-gray-800 font-bold">Total:</span>
                  <span className={`text-xl font-bold ${currentOption.price === 0 ? 'text-green-600' : 'text-blue-700'}`}>
                    {currentOption.price === 0 ? 'FREE' : `$${currentOption.price.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Paid notice */}
              {currentOption.price > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5">
                  <p className="text-yellow-800 text-sm">
                    💳 You will be redirected to <strong>Stripe</strong> for secure payment.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(category._id, selectedDuration)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : currentOption.price === 0
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : currentOption.price === 0 ? (
                    '✅ Enroll for Free'
                  ) : (
                    `💳 Pay $${currentOption.price.toFixed(2)} & Enroll`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const CategoriesPage = () => {
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(0);
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [enrolling, setEnrolling]         = useState(false);
  const [enrolledIds,    setEnrolledIds]    = useState(new Set());
  const [enrollmentMap,  setEnrollmentMap]  = useState({}); // categoryId -> enrollmentId
  const navigate = useNavigate();

  // ── Load categories ──
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await categoryService.getAll({
        page,
        limit: 9,
        difficulty: filterDifficulty || undefined,
      });
      const data  = response?.data?.data || response?.data || [];
      const pages = response?.data?.pagination?.pages || 1;
      setCategories(Array.isArray(data) ? data : []);
      setTotalPages(pages);
    } catch (err) {
      console.error('Category load error:', err);
      const msg = err?.response?.data?.message || '';
      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        setError('Cannot connect to backend server. Make sure the backend is running on port 5001.');
      } else if (msg.includes('Database not connected')) {
        setError('Database not connected. Make sure MongoDB is running.');
      } else {
        setError(msg || 'Unable to load categories. Please refresh the page.');
      }
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledIds = async () => {
    try {
      const res = await api.get('/internship-tasks/my-enrollments');
      if (res.data?.success) {
        const ids = new Set();
        const map = {};
        (res.data.enrollments || []).forEach(e => {
          const catId = e.category?._id?.toString();
          if (catId) { ids.add(catId); map[catId] = e._id; }
        });
        setEnrolledIds(ids);
        setEnrollmentMap(map);
      }
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, filterDifficulty]);

  useEffect(() => {
    fetchEnrolledIds();
  }, []);

  const openEnrollModal = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleEnroll = async (categoryId, selectedDuration) => {
    try {
      setEnrolling(true);
      const response = await categoryService.enroll(categoryId, { selectedDuration });

      if (response.data?.checkoutUrl) {
        // Paid — redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        // Free enrollment — AI tasks are auto-generated on the backend
        toast.success(`🎉 Enrolled! AI tasks are being generated…`);
        setModalOpen(false);
        setSelectedCategory(null);
        await fetchEnrolledIds();
        navigate('/tasks');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
      console.error('Enrollment error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Internship Categories</h1>
          <p className="text-gray-600">
            Explore our AI-powered internship programs — First 2 weeks are <strong>FREE!</strong>
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <select
            value={filterDifficulty}
            onChange={e => { setFilterDifficulty(e.target.value); setPage(1); }}
            className="px-4 py-2 border-2 border-primary rounded-lg focus:outline-none"
          >
            <option value="">All Difficulty Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Card className="text-center py-12 bg-red-50 border border-red-200 text-red-700">
            <p>{error}</p>
          </Card>
        ) : categories.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 text-lg">No categories found</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {categories.map((category, index) => {
                const isEnrolled = enrolledIds.has(category._id?.toString());
                return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className="h-full flex flex-col relative">
                      {/* ── Already Enrolled Ribbon ── */}
                      {isEnrolled && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md shadow-emerald-200">
                            ✓ Already Enrolled
                          </span>
                        </div>
                      )}

                      {category.image && (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-primary mb-2 pr-28">{category.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Max Duration:</span>
                            <Badge variant="light">{category.duration} weeks</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Level:</span>
                            <Badge variant={category.difficulty === 'advanced' ? 'danger' : 'secondary'}>
                              {category.difficulty}
                            </Badge>
                          </div>

                          <div className="border-t pt-3">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">Free Duration:</span>
                              <Badge variant="success">✓ {category.freeDurationWeeks || 2} weeks FREE</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Extra Weeks:</span>
                              <span className="font-bold text-sm text-blue-700">
                                ${category.pricePerWeek || 5}/week
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Enrolled:</span>
                            <span className="text-sm font-medium">
                              {category.enrolledCount}/{category.capacity}
                            </span>
                          </div>
                        </div>

                        {category.learningOutcomes?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-primary mb-2">Learning Outcomes:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {category.learningOutcomes.slice(0, 3).map((o, i) => (
                                <li key={i}>✓ {o}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-800 font-semibold">
                            🤖 AI generates personalised tasks based on your skills & education!
                          </p>
                        </div>

                        {isEnrolled ? (
                          <button
                            onClick={() => navigate('/tasks')}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-500 transition-all shadow-md"
                          >
                            📋 View My Tasks
                          </button>
                        ) : (
                          <Button variant="primary" fullWidth onClick={() => openEnrollModal(category)}>
                            🚀 Enroll Now
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {/* Duration Selection Modal */}
      <DurationModal
        category={selectedCategory}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCategory(null); }}
        onConfirm={handleEnroll}
        isLoading={enrolling}
      />
    </div>
  );
};
