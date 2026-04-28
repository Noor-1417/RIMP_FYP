const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'intern', 'manager'],
      default: 'intern',
    },
    phone: String,
    profileImage: String,
    bio: String,
    company: String,
    department: String,
    internshipTitle: String,
    startDate: Date,
    endDate: Date,
    // Profile fields for AI recommendations
    skills: {
      technical: String,
      soft: String,
    },
    field: String,
    interest: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
    },
    stats: {
      tasksCompleted: { type: Number, default: 0 },
      quizzesTaken: { type: Number, default: 0 },
      certificatesEarned: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
    // Subscription and enrollment info
    subscriptionMonths: { type: Number, default: 1 },
    subscriptionStart: { type: Date },
    enrollmentDate: { type: Date },
    // Freemium + Premium subscription fields
    isPremium: {
      type: Boolean,
      default: false,
    },
    trialUsed: {
      type: Boolean,
      default: false,
    },
    planDuration: {
      type: Number,
      enum: [1, 2, 3, null],
      default: null,
      description: '1=1 month, 2=2 months, 3=3 months',
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ['free', 'trial', 'active', 'expired', 'cancelled'],
      default: 'free',
    },
    trialStartedAt: {
      type: Date,
      default: null,
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user has active premium
userSchema.methods.hasActivePremium = function () {
  if (!this.isPremium) return false;
  if (!this.premiumExpiresAt) return false;
  return new Date() < new Date(this.premiumExpiresAt);
};

// Method to check if user is on active trial
userSchema.methods.isOnActiveTrial = function () {
  if (this.trialUsed) return false;
  if (!this.trialStartedAt || !this.trialEndsAt) return false;
  const now = new Date();
  return now >= new Date(this.trialStartedAt) && now < new Date(this.trialEndsAt);
};

// Method to start free trial (7 days)
userSchema.methods.startFreeTrial = function () {
  const now = new Date();
  this.trialStartedAt = now;
  this.trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  this.subscriptionStatus = 'trial';
  return this;
};

// Method to upgrade to premium
userSchema.methods.upgradeToPremium = function (planDuration) {
  const now = new Date();
  this.isPremium = true;
  this.planDuration = planDuration; // 1, 2, or 3 months
  this.trialUsed = true; // Mark trial as used if upgrading from trial
  const daysInPlan = planDuration * 30;
  this.premiumExpiresAt = new Date(now.getTime() + daysInPlan * 24 * 60 * 60 * 1000);
  this.subscriptionStatus = 'active';
  return this;
};

// Method to downgrade to free
userSchema.methods.downgradeToFree = function () {
  this.isPremium = false;
  this.planDuration = null;
  this.premiumExpiresAt = null;
  this.subscriptionStatus = 'expired';
  return this;
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.verificationToken;
  return user;
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
