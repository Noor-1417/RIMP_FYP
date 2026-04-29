const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const paymentController = require('./controllers/paymentController');

// Connect to MongoDB
const dbPromise = connectDB();

// Initialize express app
const app = express();

// Middleware to ensure DB connection before any request
app.use(async (req, res, next) => {
  try {
    await dbPromise;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
  }
});

// Temporary route to seed admin user in the cloud database
app.get('/api/seed-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.json({ success: true, message: 'Admin already exists' });
    }
    
    const admin = new User({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@rimp.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin'
    });
    
    await admin.save();
    res.json({ success: true, message: 'Admin user created successfully in the cloud database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Stripe webhook endpoint (requires raw body). Place before json body parser to preserve raw body.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const quizRoutes = require('./routes/quizRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const storageRoutes = require('./routes/storageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const internshipTaskRoutes = require('./routes/internshipTaskRoutes');
// ── Groq AI Integration routes (added without breaking existing routes) ──
const groqTaskRoutes = require('./routes/groqTaskRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { protect } = require('./middleware/auth');
const internshipTaskController = require('./controllers/internshipTaskController');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/internship-tasks', internshipTaskRoutes);
// ── Groq AI Integration routes ──
app.use('/api/groq-tasks', groqTaskRoutes);      // POST /generate · GET /student · GET /:taskId
app.use('/api/submissions', submissionRoutes);   // POST /:taskId/submit · GET /student
app.use('/api/chat', chatRoutes);                // POST /mentor

// Student weekly progress route (separate path per spec)
app.get('/api/student/weekly-progress', protect, internshipTaskController.getWeeklyProgress);

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
 
