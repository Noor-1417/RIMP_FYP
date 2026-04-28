# Quick Start Guide

Get RIMP up and running in 5 minutes!

## 🎯 Quick Setup

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
# Add MongoDB URI, JWT Secret, Stripe keys, etc.
nano .env

# Start MongoDB (in another terminal)
mongod

# Run backend
npm run dev
```

✅ Backend running on `http://localhost:5000`

### 2. Frontend Setup (5 minutes)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env

# Run frontend
npm start
```

✅ Frontend running on `http://localhost:3000`

## 🔑 Login with Demo Credentials

Open `http://localhost:3000/login`

**Admin Account:**
```
Email: admin@rimp.com
Password: password
```

**Intern Account:**
```
Email: intern@rimp.com
Password: password
```

## 🧪 Test Features

### 1. Create a Category (as Admin)
- Go to Admin Dashboard
- Click "Create Category"
- Fill in details
- Save

### 2. Create a Quiz
- Go to "Quizzes" section
- Click "New Quiz"
- Add questions
- Publish

### 3. Create a Task
- Go to "Tasks" section
- Create new task
- Assign to interns
- Track submissions

### 4. Test Payment (as Intern)
- Go to "Categories"
- Click "Enroll Now"
- Use Stripe test card: `4242 4242 4242 4242`
- Any future date for expiry
- Any 3-digit CVC

### 5. Generate Certificate
- Complete tasks and quizzes
- Go to Certificates
- Download as PDF

## 📊 What's Included

✅ **Backend**
- Express.js server with 7 main API routes
- MongoDB database with 10 models
- JWT authentication with 3 roles
- Stripe payment integration
- Email notifications
- QR code generation

✅ **Frontend**
- React dashboard with Recharts analytics
- 5+ pages (Login, Dashboard, Categories, Quizzes, Certificates)
- 20+ reusable components
- Framer Motion animations
- Tailwind CSS styling
- Zustand state management

✅ **Database**
- User management
- Task tracking
- Quiz engine with scoring
- Payment processing
- Certificate generation
- Notification system

## 🛠️ Useful Commands

### Backend
```bash
cd backend

# Development
npm run dev

# Production
npm start

# Seed database (if available)
npm run seed
```

### Frontend
```bash
cd frontend

# Development
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📚 Project Structure at a Glance

```
Backend Structure:
- Models (10): User, Task, Quiz, etc.
- Controllers (6): auth, category, task, quiz, certificate, payment
- Routes (7): Organized API endpoints
- Middleware: Auth, error handling
- Services: Business logic

Frontend Structure:
- Pages (5+): Auth, Dashboard, Categories, etc.
- Components (20+): Form elements, Layout, etc.
- Context: Global state with Zustand
- Services: API client
- Utils: Helpers and custom hooks
```

## 🚀 Next Steps

1. **Customize**: Update colors, logos, branding
2. **Add Data**: Create categories and content
3. **Configure**: Set up email, payments, storage
4. **Deploy**: Follow deployment guide in `/docs`
5. **Monitor**: Setup error tracking and analytics

## 🐛 Common Issues

### "Cannot connect to MongoDB"
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env
```

### "Stripe key error"
```bash
# Get test keys from Stripe dashboard
# Update in .env:
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### "Port 3000 already in use"
```bash
# Use different port
PORT=3001 npm start
```

### "Build errors"
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm start
```

## 📖 Documentation

- **Main README**: `README.md` - Complete documentation
- **Deployment Guide**: `docs/DEPLOYMENT.md` - Production setup
- **API Docs**: Check backend routes in `src/routes/`
- **Component Docs**: Check component files for prop documentation

## 💡 Tips

1. **Use TypeScript**: Migrate gradually for better type safety
2. **Add Tests**: Write unit and integration tests
3. **Setup CI/CD**: Automate testing and deployment
4. **Monitor**: Use Sentry or similar for error tracking
5. **Optimize**: Use React Profiler to find bottlenecks

## 🎓 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)

## 🆘 Need Help?

1. Check the README.md
2. Review deployment guide
3. Check API endpoints documentation
4. Review console for error messages
5. Check browser DevTools for frontend errors

---

**You're all set! Happy coding! 🎉**
