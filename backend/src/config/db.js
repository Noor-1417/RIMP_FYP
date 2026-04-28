const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI env names for flexibility
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rimp';

    console.log('Attempting to connect to MongoDB...');

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('⚠️  Make sure MongoDB is running locally or provide a valid MONGO_URI in backend/.env');
    // Don't crash - let the server start so we can see the error in API responses
    // process.exit(1);
  }
};

module.exports = connectDB;
