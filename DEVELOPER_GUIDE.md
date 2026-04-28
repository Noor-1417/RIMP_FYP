# Developer Guide: Profile Form & AI Integration

## Backend Implementation Details

### User Model Schema (Mongoose)

```javascript
// Added to userSchema in models/User.js
skills: {
  technical: String,      // e.g., "React, Node.js, Python, Express"
  soft: String           // e.g., "Leadership, Communication, Teamwork"
},
field: String,           // e.g., "Web Development"
interest: String,        // e.g., "Building scalable web apps and learning cloud technologies"
```

### Controller Methods

#### 1. Update Profile (Enhanced)

**File:** `backend/src/controllers/authController.js`

```javascript
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
      skills,           // NEW
      field,            // NEW
      interest,         // NEW
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
```

#### 2. Generate Internship Recommendations (New)

**File:** `backend/src/controllers/authController.js`

```javascript
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

    // TODO: Send to AI service for real recommendations
    // For now, returning structured mock data

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
```

### Routes

**File:** `backend/src/routes/authRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout,
  generateInternshipRecommendation,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/generate-internship', protect, generateInternshipRecommendation);
router.get('/logout', protect, logout);

module.exports = router;
```

---

## Frontend Implementation Details

### ProfilePage Component

**File:** `frontend/src/pages/ProfilePage.jsx`

#### Key Features:

1. **State Management with React Hooks**

```javascript
const [form, setForm] = useState({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  profileImage: '',
  company: '',
  department: '',
  internshipTitle: '',
  skills: { technical: '', soft: '' },
  field: '',
  interest: '',
});

const [saving, setSaving] = useState(false);
const [generating, setGenerating] = useState(false);
const [errors, setErrors] = useState({});
const [recommendations, setRecommendations] = useState(null);
```

2. **Controlled Input Handling**

```javascript
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
  // Clear error when user starts typing
  if (errors[name]) {
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  }
};

const handleSkillsChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => ({
    ...prev,
    skills: {
      ...prev.skills,
      [name]: value,
    },
  }));
};
```

3. **Form Validation**

