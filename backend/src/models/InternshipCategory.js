const mongoose = require('mongoose');

const internshipCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: String,
    icon: String,
    color: {
      type: String,
      default: '#74B9FF',
    },
    image: String,
    industry: String,
    duration: {
      type: Number, // in weeks
      default: 8,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    price: {
      type: Number,
      default: 0,
    },
    pricePerWeek: {
      type: Number,
      default: 5, // $5 per extra week beyond free weeks
    },
    freeDurationWeeks: {
      type: Number,
      default: 2, // First 2 weeks are free
    },
    capacity: {
      type: Number,
      default: 100,
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    prerequisites: [String],
    learningOutcomes: [String],
    topics: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dripContentEnabled: {
      type: Boolean,
      default: true,
    },
    dripFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly'],
      default: 'weekly',
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
internshipCategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('InternshipCategory', internshipCategorySchema);
