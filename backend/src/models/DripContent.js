const mongoose = require('mongoose');

const dripContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide content title'],
      trim: true,
    },
    description: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
      required: true,
    },
    contentType: {
      type: String,
      enum: ['video', 'article', 'pdf', 'quiz', 'assignment'],
      default: 'video',
    },
    contentUrl: {
      type: String,
      required: true,
    },
    duration: Number, // in minutes
    week: {
      type: Number,
      required: true,
    },
    dayOfWeek: {
      type: Number, // 0-6, where 0 is Sunday
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    isReleased: {
      type: Boolean,
      default: false,
    },
    thumbnailUrl: String,
    tags: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: Date,
        progress: Number, // percentage
      },
    ],
    relatedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  { timestamps: true }
);

// Auto-release content based on schedule
dripContentSchema.methods.shouldRelease = function () {
  return new Date() >= this.releaseDate && !this.isReleased;
};

module.exports = mongoose.model('DripContent', dripContentSchema);
