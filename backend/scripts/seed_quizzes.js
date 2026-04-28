const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Quiz = require('../src/models/Quiz');
const InternshipCategory = require('../src/models/InternshipCategory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rimp';

const quizzes = [
  {
    categoryName: 'Web Development',
    title: 'Modern Web Architecture Quiz',
    description: 'Conceptual quiz on React, Node.js and RESTful APIs',
    week: 1,
    questions: [
      {
        question: 'What is the primary purpose of React Virtual DOM?',
        options: [
          { text: 'To replace the real DOM completely', isCorrect: false },
          { text: 'To improve performance by minimizing direct DOM manipulation', isCorrect: true },
          { text: 'To store global application state', isCorrect: false },
          { text: 'To handle HTTP requests', isCorrect: false }
        ],
        points: 25
      },
      {
        question: 'Which HTTP method is typically used to update an existing resource?',
        options: [
          { text: 'GET', isCorrect: false },
          { text: 'POST', isCorrect: false },
          { text: 'PUT', isCorrect: true },
          { text: 'DELETE', isCorrect: false }
        ],
        points: 25
      },
      {
        question: 'What does Middleware do in Express.js?',
        options: [
          { text: 'Connects to the database only', isCorrect: false },
          { text: 'Renders HTML templates', isCorrect: false },
          { text: 'Processes requests before they reach the route handler', isCorrect: true },
          { text: 'Handles CSS styling', isCorrect: false }
        ],
        points: 25
      },
      {
        question: 'In MongoDB, what is a "Collection"?',
        options: [
          { text: 'A group of related databases', isCorrect: false },
          { text: 'A group of related documents', isCorrect: true },
          { text: 'A single data field', isCorrect: false },
          { text: 'An indexing algorithm', isCorrect: false }
        ],
        points: 25
      }
    ]
  },
  {
    categoryName: 'Data Science',
    title: 'Data Science Fundamentals',
    description: 'Test your knowledge on Python for Data Science and Basic Statistics',
    week: 1,
    questions: [
      {
        question: 'Which Python library is primarily used for numerical computations?',
        options: [
          { text: 'Pandas', isCorrect: false },
          { text: 'Matplotlib', isCorrect: false },
          { text: 'NumPy', isCorrect: true },
          { text: 'Seaborn', isCorrect: false }
        ],
        points: 30
      },
      {
        question: 'What is "Overfitting" in Machine Learning?',
        options: [
          { text: 'When a model performs poorly on training data', isCorrect: false },
          { text: 'When a model performs too well on training data but poorly on new data', isCorrect: true },
          { text: 'When the dataset is too small', isCorrect: false },
          { text: 'When the model is too simple', isCorrect: false }
        ],
        points: 35
      },
      {
        question: 'Which of the following is a Supervised Learning task?',
        options: [
          { text: 'Clustering', isCorrect: false },
          { text: 'Regression', isCorrect: true },
          { text: 'Dimensionality Reduction', isCorrect: false },
          { text: 'Association Rule Learning', isCorrect: false }
        ],
        points: 35
      }
    ]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    for (const qData of quizzes) {
      const category = await InternshipCategory.findOne({ name: qData.categoryName });
      if (!category) {
        console.log(`⚠️  Category ${qData.categoryName} not found, skipping.`);
        continue;
      }

      const existing = await Quiz.findOne({ title: qData.title });
      if (existing) {
        console.log(`⚠️  Quiz "${qData.title}" already exists, skipping.`);
        continue;
      }

      await Quiz.create({
        ...qData,
        category: category._id,
        isPublished: true,
        totalPoints: qData.questions.reduce((sum, q) => sum + q.points, 0),
        timeLimit: 15,
        passingScore: 60
      });
      console.log(`✓ Created quiz: ${qData.title}`);
    }

    console.log('\n✅ Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding quizzes:', err);
    process.exit(1);
  }
};

seed();
