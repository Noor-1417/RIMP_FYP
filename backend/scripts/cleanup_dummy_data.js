const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Submission = require('../src/models/Submission');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rimp';

const cleanup = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Dummy emails from seed.js end with @example.com
    const dummyEmails = [
      'ahmed.hassan@example.com',
      'fatima.ali@example.com',
      'mohammad.khan@example.com',
      'mariam.ibrahim@example.com',
      'omar.ahmed@example.com',
      'layla.mohamed@example.com'
    ];

    console.log('🗑️ Deleting dummy students...');

    // Find the dummy users
    const dummyUsers = await User.find({ email: { $in: dummyEmails } });
    const dummyUserIds = dummyUsers.map(u => u._id);

    if (dummyUserIds.length > 0) {
      // Delete their enrollments
      await Enrollment.deleteMany({ intern: { $in: dummyUserIds } });
      console.log(`✓ Deleted ${dummyUserIds.length} sets of enrollments`);

      // Delete their submissions
      await Submission.deleteMany({ student: { $in: dummyUserIds } });
      console.log('✓ Deleted associated submissions');

      // Delete the users
      const result = await User.deleteMany({ _id: { $in: dummyUserIds } });
      console.log(`✓ Deleted ${result.deletedCount} dummy students`);
    } else {
      console.log('ℹ No dummy students found matching the seed list.');
    }

    // Also delete any user with @example.com domain just in case
    const domainResult = await User.deleteMany({ email: { $regex: /@example\.com$/ }, role: 'intern' });
    if (domainResult.deletedCount > 0) {
        console.log(`✓ Deleted ${domainResult.deletedCount} additional students with @example.com domain`);
    }

    console.log('\n✅ Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

cleanup();
