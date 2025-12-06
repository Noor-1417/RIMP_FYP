const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide quiz title'],
      trim: true,
    },
    description: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 100,
    },
    passingScore: {
      type: Number,
      default: 60,
    },
    timeLimit: {
      type: Number, // in minutes
      default: 60,
    },
    questions: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        type: {
          type: String,
          enum: ['mcq', 'short-answer', 'essay', 'true-false'],
          default: 'mcq',
        },
        question: String,
        description: String,
        image: String,
        options: [
          {
            text: String,
            isCorrect: Boolean,
          },
        ],
        correctAnswer: String, // For short answer/essay
        points: {
          type: Number,
          default: 10,
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          default: 'medium',
        },
      },
    ],
    attempts: [
      {
        intern: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        startedAt: Date,
        completedAt: Date,
        answers: [
          {
            questionId: mongoose.Schema.Types.ObjectId,
            selectedAnswer: String,
            isCorrect: Boolean,
            pointsEarned: Number,
          },
        ],
        score: Number,
        percentage: Number,
        isPassed: Boolean,
        timeTaken: Number, // in seconds
        feedback: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    allowRetake: {
      type: Boolean,
      default: true,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    dueDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