```javascript
const validateForm = () => {
  const newErrors = {};

  if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
  if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
  if (!form.email.trim()) newErrors.email = 'Email is required';
  if (!form.field.trim()) newErrors.field = 'Field of interest is required';
  if (!form.interest.trim()) newErrors.interest = 'Learning interest is required';
  if (!form.skills.technical.trim() && !form.skills.soft.trim()) {
    newErrors.skills = 'Please add at least one skill (technical or soft)';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

4. **Save Profile**

```javascript
const handleSaveProfile = async () => {
  if (!validateForm()) {
    toast.error('Please fix the errors in your form');
    return;
  }

  try {
    setSaving(true);
    const res = await authService.updateProfile(form);
    
    if (res.data?.success) {
      const updated = res.data.user;
      setUser(updated, localStorage.getItem('token'));
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('✓ Profile updated successfully!');
    } else {
      toast.error(res.data?.message || 'Failed to update profile');
    }
  } catch (err) {
    console.error('Profile save error:', err);
    toast.error(err.response?.data?.message || 'Error updating profile');
  } finally {
    setSaving(false);
  }
};
```

5. **Generate Recommendations**

```javascript
const handleGenerateRecommendations = async () => {
  if (!validateForm()) {
    toast.error('Please complete all required fields first');
    return;
  }

  try {
    setGenerating(true);
    const payload = {
      skills: form.skills,
      field: form.field,
      interest: form.interest,
    };

    const res = await authService.generateInternship(payload);

    if (res.data?.success) {
      setRecommendations(res.data.data);
      toast.success('✓ Recommendations generated!');
    } else {
      toast.error(res.data?.message || 'Failed to generate recommendations');
    }
  } catch (err) {
    console.error('Generate recommendations error:', err);
    toast.error(err.response?.data?.message || 'Error generating recommendations');
  } finally {
    setGenerating(false);
  }
};
```

### Services

**File:** `frontend/src/services/index.js`

```javascript
// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  generateInternship: (data) => api.post('/auth/generate-internship', data),
  logout: () => api.get('/auth/logout'),
};
```

---

## Integrating Real AI Services

### Option 1: OpenAI Integration

**File:** `backend/src/services/aiService.js`

```javascript
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateInternshipRecommendations(studentProfile) {
  const prompt = `
    You are a career counselor. Based on the following student's profile, 
    provide personalized internship recommendations in JSON format.
    
    Student Profile:
    - Skills (Technical): ${studentProfile.skills.technical}
    - Skills (Soft): ${studentProfile.skills.soft}
    - Field of Interest: ${studentProfile.field}
    - Learning Interests: ${studentProfile.interest}
    
    Please provide:
    1. 3-4 specific internship recommendations (with title, company type, description, skillMatch percentage)
    2. 3-4 skill development suggestions
    3. A clear learning path
    4. 4-5 application tips
    
    Format as JSON: { 
      recommendations: [], 
      skillSuggestions: [], 
      learningPath: "", 
      applicationTips: [] 
    }
  `;

  const response = await client.chat.completions.create({
    model: 'gpt-4', // or 'gpt-3.5-turbo'
    messages: [
      {
        role: 'system',
        content: 'You are a helpful career guidance AI that provides personalized internship recommendations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

module.exports = {
  generateInternshipRecommendations,
};
```

**Update Controller to Use AI:**

```javascript
// In authController.js generateInternshipRecommendation method
const aiService = require('../services/aiService');

// Replace the mock return with:
const aiRecommendations = await aiService.generateInternshipRecommendations({
  skills,
  field,
  interest,
});

return res.status(200).json({
  success: true,
  message: 'AI-generated internship recommendations',
  data: aiRecommendations,
});
```

### Option 2: Claude (Anthropic) Integration

**File:** `backend/src/services/aiService.js`

```javascript
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateInternshipRecommendations(studentProfile) {
  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `
          As a career counselor, provide internship recommendations for:
          Technical Skills: ${studentProfile.skills.technical}
          Soft Skills: ${studentProfile.skills.soft}
          Field: ${studentProfile.field}
          Interests: ${studentProfile.interest}
          
          Return JSON: { recommendations, skillSuggestions, learningPath, applicationTips }
        `,
      },
    ],
  });

  const content = message.content[0].text;
  return JSON.parse(content);
}
```

---

## Testing Examples

### cURL Tests

```bash
# Save Profile
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "skills": {
      "technical": "React, Node.js, Python",
      "soft": "Leadership, Communication"
    },
    "field": "Web Development",
    "interest": "Building scalable web applications"
  }'

# Generate Recommendations
curl -X POST http://localhost:5000/api/auth/generate-internship \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": {
      "technical": "React, Node.js, Python",
      "soft": "Leadership"
    },
    "field": "Web Development",
    "interest": "Scalable apps"
  }'
```

### JavaScript Tests

```javascript
// Test with fetch
const token = localStorage.getItem('token');

// Save profile
fetch('/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    skills: { technical: 'React', soft: 'Leadership' },
    field: 'Web Development',
    interest: 'Learning'
  })
})
.then(r => r.json())
.then(data => console.log('Profile saved:', data));
```

---

## Performance Optimization

### Caching Recommendations

```javascript
// Add to User Schema
lastRecommendations: {
  data: Object,
  generatedAt: Date,
}

// In controller - check cache
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

if (
  user.lastRecommendations?.generatedAt &&
  Date.now() - user.lastRecommendations.generatedAt < CACHE_DURATION
) {
  return res.status(200).json({
    success: true,
    data: user.lastRecommendations.data,
    cached: true,
  });
}
```

---

## Error Handling Best Practices

```javascript
try {
  // Validation
  if (!skills || !field || !interest) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      fields: ['skills', 'field', 'interest'],
    });
  }

  // Database operations
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // AI Service calls
  const recommendations = await aiService.generate(data);
  if (!recommendations) {
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }

  // Success response
  return res.status(200).json({
    success: true,
    data: recommendations,
  });
} catch (error) {
  console.error('Error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
```

---

## Future Enhancements

1. **Recommendation Versioning** - Track all recommendations history
2. **ML-based Matching** - Use ML to match skills to internship descriptions
3. **Real-time Updates** - Push notifications when new internship matches
4. **Skill Verification** - Quiz-based skill assessment
5. **Analytics Dashboard** - Track recommendation effectiveness
6. **A/B Testing** - Test different recommendation strategies

