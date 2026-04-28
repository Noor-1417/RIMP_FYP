/**
 * Seed script — adds more internship categories
 * Run: node backend/scripts/seedCategories.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const InternshipCategory = require('../src/models/InternshipCategory');
const User = require('../src/models/User');

const CATEGORIES = [
  {
    name: 'Web Development',
    description: 'Build modern, responsive web applications using HTML, CSS, JavaScript, React, and Node.js. Learn full-stack development from scratch to deployment.',
    icon: '💻',
    color: '#3b82f6',
    industry: 'Technology',
    difficulty: 'beginner',
    duration: 8,
    freeDurationWeeks: 2,
    pricePerWeek: 5,
    capacity: 50,
    topics: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'REST APIs', 'Git'],
    learningOutcomes: [
      'Build responsive UIs with React',
      'Create RESTful APIs with Node.js & Express',
      'Deploy full-stack applications',
      'Understand Git version control',
    ],
  },
  {
    name: 'Data Science & Analytics',
    description: 'Master data analysis, visualization, and machine learning with Python, Pandas, and Scikit-learn. Work on real-world datasets and build predictive models.',
    icon: '📊',
    color: '#8b5cf6',
    industry: 'Data Science',
    difficulty: 'intermediate',
    duration: 10,
    freeDurationWeeks: 2,
    pricePerWeek: 7,
    capacity: 40,
    topics: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn', 'SQL'],
    learningOutcomes: [
      'Perform exploratory data analysis',
      'Build and evaluate ML models',
      'Create insightful data visualizations',
      'Write clean, efficient Python code',
    ],
  },
  {
    name: 'UI/UX Design',
    description: 'Design beautiful, user-centered digital products. Learn Figma, design systems, wireframing, prototyping, and usability testing principles.',
    icon: '🎨',
    color: '#ec4899',
    industry: 'Design',
    difficulty: 'beginner',
    duration: 6,
    freeDurationWeeks: 2,
    pricePerWeek: 5,
    capacity: 35,
    topics: ['Figma', 'Design Systems', 'Wireframing', 'Prototyping', 'User Research', 'Accessibility'],
    learningOutcomes: [
      'Create professional UI designs in Figma',
      'Conduct user research and usability tests',
      'Build reusable design systems',
      'Apply UX principles to real projects',
    ],
  },
  {
    name: 'Mobile App Development',
    description: 'Build cross-platform mobile applications using React Native. Deploy to both iOS and Android from a single codebase with real device testing.',
    icon: '📱',
    color: '#06b6d4',
    industry: 'Technology',
    difficulty: 'intermediate',
    duration: 8,
    freeDurationWeeks: 2,
    pricePerWeek: 6,
    capacity: 30,
    topics: ['React Native', 'Expo', 'Firebase', 'Redux', 'REST APIs', 'App Store Deployment'],
    learningOutcomes: [
      'Build cross-platform mobile apps',
      'Integrate Firebase for auth and database',
      'Manage state with Redux',
      'Publish to Google Play & App Store',
    ],
  },
  {
    name: 'Cybersecurity',
    description: 'Learn ethical hacking, network security, penetration testing, and how to protect systems from cyber threats. Hands-on labs with real-world scenarios.',
    icon: '🔐',
    color: '#ef4444',
    industry: 'Security',
    difficulty: 'advanced',
    duration: 12,
    freeDurationWeeks: 2,
    pricePerWeek: 10,
    capacity: 20,
    topics: ['Network Security', 'Penetration Testing', 'OWASP Top 10', 'Kali Linux', 'Cryptography', 'Incident Response'],
    learningOutcomes: [
      'Perform ethical penetration testing',
      'Identify and fix OWASP vulnerabilities',
      'Configure secure network infrastructure',
      'Respond to security incidents',
    ],
  },
  {
    name: 'Digital Marketing',
    description: 'Master SEO, social media marketing, Google Ads, content strategy, and analytics. Build and execute real digital marketing campaigns.',
    icon: '📣',
    color: '#f59e0b',
    industry: 'Marketing',
    difficulty: 'beginner',
    duration: 6,
    freeDurationWeeks: 2,
    pricePerWeek: 4,
    capacity: 45,
    topics: ['SEO', 'Google Ads', 'Social Media', 'Email Marketing', 'Analytics', 'Content Strategy'],
    learningOutcomes: [
      'Run effective Google and Meta ad campaigns',
      'Optimize websites for search engines',
      'Analyze campaign performance with GA4',
      'Create data-driven content strategies',
    ],
  },
  {
    name: 'Cloud Computing (AWS)',
    description: 'Get hands-on with AWS services — EC2, S3, Lambda, RDS, and more. Learn to architect, deploy, and scale cloud-native applications.',
    icon: '☁️',
    color: '#f97316',
    industry: 'Technology',
    difficulty: 'intermediate',
    duration: 10,
    freeDurationWeeks: 2,
    pricePerWeek: 8,
    capacity: 25,
    topics: ['EC2', 'S3', 'Lambda', 'RDS', 'CloudFormation', 'IAM', 'Docker', 'CI/CD'],
    learningOutcomes: [
      'Deploy scalable applications on AWS',
      'Architect cloud-native solutions',
      'Implement security best practices on AWS',
      'Set up CI/CD pipelines',
    ],
  },
  {
    name: 'Artificial Intelligence & ML',
    description: 'Dive deep into machine learning, deep learning, NLP, and computer vision with TensorFlow and PyTorch. Build AI models and deploy them to production.',
    icon: '🤖',
    color: '#10b981',
    industry: 'AI/ML',
    difficulty: 'advanced',
    duration: 12,
    freeDurationWeeks: 2,
    pricePerWeek: 10,
    capacity: 20,
    topics: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Model Deployment'],
    learningOutcomes: [
      'Build and train deep neural networks',
      'Implement NLP and computer vision models',
      'Deploy AI models to production APIs',
      'Fine-tune large language models',
    ],
  },
  {
    name: 'Graphic Design',
    description: 'Master Adobe Photoshop, Illustrator, and Canva to create stunning visual content for brands, marketing, and social media.',
    icon: '🖌️',
    color: '#d946ef',
    industry: 'Design',
    difficulty: 'beginner',
    duration: 6,
    freeDurationWeeks: 2,
    pricePerWeek: 4,
    capacity: 40,
    topics: ['Photoshop', 'Illustrator', 'Canva', 'Typography', 'Brand Identity', 'Print Design'],
    learningOutcomes: [
      'Create professional brand identities',
      'Design marketing materials and social content',
      'Master Photoshop retouching techniques',
      'Build a professional design portfolio',
    ],
  },
  {
    name: 'Business Analysis',
    description: 'Learn to bridge the gap between business needs and technical solutions. Master requirements gathering, process modeling, and stakeholder management.',
    icon: '📈',
    color: '#0A3D62',
    industry: 'Business',
    difficulty: 'intermediate',
    duration: 8,
    freeDurationWeeks: 2,
    pricePerWeek: 6,
    capacity: 30,
    topics: ['Requirements Analysis', 'BPMN', 'Agile/Scrum', 'Use Cases', 'Stakeholder Management', 'JIRA'],
    learningOutcomes: [
      'Gather and document business requirements',
      'Model business processes with BPMN',
      'Work effectively in Agile teams',
      'Produce professional BA deliverables',
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ MongoDB connected');

    // Find an admin user to assign as manager
    const admin = await User.findOne({ role: 'admin' });
    const managerId = admin?._id || null;

    let added = 0, skipped = 0;

    for (const cat of CATEGORIES) {
      const exists = await InternshipCategory.findOne({ name: cat.name });
      if (exists) {
        console.log(`⏭  Skipped (exists): ${cat.name}`);
        skipped++;
        continue;
      }
      await InternshipCategory.create({
        ...cat,
        manager: managerId,
        isActive: true,
        enrolledCount: 0,
      });
      console.log(`✅ Added: ${cat.icon} ${cat.name}`);
      added++;
    }

    console.log(`\n📊 Done — ${added} added, ${skipped} skipped`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
