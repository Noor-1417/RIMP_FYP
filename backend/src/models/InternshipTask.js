const mongoose = require('mongoose');

const internshipTaskSchema = new mongoose.Schema(
  {
    // Refs per user spec
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
    },
    // Also keep legacy aliases for backward compat with existing frontend
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
    },
    // Task fields
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [
      {
        type: String,
      },
    ],
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    deadline: {
      type: Date,
      required: true,
    },
    // Also keep deadlineDate alias for backward compat
    deadlineDate: {
      type: Date,
    },
    orderNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    // Also keep taskOrder alias for backward compat
    taskOrder: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'in-progress', 'submitted', 'completed', 'approved', 'rejected'],
      default: 'locked',
    },
    submission: {
      fileUrl: String, // Legacy single file
      fileName: String, // Legacy single file
      files: [{
        url: String,
        name: String
      }],
      githubLink: String,
      message: String,
      submittedAt: Date,
    },
    // Inline evaluation (kept for backward compat with existing frontend)
    evaluation: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      plagiarism_percent: {
        type: Number,
        min: 0,
        max: 100,
      },
      status: {
        type: String,
        enum: ['PASS', 'FAIL'],
      },
      feedback: String,
      improvements: [String],
      evaluatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: keep aliases in sync
internshipTaskSchema.pre('save', function (next) {
  // Sync new ↔ old field names
  if (this.internshipId && !this.enrollment) this.enrollment = this.internshipId;
  if (this.enrollment && !this.internshipId) this.internshipId = this.enrollment;
  if (this.studentId && !this.student) this.student = this.studentId;
  if (this.student && !this.studentId) this.studentId = this.student;
  if (this.categoryId && !this.category) this.category = this.categoryId;
  if (this.category && !this.categoryId) this.categoryId = this.category;
  if (this.deadline && !this.deadlineDate) this.deadlineDate = this.deadline;
  if (this.deadlineDate && !this.deadline) this.deadline = this.deadlineDate;
  if (this.orderNumber && !this.taskOrder) this.taskOrder = this.orderNumber;
  if (this.taskOrder && !this.orderNumber) this.orderNumber = this.taskOrder;
  next();
});

// Indexes
internshipTaskSchema.index({ internshipId: 1, orderNumber: 1 });
internshipTaskSchema.index({ enrollment: 1, taskOrder: 1 });
internshipTaskSchema.index({ studentId: 1, status: 1 });
internshipTaskSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('InternshipTask', internshipTaskSchema);
