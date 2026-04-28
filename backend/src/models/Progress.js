const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    currentWeek: {
      type: Number,
      default: 1,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksAssigned: {
      type: Number,
      default: 0,
    },
    quizzesTaken: {
      type: Number,
      default: 0,
    },
    quizzesScore: {
      type: Number,
      default: 0,
    },
    contentViewed: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    earnedPoints: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'paused'],
      default: 'not-started',
    },
    startDate: Date,
    estimatedCompletionDate: Date,
    actualCompletionDate: Date,
    weeklyProgress: [
      {
        week: Number,
        completed: Boolean,
        tasksCompleted: Number,
        quizzesScore: Number,
        contentViewed: Number,
        completedAt: Date,
      },
    ],
    badges: [String],
    strokes: [
      {
        badgeName: String,
        earnedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
