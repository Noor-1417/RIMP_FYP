const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    selectedDuration: {
      type: Number, // in weeks
      default: 2,
    },
    // Alias for selectedDuration for cleaner API usage
    durationWeeks: {
      type: Number,
      default: 2,
    },
    pricePaid: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'free'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'suspended'],
      default: 'active',
    },
    startDate: Date,
    endDate: Date,
    // Tracking timestamps
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    certificateEarned: Boolean,
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate',
    },
  },
  { timestamps: true }
);

// Pre-save: sync durationWeeks with selectedDuration
enrollmentSchema.pre('save', function (next) {
  if (this.isModified('selectedDuration') && !this.isModified('durationWeeks')) {
    this.durationWeeks = this.selectedDuration;
  }
  if (this.isModified('durationWeeks') && !this.isModified('selectedDuration')) {
    this.selectedDuration = this.durationWeeks;
  }
  // Set startedAt on first activation
  if (this.isModified('status') && this.status === 'active' && !this.startedAt) {
    this.startedAt = new Date();
  }
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
