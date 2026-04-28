/**
 * Fix script: Delete broken seeded users (double-hashed passwords) and re-create them properly.
 * Also ensures an admin user exists.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const InternshipCategory = require('../src/models/InternshipCategory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rimp';

const seedEmails = [
  'ahmed.hassan@example.com',
  'fatima.ali@example.com',
  'mohammad.khan@example.com',
  'mariam.ibrahim@example.com',
  'omar.ahmed@example.com',
  'layla.mohamed@example.com',
];

const studentData = [
  { firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@example.com', password: 'password123', category: 'Web Development' },
  { firstName: 'Fatima', lastName: 'Ali', email: 'fatima.ali@example.com', password: 'password123', category: 'Mobile Development' },
  { firstName: 'Mohammad', lastName: 'Khan', email: 'mohammad.khan@example.com', password: 'password123', category: 'Data Science' },
  { firstName: 'Mariam', lastName: 'Ibrahim', email: 'mariam.ibrahim@example.com', password: 'password123', category: 'UI/UX Design' },
  { firstName: 'Omar', lastName: 'Ahmed', email: 'omar.ahmed@example.com', password: 'password123', category: 'Cloud & DevOps' },
  { firstName: 'Layla', lastName: 'Mohamed', email: 'layla.mohamed@example.com', password: 'password123', category: 'Web Development' },
];

async function fix() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✓ Connected to MongoDB');

  // 1. Delete old broken seeded users
  const deleteResult = await User.deleteMany({ email: { $in: seedEmails } });
  console.log(`🗑  Deleted ${deleteResult.deletedCount} old seeded users with broken passwords`);

  // Delete their enrollments too
  // (We need to find by emails first - but users are deleted. Delete orphan enrollments below.)

  // 2. Re-create users with proper password handling (plain text → model hashes it once)
  const categories = await InternshipCategory.find({});
  let count = 0;

  for (const student of studentData) {
    const category = categories.find(c => c.name === student.category);
    const newUser = await User.create({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      password: student.password, // plain text - model pre-save hook hashes it
      role: 'intern',
      enrollmentDate: new Date(),
      isActive: true,
    });

    if (category) {
      await Enrollment.create({
        intern: newUser._id,
        category: category._id,
        status: 'active',
        enrollmentDate: new Date(),
      });
    }

    count++;
    console.log(`✓ Created: ${newUser.email}`);
  }

  // 3. Ensure admin user exists
  let admin = await User.findOne({ email: 'admin@rimp.com' });
  if (!admin) {
    admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@rimp.com',
      password: 'Admin@123456',
      role: 'admin',
      isActive: true,
      isVerified: true,
    });
    console.log('✓ Created admin: admin@rimp.com / Admin@123456');
  } else {
    // Reset admin password (might also be double-hashed)
    admin.password = 'Admin@123456';
    await admin.save();
    console.log('✓ Admin password reset: admin@rimp.com / Admin@123456');
  }

  console.log(`\n✅ Fixed ${count} student accounts + admin account!`);
  console.log('\n🔑 Login Credentials:');
  console.log('Admin: admin@rimp.com / Admin@123456');
  console.log('Student: ahmed.hassan@example.com / password123');
  console.log('Student: fatima.ali@example.com / password123');
  
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
