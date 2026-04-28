const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'submitted', 'completed', 'rejected'],
    default: 'pending',
  },
  order: {
    type: Number,
    default: 0,
  },
  submission: {
    text: String,
    submittedAt: Date,
    fileUrl: String,
  },
  evaluation: {
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    passed: Boolean,
    feedback: String,
    plagiarismScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    evaluatedAt: Date,
  },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipCategory',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  objectives: [String],
  tools: [String],
  skills: [String],
  tasks: [taskSchema],
  notes: String,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  completedTasks: {
    type: Number,
    default: 0,
  },
  totalTasks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'failed'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  estimatedEndDate: Date,
  actualEndDate: Date,
  certificateGenerated: {
    type: Boolean,
    default: false,
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
  },
  // CV data used for generation (for reference)
  cvData: {
    skills: String,
    field: String,
    interest: String,
  },
}, { timestamps: true });

// Calculate progress before saving
projectSchema.pre('save', function(next) {
  if (this.totalTasks > 0) {
    this.progress = Math.round((this.completedTasks / this.totalTasks) * 100);
  }
  next();
});

// Index for faster queries
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ enrollmentId: 1 });

module.exports = mongoose.model('Project', projectSchema);
