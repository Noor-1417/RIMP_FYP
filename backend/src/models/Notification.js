const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'task-assigned',
        'task-due',
        'quiz-available',
        'content-released',
        'certificate-earned',
        'payment-received',
        'submission-reviewed',
        'general',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedResource: {
      resourceType: {
        type: String,
        enum: ['task', 'quiz', 'content', 'certificate', 'payment'],
      },
      resourceId: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    channels: {
      email: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
    actionUrl: String,
    actionLabel: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
