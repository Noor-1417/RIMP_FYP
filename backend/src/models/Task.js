const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide task title'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'blocked'],
      default: 'pending',
    },
    dueDate: Date,
    week: {
      type: Number, // Which week of the internship
      default: 1,
    },
    points: {
      type: Number,
      default: 10,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    isAutoAssigned: {
      type: Boolean,
      default: false,
    },
    autoAssignmentRule: {
      type: {
        byCategory: Boolean,
        bySkill: [String],
        byRole: String,
      },
    },
      submissions: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          submittedAt: { type: Date, default: Date.now },
          contentUrl: { type: String },
          files: [{ type: String }],
          status: { type: String, enum: ['submitted','grading','graded-passed','graded-failed'], default: 'submitted' },
          aiResult: {
            score: { type: Number },
            feedback: { type: String },
            raw: { type: mongoose.Schema.Types.Mixed },
          },
        },
      ],
    relatedContent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DripContent',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
