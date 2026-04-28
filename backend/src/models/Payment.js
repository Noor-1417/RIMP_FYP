const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipCategory',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'credit-card'],
      default: 'stripe',
    },
    stripePaymentIntentId: String,
    stripeSessionId: String,
    stripeCustomerId: String,
    orderId: String,
    description: String,
    orderItems: [
      {
        type: String,
        quantity: Number,
        price: Number,
      },
    ],
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    metadata: {
      internshipTitle: String,
      internshipDuration: Number,
    },
    invoice: {
      invoiceNumber: String,
      invoiceUrl: String,
      invoiceDate: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
