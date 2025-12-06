const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
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
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: Date,
    qrCode: String, // QR code image data
    qrCodeUrl: String,
    certificateUrl: String,
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
    },
    score: Number,
    completionPercentage: Number,
    skills: [String],
    tasksCompleted: {
      type: Number,
      required: true,
    },
    totalTasks: {
      type: Number,
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDownloaded: {
      type: Boolean,
      default: false,
    },
    downloadedAt: Date,
    isPublic: {
      type: Boolean,
      default: false,
    },
    publicUrl: String,
    verificationUrl: String,
    metadata: {
      internshipDuration: Number,
      startDate: Date,
      endDate: Date,
      companyName: String,
      managerName: String,
    },
  },
  { timestamps: true }
);

// Generate certificate number
certificateSchema.pre('save', function (next) {
  if (!this.certificateNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.certificateNumber = `RIMP-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
