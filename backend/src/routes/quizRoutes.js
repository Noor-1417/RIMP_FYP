const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getQuizResults,
  getAvailableQuizzes,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/available', protect, authorize('intern'), getAvailableQuizzes);
router.get('/', protect, getAllQuizzes);
router.get('/:id', protect, getQuiz);
router.post('/:id/submit', protect, authorize('intern'), submitQuiz);
router.get('/:id/results', protect, getQuizResults);

// Admin/Manager routes
router.post('/', protect, authorize('admin', 'manager'), createQuiz);
router.put('/:id', protect, authorize('admin', 'manager'), updateQuiz);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteQuiz);

module.exports = router;
