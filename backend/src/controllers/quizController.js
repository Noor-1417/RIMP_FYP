const Quiz = require('../models/Quiz');
const InternshipCategory = require('../models/InternshipCategory');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
exports.getAllQuizzes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, week } = req.query;

    let query = { isPublished: true };
    if (category) query.category = category;
    if (week) query.week = week;

    const quizzes = await Quiz.find(query)
      .populate('category', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ week: 1 });

    const total = await Quiz.countDocuments(query);

    res.status(200).json({
      success: true,
      data: quizzes,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single quiz with questions
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('category', 'name');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Don't expose correct answers to users
    const quizData = quiz.toObject();
    if (req.user.role === 'intern') {
      quizData.questions = quizData.questions.map((q) => {
        const questionCopy = { ...q };
        questionCopy.options = questionCopy.options.map((opt) => ({
          text: opt.text,
        }));
        delete questionCopy.correctAnswer;
        return questionCopy;
      });
    }

    res.status(200).json({
      success: true,
      data: quizData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create quiz
// @route   POST /api/quizzes
// @access  Private/Admin/Manager
exports.createQuiz = async (req, res, next) => {
  try {
    const { title, description, category, week, totalPoints, passingScore, timeLimit, questions } =
      req.body;

    const categoryExists = await InternshipCategory.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const quiz = await Quiz.create({
      title,
      description,
      category,
      week,
      totalPoints,
      passingScore,
      timeLimit,
      questions,
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Admin/Manager
exports.updateQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Admin/Manager
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndRemove(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Check max attempts
    const userAttempts = quiz.attempts.filter((a) => a.intern.toString() === req.user.id);
    if (!quiz.allowRetake && userAttempts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz retakes are not allowed',
      });
    }

    if (userAttempts.length >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts (${quiz.maxAttempts}) exceeded`,
      });
    }

    // Calculate score
    let score = 0;
    const processedAnswers = answers.map((answer) => {
      const question = quiz.questions.find((q) => q._id.toString() === answer.questionId);

      if (!question) {
        return { ...answer, isCorrect: false, pointsEarned: 0 };
      }

      let isCorrect = false;
      if (question.type === 'mcq' || question.type === 'true-false') {
        isCorrect = question.options.some(
          (opt) =>
            opt.isCorrect &&
            opt.text.toLowerCase() === (answer.selectedAnswer || '').toLowerCase()
        );
      } else {
        isCorrect = question.correctAnswer.toLowerCase() === answer.selectedAnswer.toLowerCase();
      }

      const pointsEarned = isCorrect ? question.points : 0;
      score += pointsEarned;

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        pointsEarned,
      };
    });

    const percentage = (score / quiz.totalPoints) * 100;
    const isPassed = percentage >= quiz.passingScore;

    const attempt = {
      intern: req.user.id,
      startedAt: new Date(Date.now() - timeTaken * 1000),
      completedAt: new Date(),
      answers: processedAnswers,
      score,
      percentage,
      isPassed,
      timeTaken,
    };

    quiz.attempts.push(attempt);
    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        score,
        percentage,
        isPassed,
        passingScore: quiz.passingScore,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get quiz results
// @route   GET /api/quizzes/:id/results
// @access  Private
exports.getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const userAttempts = quiz.attempts.filter((a) => a.intern.toString() === req.user.id);

    res.status(200).json({
      success: true,
      data: userAttempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
