const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipTask',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    // File submission (PDF/ZIP uploaded via multer)
    fileUrl: {
      type: String,
    },
    filePath: {
      type: String,
    },
    fileName: {
      type: String,
    },
    // GitHub link submission
    githubLink: {
      type: String,
    },
    // Text message / notes
    message: {
      type: String,
    },
    // AI evaluation results
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    plagiarismPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiFeedback: {
      type: String,
    },
    aiImprovements: [
      {
        type: String,
      },
    ],
    // Submission status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
submissionSchema.index({ taskId: 1, studentId: 1 });
submissionSchema.index({ studentId: 1, status: 1 });
submissionSchema.index({ internshipId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
