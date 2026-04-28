const User = require('../models/User');
const StudentApplication = require('../models/StudentApplication');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Create user
    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'intern',
      isVerified: false,
    });

    // Automatically start free trial for new users
    user.startFreeTrial();
    await user.save();

    const token = generateToken(user);

    // New users should complete CV first — send frontend to CV builder
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Free trial started!',
      token,
      user: user.getPublicProfile(),
      redirectTo: 'cv-builder',
      subscription: {
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        trialDays: 7,
        message: 'You have 7 days of free trial. Upgrade to premium to unlock all features!',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    // Determine redirect for student users based on whether they have submitted a CV
    let redirectTo = 'intern-dashboard';
    if (user.role === 'intern') {
      const app = await StudentApplication.findOne({ user: user._id });
      redirectTo = app ? 'intern-dashboard' : 'cv-builder';
    } else if (user.role === 'admin') {
      // Direct admins to the admin dashboard route
      redirectTo = 'admin-dashboard';
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
      redirectTo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      bio,
      profileImage,
      company,
      department,
      internshipTitle,
      skills,
      field,
      interest,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        bio,
        profileImage,
        company,
        department,
        internshipTitle,
        skills,
        field,
        interest,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Generate internship recommendations based on profile
// @route   POST /api/auth/generate-internship
// @access  Private
exports.generateInternshipRecommendation = async (req, res, next) => {
  try {
    const { skills, field, interest } = req.body;

    // Validate input
    if (!skills || !field || !interest) {
      return res.status(400).json({
        success: false,
        message: 'Please provide skills, field, and interest',
      });
    }

    // Get current user for context
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user profile with latest data
    user.skills = skills;
    user.field = field;
    user.interest = interest;
    await user.save();

    // Prepare prompt for AI to generate internship recommendations
    const prompt = `
Based on the following student profile, generate 3-4 personalized internship opportunities and recommendations:

Student Profile:
- Name: ${user.firstName} ${user.lastName}
- Technical Skills: ${skills.technical || 'Not specified'}
- Soft Skills: ${skills.soft || 'Not specified'}
- Field of Interest: ${field}
- Learning Interest: ${interest}
- Current Title/Role: ${user.internshipTitle || 'Not specified'}
- Department: ${user.department || 'Not specified'}

Please provide:
1. 3-4 specific internship recommendations with company types and focus areas
2. Skills development suggestions
3. Learning path recommendations
4. Tips for application success

Format the response as structured JSON with fields: recommendations (array), skillSuggestions (array), learningPath (string), applicationTips (array)
    `;

    // For now, return a structured response that demonstrates the AI integration capability
    // In production, this would call an AI service (OpenAI, Claude, etc.)
    const recommendations = {
      success: true,
      message: 'Internship recommendations generated successfully',
      data: {
        recommendations: [
          {
            title: 'Software Engineering Intern',
            company: 'Tech Companies',
            focus: field,
            description: `Focus on ${interest} with emphasis on ${skills.technical || 'core fundamentals'}`,
            skillMatch: 85,
          },
          {
            title: 'Full Stack Development Intern',
            company: 'Startups',
            focus: 'Web Development',
            description: `Build projects using skills in ${skills.technical || 'modern tech stack'}`,
            skillMatch: 78,
          },
          {
            title: 'Product Development Intern',
            company: 'Product Companies',
            focus: 'Innovation',
            description: `Apply ${interest} and soft skills like ${skills.soft || 'collaboration'}`,
            skillMatch: 72,
          },
        ],
        skillSuggestions: [
          `Deepen expertise in ${skills.technical?.split(',')[0] || 'primary technical skill'}`,
          `Develop ${skills.soft?.split(',')[0] || 'communication'} skills`,
          `Learn emerging technologies in ${field}`,
          `Build a portfolio project in ${interest}`,
        ],
        learningPath: `1. Foundation: Master core concepts in ${field} | 2. Specialization: Focus on ${interest} | 3. Application: Build real projects | 4. Internship: Apply learnings in professional setting`,
        applicationTips: [
          'Highlight projects that demonstrate your skills in the recommended areas',
          'Show enthusiasm for the specific field and internship focus',
          'Prepare examples of how your soft skills contribute to team success',
          'Research companies and tailor your applications to their specific needs',
        ],
      },
    };

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Generate internship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate internship recommendations',
    });
  }
};
