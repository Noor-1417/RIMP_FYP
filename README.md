# Remote Internship Management Platform (RIMP)

A comprehensive full-stack platform for managing remote internships with modern technologies and professional design.

## 🚀 Features

- **Multi-Role Authentication**: Admin, Manager, and Intern roles with JWT-based authentication
- **Dashboard Analytics**: Real-time stats and progress tracking using Recharts
- **Task Management**: Create, assign, and track internship tasks with auto-assignment
- **Quiz Engine**: MCQ, short answer, and essay-based quizzes with scoring system
- **Drip Content**: Scheduled release of learning materials on daily/weekly basis
- **Certificate System**: Generate certificates with QR codes for verification
- **Payment Integration**: Stripe integration for internship enrollment payments
- **Notifications**: Email and in-app notifications for important updates
- **Responsive Design**: Mobile-first, fully responsive UI with Tailwind CSS
- **Animations**: Smooth, professional animations using Framer Motion
- **Professional Theme**: Modern blue theme (#0A3D62, #74B9FF) for SaaS feel

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- Stripe API
- Nodemailer (Email)
- QR Code Generation

### Frontend
- React 18
- TailwindCSS
- Framer Motion
- Recharts
- Stripe.js
- Axios
- Zustand (State Management)

## 📁 Project Structure

```
RIMP/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── InternshipCategory.js
│   │   │   ├── Task.js
│   │   │   ├── Quiz.js
│   │   │   ├── Certificate.js
│   │   │   ├── Payment.js
│   │   │   ├── Notification.js
│   │   │   ├── DripContent.js
│   │   │   ├── Progress.js
│   │   │   └── Enrollment.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   └── *.jsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── public/
│   ├── .env.example
│   └── package.json
│
└── docs/
    └── DEPLOYMENT.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)
- Stripe Account
- Gmail Account (for email notifications)

### Backend Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Create .env file**
```bash
cp .env.example .env
```

3. **Configure environment variables** in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/rimp
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

4. **Start MongoDB**
```bash
mongod
```

5. **Run backend**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Create .env file**
```bash
cp .env.example .env
```

3. **Configure environment variables** in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

4. **Run frontend**
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Authentication

### Login Credentials (Demo)

**Admin Account:**
- Email: `admin@rimp.com`
- Password: `password`

**Intern Account:**
- Email: `intern@rimp.com`
- Password: `password`

### JWT Token
- Tokens are stored in localStorage after login
- Automatically included in all API requests via Authorization header
- Token expires in 7 days (configurable)

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `GET /api/auth/logout` - Logout

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)
- `POST /api/categories/:id/enroll` - Enroll in category

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task (Admin/Manager)
- `PUT /api/tasks/:id` - Update task (Admin/Manager)
- `DELETE /api/tasks/:id` - Delete task (Admin)
- `POST /api/tasks/:id/assign` - Assign task to interns
- `POST /api/tasks/:id/submit` - Submit task (Intern)
- `POST /api/tasks/:id/review` - Review submission (Admin/Manager)

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes` - Create quiz (Admin/Manager)
- `PUT /api/quizzes/:id` - Update quiz (Admin/Manager)
- `DELETE /api/quizzes/:id` - Delete quiz (Admin)
- `POST /api/quizzes/:id/submit` - Submit quiz (Intern)
- `GET /api/quizzes/:id/results` - Get quiz results

### Certificates
- `GET /api/certificates` - Get user certificates
- `GET /api/certificates/:id` - Get certificate details
- `POST /api/certificates` - Create certificate (Admin/Manager)
- `GET /api/certificates/verify/:certificateNumber` - Verify certificate (Public)
- `GET /api/certificates/:id/download` - Download certificate
- `DELETE /api/certificates/:id` - Delete certificate (Admin)

### Payments
- `GET /api/payments` - Get user payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments/:id/refund` - Refund payment (Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/:id` - Get notification details
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🎨 UI Components

### Form Elements
- `Button` - Animated button with variants
- `Input` - Text input with validation
- `TextArea` - Multi-line text input
- `Select` - Dropdown selector
- `Card` - Container component with hover effects
- `Badge` - Status badge with color variants

### Layout Elements
- `Navbar` - Top navigation with user menu
- `Sidebar` - Side navigation (Admin)
- `Modal` - Dialog component
- `Pagination` - Page navigation
- `ProgressBar` - Progress indicator
- `Alert` - Alert notification

## 📊 Dashboard Features

### Intern Dashboard
- Weekly progress tracking
- Task assignment overview
- Quiz completion status
- Certificate achievements
- Achievement statistics

### Admin Dashboard
- User management statistics
- Enrollment trends
- Revenue tracking
- Category distribution
- Completion rate analytics

## 💳 Stripe Integration

### Payment Flow
1. User clicks "Enroll Now" on category
2. Navigate to payment page
3. Enter card details and billing info
4. Stripe processes payment
5. Backend confirms payment
6. Auto-enrollment in category
7. Access to internship materials

### Testing Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## 📧 Email Configuration

### Setup Gmail App Password
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password
3. Use as EMAIL_PASSWORD in .env

### Email Templates
- Welcome email
- Task assigned
- Quiz available
- Certificate earned
- Payment receipt

## 🔄 Drip Content System

### How It Works
1. Admin creates content scheduled for specific week/day
2. Content auto-releases on scheduled date
3. Interns can view released content
4. Progress tracking for content consumption
5. Can be linked to specific tasks

### Frequency Options
- Daily
- Weekly
- Bi-weekly

## 🎓 Certificate System

### Features
- Auto-generated upon completion
- QR code for verification
- Downloadable PDF
- Public verification link
- Manager signature
- Grade and score display

### Download Options
- PDF format
- Social media sharing
- LinkedIn integration ready

## 🔔 Notification System

### Channels
- Email notifications
- In-app notifications
- Push notifications (future)

### Types
- Task assignments
- Quiz availability
- Content releases
- Certificate earned
- Payment confirmations
- Submission reviews

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify firewall settings

### Authentication Issues
- Clear localStorage and re-login
- Check JWT_SECRET is set correctly
- Verify token expiration time

### Payment Issues
- Ensure Stripe keys are correct
- Check API key permissions
- Verify CORS settings

### Email Issues
- Enable 2FA on Gmail
- Generate App Password
- Check EMAIL_USER and EMAIL_PASSWORD
- Verify firewall allows SMTP

## 📝 Environment Variables Checklist

### Backend (.env)
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] JWT_EXPIRE
- [ ] PORT
- [ ] NODE_ENV
- [ ] FRONTEND_URL
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD

### Frontend (.env)
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_STRIPE_PUBLISHABLE_KEY

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- AWS EC2
- Heroku
- Railway
- Render
- Docker deployment

## 📚 API Documentation

API documentation available at `/api/docs` (Swagger - future implementation)

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for remote internship management**
