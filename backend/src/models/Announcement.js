const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      enum: ['all', 'category', 'students'],
      default: 'all',
    },
    targetCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InternshipCategory',
      },
    ],
    targetStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    read: [
      {
        studentId: mongoose.Schema.Types.ObjectId,
        readAt: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
