# RIMP Backend - Database Seeding Guide

## Overview
The seed script populates the MongoDB database with sample data for development and testing purposes. It includes:
- **5 Internship Categories** (Web Dev, Mobile Dev, Data Science, UI/UX, Cloud & DevOps)
- **20+ Sample Tasks** distributed across categories with varying priorities and due dates
- **6 Student Users** pre-enrolled in different categories

## Prerequisites
- MongoDB running and accessible
- Backend dependencies installed (`npm install`)
- `.env` file configured with `MONGO_URI`

## Running the Seed Script

### Option 1: Run from Backend Directory
```bash
cd backend
npm run seed
```

### Option 2: Run Directly with Node
```bash
cd backend
node scripts/seed.js
```

## What Gets Seeded

### Categories
- **Web Development** — Full-stack web development with React, Node.js, MongoDB (12 weeks, Intermediate)
- **Mobile Development** — Mobile apps with React Native & Flutter (10 weeks, Intermediate)
- **Data Science** — Data analysis & ML (16 weeks, Advanced)
- **UI/UX Design** — Interface & experience design (8 weeks, Beginner)
- **Cloud & DevOps** — AWS, Docker, Kubernetes (10 weeks, Advanced)

### Sample Tasks Per Category
Each category receives 4-5 tasks with:
- Realistic project descriptions
- Varying priorities (low, medium, high, critical)
- Week numbers (1-4)
- Point values (50-95)
- Due dates (14-42 days from seeding)

### Sample Students
| First Name | Last Name | Email | Category | Password |
|-----------|----------|-------|----------|----------|
| Ahmed | Hassan | ahmed.hassan@example.com | Web Development | password123 |
| Fatima | Ali | fatima.ali@example.com | Mobile Development | password123 |
| Mohammad | Khan | mohammad.khan@example.com | Data Science | password123 |
| Mariam | Ibrahim | mariam.ibrahim@example.com | UI/UX Design | password123 |
| Omar | Ahmed | omar.ahmed@example.com | Cloud & DevOps | password123 |
| Layla | Mohamed | layla.mohamed@example.com | Web Development | password123 |

## Expected Output

```
✓ Connected to MongoDB

📚 Seeding Categories...
✓ Created/found 5 categories

📋 Seeding Tasks...
✓ Created 20 tasks

👥 Seeding Students...
✓ Created student: Ahmed Hassan (ahmed.hassan@example.com)
✓ Created student: Fatima Ali (fatima.ali@example.com)
...
✓ Created 6 students

✅ Database seeding completed successfully!

🔑 Sample Login Credentials:
Email: ahmed.hassan@example.com, Password: password123
Email: fatima.ali@example.com, Password: password123
...
```

## Important Notes

### Duplicate Handling
- The script gracefully handles duplicate entries
- If a category/task/user already exists (checked by unique fields), it skips that entry
- Use this to re-run the seed script safely without clearing the database

### Clearing Data (Optional)
To start fresh, uncomment these lines in `backend/scripts/seed.js` before running:
```javascript
await User.deleteMany({});
await InternshipCategory.deleteMany({});
await Task.deleteMany({});
await Enrollment.deleteMany({});
```

⚠️ **Warning**: This will delete ALL data, including any existing users or tasks.

### Testing the Seed Data

Once seeded, test with these sample accounts:

**Web Development Student:**
- Email: `ahmed.hassan@example.com`
- Password: `password123`

**Data Science Student:**
- Email: `mohammad.khan@example.com`
- Password: `password123`

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running. Start with: `mongod` or use MongoDB Atlas

### Duplicate Key Error
```
MongoError: E11000 duplicate key error
```
**Solution**: Run seed again (duplicates are skipped) or clear the database first

### Missing Enrollment Model
```
Error: Cannot find module '../src/models/Enrollment'
```
**Solution**: Ensure all models are properly defined in `src/models/`

## Integration with Frontend

After seeding, use any of the student accounts above to:
1. Log in to the platform
2. View assigned tasks
3. Submit task solutions
4. View progress dashboard

## Seed Data Schema

### User (Student)
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  password: String (hashed),
  role: "intern",
  enrollmentDate: Date,
  isActive: true,
  stats: {
    tasksCompleted: 0,
    tasksInProgress: 0,
    averageScore: 0
  }
}
```

### Enrollment
```javascript
{
  intern: ObjectId (User),
  category: ObjectId (InternshipCategory),
  status: "active",
  enrollmentDate: Date,
  progress: 0
}
```

### Task
```javascript
{
  title: String,
  description: String,
  categoryId: ObjectId,
  priority: "low|medium|high|critical",
  week: Number,
  points: Number,
  dueDate: Date,
  submissions: []
}
```

## Next Steps

1. **After seeding**, start the development server: `npm run dev`
2. **Log in** with one of the sample student accounts
3. **Verify** tasks appear in the admin dashboard
4. **Test** admin CRUD operations (create, edit, delete categories/tasks)
5. **Submit** a task solution to test the submission workflow

---

For more information, see the main [Backend Setup Guide](./SETUP.md)
