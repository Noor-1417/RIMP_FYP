const mongoose = require('mongoose');

const StudentApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    title: String,
    summary: String,
    education: [
      {
        degree: String,
        institution: String,
        year: String,
        gpa: String,
      },
    ],
    experience: [
      {
        company: String,
        role: String,
        start: String,
        end: String,
        description: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
      },
    ],
    skills: {
      technical: String,
      soft: String,
    },
    downloadLink: String,
    status: {
      type: String,
      enum: ['New Intern Request', 'Pending', 'Approved', 'Rejected'],
      default: 'New Intern Request',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentApplication', StudentApplicationSchema);
