const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../src/models/User');
const InternshipCategory = require('../src/models/InternshipCategory');
const Task = require('../src/models/Task');
const Enrollment = require('../src/models/Enrollment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rimp';

const categories = [
  {
    name: 'Web Development',
    description: 'Learn full-stack web development with React, Node.js, and MongoDB',
    industry: 'Technology',
    duration: 12,
    difficulty: 'intermediate',
    price: 0,
    pricePerWeek: 5,
    freeDurationWeeks: 2,
    capacity: 50,
  },
  {
    name: 'Mobile Development',
    description: 'Build mobile apps with React Native and Flutter',
    industry: 'Technology',
    duration: 10,
    difficulty: 'intermediate',
    price: 0,
    pricePerWeek: 5,
    freeDurationWeeks: 2,
    capacity: 40,
  },
  {
    name: 'Data Science',
    description: 'Master data analysis, machine learning, and visualization',
    industry: 'Technology',
    duration: 16,
    difficulty: 'advanced',
    price: 0,
    pricePerWeek: 7,
    freeDurationWeeks: 2,
    capacity: 30,
  },
  {
    name: 'UI/UX Design',
    description: 'Design beautiful and user-friendly interfaces',
    industry: 'Design',
    duration: 8,
    difficulty: 'beginner',
    price: 0,
    pricePerWeek: 4,
    freeDurationWeeks: 2,
    capacity: 35,
  },
  {
    name: 'Cloud & DevOps',
    description: 'Learn AWS, Docker, Kubernetes, and CI/CD pipelines',
    industry: 'Technology',
    duration: 10,
    difficulty: 'advanced',
    price: 0,
    pricePerWeek: 6,
    freeDurationWeeks: 2,
    capacity: 25,
  },
];

const tasksByCategory = {
  'Web Development': [
    {
      title: 'Build a Personal Portfolio Website',
      description: 'Create a responsive portfolio website showcasing your projects using React and TailwindCSS',
      priority: 'high',
      week: 1,
      points: 50,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    },
    {
      title: 'REST API Authentication System',
      description: 'Implement JWT-based authentication and authorization in Express.js with password hashing',
      priority: 'critical',
      week: 2,
      points: 75,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Database Design & Optimization',
      description: 'Design a MongoDB schema for an e-commerce platform with proper indexing and relationships',
      priority: 'high',
      week: 3,
      points: 60,
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Real-time Chat Application',
      description: 'Build a chat application with WebSockets using Socket.io and React',
      priority: 'medium',
      week: 4,
      points: 85,
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Payment Integration',
      description: 'Integrate Stripe payment gateway into an e-commerce application',
      priority: 'high',
      week: 5,
      points: 70,
      dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    },
  ],
  'Mobile Development': [
    {
      title: 'Native iOS Weather App',
      description: 'Build a weather application for iOS using Swift and WeatherAPI',
      priority: 'medium',
      week: 1,
      points: 55,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Android Todo List with Local Storage',
      description: 'Create a todo list app with local database using Room and Android Jetpack',
      priority: 'high',
      week: 2,
      points: 65,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Cross-platform App with React Native',
      description: 'Develop a fitness tracking app using React Native and Firebase',
      priority: 'critical',
      week: 3,
      points: 80,
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Mobile Payment Integration',
      description: 'Implement in-app purchases and payment processing for mobile apps',
      priority: 'high',
      week: 4,
      points: 70,
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
  ],
  'Data Science': [
    {
      title: 'Data Analysis with Pandas',
      description: 'Analyze a real dataset using Pandas, NumPy, and create visualizations',
      priority: 'high',
      week: 1,
      points: 60,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Machine Learning Model Development',
      description: 'Build and train a classification model using scikit-learn on the Iris dataset',
      priority: 'critical',
      week: 2,
      points: 85,
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Time Series Forecasting',
      description: 'Implement ARIMA model for stock price prediction using historical data',
      priority: 'high',
      week: 3,
      points: 90,
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Natural Language Processing',
      description: 'Build a sentiment analysis model using NLTK and analyze Twitter data',
      priority: 'high',
      week: 4,
      points: 75,
      dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    },
  ],
  'UI/UX Design': [
    {
      title: 'Website Wireframing & Prototyping',
      description: 'Create wireframes and interactive prototypes for a mobile banking app using Figma',
      priority: 'high',
      week: 1,
      points: 50,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Design System Creation',
      description: 'Build a comprehensive design system with components, colors, and typography',
      priority: 'medium',
      week: 2,
      points: 70,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'User Research & Persona Development',
      description: 'Conduct user interviews and create detailed user personas for a SaaS product',
      priority: 'high',
      week: 3,
      points: 60,
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
  ],
  'Cloud & DevOps': [
    {
      title: 'Docker Containerization',
      description: 'Containerize a full-stack application with Docker and docker-compose',
      priority: 'high',
      week: 1,
      points: 70,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'AWS Lambda & Serverless',
      description: 'Deploy serverless functions on AWS Lambda with API Gateway integration',
      priority: 'critical',
      week: 2,
      points: 85,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Kubernetes Deployment',
      description: 'Deploy and manage containerized applications on Kubernetes cluster',
      priority: 'critical',
      week: 3,
      points: 95,
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'CI/CD Pipeline Setup',
      description: 'Create automated CI/CD pipelines using GitHub Actions and Jenkins',
      priority: 'high',
      week: 4,
      points: 80,
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
  ],
};

const studentData = [
  {
    firstName: 'Ahmed',
    lastName: 'Hassan',
    email: 'ahmed.hassan@example.com',
    password: 'password123',
    category: 'Web Development',
  },
  {
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'fatima.ali@example.com',
    password: 'password123',
    category: 'Mobile Development',
  },
  {
    firstName: 'Mohammad',
    lastName: 'Khan',
    email: 'mohammad.khan@example.com',
    password: 'password123',
    category: 'Data Science',
  },
  {
    firstName: 'Mariam',
    lastName: 'Ibrahim',
    email: 'mariam.ibrahim@example.com',
    password: 'password123',
    category: 'UI/UX Design',
  },
  {
    firstName: 'Omar',
    lastName: 'Ahmed',
    email: 'omar.ahmed@example.com',
    password: 'password123',
    category: 'Cloud & DevOps',
  },
  {
    firstName: 'Layla',
    lastName: 'Mohamed',
    email: 'layla.mohamed@example.com',
    password: 'password123',
    category: 'Web Development',
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing data (optional, comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await InternshipCategory.deleteMany({});
    // await Task.deleteMany({});
    // await Enrollment.deleteMany({});
    // console.log('✓ Cleared existing data');

    // Seed Categories
    console.log('\n📚 Seeding Categories...');
    const createdCategories = await InternshipCategory.insertMany(categories, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some categories already exist, skipping duplicates');
        return InternshipCategory.find({});
      }
      throw err;
    });
    console.log(`✓ Created/found ${createdCategories.length} categories`);

    // Seed Tasks
    console.log('\n📋 Seeding Tasks...');
    let taskCount = 0;
    for (const category of createdCategories) {
      const categoryTasks = tasksByCategory[category.name] || [];
      for (const task of categoryTasks) {
        try {
          await Task.create({
            ...task,
            category: category._id,
            submissions: [],
          });
          taskCount++;
        } catch (err) {
          if (err.code !== 11000) {
            console.error(`Error creating task: ${err.message}`);
          }
        }
      }
    }
    console.log(`✓ Created ${taskCount} tasks`);

    // Seed Students
    console.log('\n👥 Seeding Students...');
    let studentCount = 0;
    for (const student of studentData) {
      try {
        const category = createdCategories.find(c => c.name === student.category);
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: student.email });
        if (existingUser) {
          console.log(`⚠️  User ${student.email} already exists, skipping`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(student.password, 10);

        // Create user
        const newUser = await User.create({
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          password: hashedPassword,
          role: 'intern',
          enrollmentDate: new Date(),
          isActive: true,
          stats: {
            tasksCompleted: 0,
            tasksInProgress: 0,
            averageScore: 0,
          },
        });

        // Create enrollment
        if (category) {
          await Enrollment.create({
            intern: newUser._id,
            category: category._id,
            status: 'active',
            enrollmentDate: new Date(),
            progress: 0,
          });
        }

        studentCount++;
        console.log(`✓ Created student: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
      } catch (err) {
        console.error(`Error creating student: ${err.message}`);
      }
    }
    console.log(`✓ Created ${studentCount} students`);

    // Seed default settings
    try {
      const Settings = require('../src/models/Settings');
      const existingSettings = await Settings.findOne();
      if (!existingSettings) {
        await Settings.create({
          siteName: 'RIMP',
          maintenanceMode: false,
          version: '1.0',
          contactEmail: '',
          supportUrl: '',
          features: { exports: true, announcements: true, dripScheduling: false },
        });
        console.log('✓ Created default settings');
      } else {
        console.log('✓ Settings already exist, skipping');
      }
    } catch (err) {
      console.error('Error seeding settings:', err.message || err);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🔑 Sample Login Credentials:');
    console.log('Email: ahmed.hassan@example.com, Password: password123');
    console.log('Email: fatima.ali@example.com, Password: password123');
    console.log('Email: mohammad.khan@example.com, Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
