import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Pagination } from '../components/common/LayoutElements';
import { Button } from '../components/common/FormElements';
import { Navbar } from '../components/layout/Navbar';
import { categoryService } from '../services';
import toast from 'react-hot-toast';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, [page, filterDifficulty]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll({
        page,
        limit: 9,
        difficulty: filterDifficulty || undefined,
      });
      setCategories(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (categoryId) => {
    try {
      await categoryService.enroll(categoryId);
      toast.success('Enrolled successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enrollment failed');
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">Internship Categories</h1>
          <p className="text-gray-600">Explore our comprehensive internship programs</p>
        </motion.div>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <select
            value={filterDifficulty}
            onChange={(e) => {
              setFilterDifficulty(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border-2 border-primary rounded-lg focus:outline-none"
          >
            <option value="">All Difficulty Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 text-lg">No categories found</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col">
                    {category.image && (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary mb-2">{category.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Duration:</span>
                          <Badge variant="light">{category.duration} weeks</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Level:</span>
                          <Badge variant={category.difficulty === 'advanced' ? 'danger' : 'secondary'}>
                            {category.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price:</span>
                          <span className="font-bold text-primary">
                            {category.price === 0 ? 'Free' : `$${category.price}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Enrolled:</span>
                          <span className="text-sm font-medium">
                            {category.enrolledCount}/{category.capacity}
                          </span>
                        </div>
                      </div>

                      {category.learningOutcomes && category.learningOutcomes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-primary mb-2">Learning Outcomes:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {category.learningOutcomes.slice(0, 3).map((outcome, idx) => (
                              <li key={idx}>✓ {outcome}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-light">
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => handleEnroll(category._id)}
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
