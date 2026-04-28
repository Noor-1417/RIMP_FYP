const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'RIMP' },
    maintenanceMode: { type: Boolean, default: false },
    version: { type: String, default: '1.0' },
    contactEmail: { type: String, default: '' },
    supportUrl: { type: String, default: '' },
    features: {
      exports: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      dripScheduling: { type: Boolean, default: false },
    },
    // Free-form key/value for future flags
    flags: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Optional admin who last updated
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
