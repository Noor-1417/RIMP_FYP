# AI-Powered Internship System Implementation Guide

## Overview

This guide provides complete implementation details for the new AI-powered internship system integrated into your MERN project.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI-Powered Internship System             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (React)                Backend (Node.js/Express)       │
│  ┌──────────────────┐           ┌──────────────────────────┐    │
│  │ AIProjectInit    │           │ projectController         │    │
│  │ AIProjectDash    │──────────→│ projectRoutes             │    │
│  │ TaskCard         │           │ Project Model             │    │
│  │ TaskSubmission   │           └──────────────────────────┘    │
│  │ ProgressBar      │                     ↓                      │
│  └──────────────────┘           ┌──────────────────────────┐    │
│                                 │ aiService                 │    │
│                                 │ - generateInternshipProject
│                                 │ - evaluateSubmission      │    │
│                                 │ - calculateTextSimilarity │    │
│                                 └──────────────────────────┘    │
│                                         ↓                        │
│                                 ┌──────────────────────────┐    │
│                                 │ OpenAI API               │    │
│                                 │ (or fallback mock)       │    │
│                                 └──────────────────────────┘    │
│                                                                   │
│  Database (MongoDB)                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Project Collection                                       │   │
│  │ ├─ userId (ref: User)                                   │   │
│  │ ├─ enrollmentId (ref: Enrollment)                       │   │
│  │ ├─ title, description, objectives, tools, skills       │   │
│  │ ├─ tasks: [title, deadline, status, submission, eval]  │   │
│  │ └─ progress, certificateGenerated, cvData              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Models

### Project Model Structure

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to User
  enrollmentId: ObjectId,        // Reference to Enrollment
  categoryId: ObjectId,          // Reference to InternshipCategory
  
  // Project Details
  title: String,                 // AI-generated project title
  description: String,           // Detailed description
  objectives: [String],          // Learning objectives
  tools: [String],              // Required tools/technologies
  skills: [String],             // Skills to develop
  tasks: [
    {
      title: String,
      description: String,
      deadline: Date,
      status: 'pending|in-progress|submitted|completed|rejected',
      order: Number,
      submission: {
        text: String,
        submittedAt: Date,
        fileUrl: String
      },
      evaluation: {
        score: 0-100,
        passed: Boolean,
        feedback: String,
        plagiarismScore: 0-100,
        evaluatedAt: Date
      }
    }
  ],
  
  // Progress Tracking
  progress: 0-100,               // Calculated as (completedTasks/totalTasks)*100
  completedTasks: Number,
  totalTasks: Number,
  status: 'draft|active|paused|completed|failed',
  
  // Timeline
  startDate: Date,
  estimatedEndDate: Date,
  actualEndDate: Date,
  
  // Certificate
  certificateGenerated: Boolean,
  certificateId: ObjectId,
  
  // Reference Data
  cvData: {
    skills: String,              // User's technical skills (at generation time)
    field: String,              // User's field
    interest: String            // User's interests
  },
  
  timestamps: true
}
```

## Backend Routes

### 1. Generate Internship Project
```
POST /api/projects/generate-internship
Authorization: Bearer <token>

Request Body:
{
  "enrollmentId": "enrollment_id"
}

Response:
{
  "success": true,
  "message": "Internship project generated successfully",
  "project": { /* Project object */ }
}
```

**Features:**
- Checks for existing project (won't generate duplicates)
- Uses user's CV data (skills, field, interest)
- Calls OpenAI/Gemini to generate:
  - Project title and description
  - Learning objectives
  - Required tools
  - 8-10 weekly tasks with deadlines
- Stores in MongoDB
- Fallback: Mock project if API key missing

### 2. Get Project Details
```
GET /api/projects/:enrollmentId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "project": { /* Full project object */ }
}
```

### 3. Submit Task for Evaluation
```
POST /api/projects/:enrollmentId/submit-task
Authorization: Bearer <token>

Request Body:
{
  "taskId": "task_id",
  "submissionText": "Student's work submission..."
}

Response:
{
  "success": true,
  "message": "Task submitted and evaluated",
  "evaluation": {
    "score": 85,
    "passed": true,
    "feedback": "Great work! Your solution...",
    "plagiarismScore": 15
  },
  "progress": 45
}
```

**Features:**
- Updates task with submission
- Calls AI to evaluate on:
  - Quality and completeness (0-100)
  - Plagiarism detection (0-100)
  - Task requirement alignment
- Updates task status to completed/rejected
- Auto-generates certificate if all tasks complete
- Returns evaluation results to frontend

### 4. Get Project Progress
```
GET /api/projects/:enrollmentId/progress
Authorization: Bearer <token>

Response:
{
  "success": true,
  "progress": 45,
  "taskStats": {
    "total": 10,
    "completed": 4,
    "pending": 3,
    "inProgress": 2,
    "submitted": 1,
    "rejected": 0
  },
  "tasks": [ /* Detailed task list */ ],
  "certificateGenerated": false
}
```

### 5. Update Task Status
```
PUT /api/projects/:enrollmentId/tasks/:taskId/status
Authorization: Bearer <token>

Request Body:
{
  "status": "in-progress"
}

Valid statuses: pending, in-progress, submitted, completed, rejected
```

### 6. Regenerate Project
```
POST /api/projects/:enrollmentId/regenerate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Project regenerated successfully",
  "project": { /* New project object */ }
}
```

**Features:**
- Archives old project (status: paused)
- Uses updated CV data if changed
- Creates brand new project structure
- Useful if student updates CV or wants different tasks

## Frontend Components

### 1. AIProjectInitializer
**Use:** Show after enrollment to trigger project generation

```jsx
<AIProjectInitializer
  enrollmentId={enrollmentId}
  categoryName={categoryName}
  onProjectGenerated={(project) => console.log('Generated:', project)}
  onError={(error) => console.error(error)}
/>
```

**Props:**
- `enrollmentId` (required): User's enrollment ID
- `categoryName` (optional): Internship category name
- `onProjectGenerated` (callback): Called when project created
- `onError` (callback): Called on error

### 2. AIProjectDashboard
**Use:** Main project display with all tasks

```jsx
<AIProjectDashboard
  enrollmentId={enrollmentId}
  categoryName={categoryName}
/>
```

**Features:**
- Displays project details
- Shows progress bar (circular + linear)
- Lists all tasks with status
- Regenerate project button
- Task submission interface
- Auto-certificate generation message
- Real-time progress updates

### 3. TaskCard
**Use:** Individual task display

```jsx
<TaskCard
  task={task}
  onSubmit={() => handleTaskSelect(task)}
/>
```

**Shows:**
- Task title and description
- Deadline with days remaining
- Status badge
- Evaluation results if available
- Submit/Resubmit button

### 4. TaskSubmissionModal
**Use:** Modal for task submission and evaluation

```jsx
<TaskSubmissionModal
  task={task}
  enrollmentId={enrollmentId}
  onClose={handleClose}
  onSubmitted={handleSubmitted}
/>
```

**Features:**
- Form for submission entry (min 50 chars)
- Real-time character count
- AI evaluation in modal
- Shows score, plagiarism %, and feedback
- Pass/fail indication

### 5. ProgressBar
**Use:** Visual progress display

```jsx
<ProgressBar progress={45} animate={true} />
```

**Displays:**
- Circular progress with percentage
- Linear progress bar
- Smooth animations

## Integration Steps

### Step 1: Update Frontend Package.json (if needed)
Ensure you have axios installed:
```bash
npm install axios
```

### Step 2: Add Environment Variables

**Backend (.env):**
```
OPENAI_API_KEY=sk-... # Your OpenAI API key
# OR for Gemini:
GEMINI_API_KEY=...
```

### Step 3: Import Components in Your Pages

**Example: Dashboard**
```jsx
import AIProjectDashboard from './components/ai/AIProjectDashboard';
import AIProjectInitializer from './components/ai/AIProjectInitializer';

export function DashboardPage() {
  const enrollmentId = getActiveEnrollmentId();
  return (
    <AIProjectDashboard
      enrollmentId={enrollmentId}
      categoryName="Web Development"
    />
  );
}
```

**Example: Enrollment Success**
```jsx
import AIProjectInitializer from './components/ai/AIProjectInitializer';

export function EnrollmentSuccessPage({ enrollmentId }) {
  return (
    <AIProjectInitializer
      enrollmentId={enrollmentId}
      onProjectGenerated={() => navigate('/dashboard')}
    />
  );
}
```

### Step 4: Add Project Routes to Navigation
```jsx
// Add to your main navigation
<NavLink to={`/projects/${enrollmentId}`}>
  AI Project Dashboard
</NavLink>
```

## AI Service Details

### generateInternshipProject()
**Inputs:**
- `skills`: User's technical skills
- `field`: Area of focus
- `interest`: Specific interests
- `categoryName`: Internship category

**Output:**
```javascript
{
  title: "Project Title",
  description: "Detailed project description",
  objectives: ["Learn X", "Build Y", "Implement Z"],
  tools: ["Tool1", "Tool2"],
  skills: ["Skill1", "Skill2"],
  tasks: [
    {
      title: "Week 1: Setup",
      description: "Task details",
      deadline: Date,
      order: 0,
      status: "pending"
    },
    // ... more tasks
  ],
  notes: "Additional notes"
}
```

**Prompts OpenAI/Gemini to:**
- Analyze student's skills and interests
- Create realistic, achievable project
- Design 8-10 progressive tasks
- Set deadlines spread over 8-12 weeks
- Include learning objectives

### evaluateSubmission()
**Inputs:**
- `submission`: Student's work
- `taskDescription`: What was requested

**Output:**
```javascript
{
  score: 0-100,           // Quality score
  passed: true/false,     // Pass/fail (score >= 60)
  feedback: String,       // AI feedback
  plagiarismScore: 0-100  // Similarity %
}
```

**Checks:**
- Quality and completeness
- Alignment with requirements
- Originality/plagiarism patterns
- Overall feasibility

## Important Notes

### ✅ DO
- ✓ Test with OpenAI API key first
- ✓ Use environment variables for API keys
- ✓ Cache project data to avoid regeneration
- ✓ Show loading states during AI calls
- ✓ Handle API failures gracefully
- ✓ Validate submission text length
- ✓ Save progress frequently

### ❌ DON'T
- ✗ Don't expose API keys in frontend code
- ✗ Don't make multiple AI calls for same user
- ✗ Don't allow project regeneration too frequently
- ✗ Don't skip validation on task submissions
- ✗ Don't remove existing project features

## Testing Checklist

- [ ] Backend routes return correct data
- [ ] Project generates without API key (mock data)
- [ ] Project generates with OpenAI API key
- [ ] Tasks can be submitted
- [ ] AI evaluation works correctly
- [ ] Progress updates after task completion
- [ ] Certificate generates at 100% progress
- [ ] Duplicate projects aren't created
- [ ] Old projects are archived on regeneration
- [ ] Frontend components render correctly
- [ ] Error handling works
- [ ] Progress bar animates smoothly
- [ ] Modal closes after submission
- [ ] Mobile responsive UI

## Troubleshooting

### Project not generating
**Check:**
1. Enrollment ID is valid
2. User CV data is populated
3. OpenAI API key is set (or fallback works)
4. No existing project for this enrollment

### Tasks not evaluating properly
**Check:**
1. Submission text is at least 50 characters
2. OpenAI API key is valid
3. Network connection is stable
4. Task description was provided

### Progress not updating
**Check:**
1. Task status is being saved
2. Progress calculation is correct
3. Frontend is fetching latest data
4. Database has correct task count

### Certificate not generating
**Check:**
1. All tasks are marked completed
2. Progress = 100%
3. Certificate model is working
4. certificateGenerated flag updates

## API Response Examples

### Successful Project Generation
```json
{
  "success": true,
  "message": "Internship project generated successfully",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "enrollmentId": "507f1f77bcf86cd799439013",
    "title": "Build a Full-Stack E-Commerce Platform",
    "description": "Create a complete e-commerce web application...",
    "objectives": ["Learn MERN stack", "Implement payment processing", "Deploy to production"],
    "tools": ["React", "Node.js", "MongoDB", "Stripe"],
    "skills": ["Full-stack development", "Database design", "API development"],
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Week 1: Project Setup & Architecture",
        "description": "Setup React frontend, Node backend, MongoDB database...",
        "deadline": "2024-05-01T00:00:00Z",
        "status": "pending",
        "order": 0
      }
      // ... more tasks
    ],
    "progress": 0,
    "completedTasks": 0,
    "totalTasks": 8,
    "status": "active",
    "startDate": "2024-04-24T14:30:00Z",
    "cvData": {
      "skills": "JavaScript, React, Node.js",
      "field": "Web Development",
      "interest": "Full-stack development"
    }
  }
}
```

### Successful Task Submission
```json
{
  "success": true,
  "message": "Task submitted and evaluated",
  "evaluation": {
    "score": 87,
    "passed": true,
    "feedback": "Excellent implementation! Your code is clean and well-structured...",
    "plagiarismScore": 8
  },
  "progress": 12
}
```

## Next Steps

1. **Setup OpenAI/Gemini API**
   - Get API key from OpenAI or Google
   - Add to `.env` file

2. **Test Locally**
   - Run backend: `npm run dev`
   - Run frontend: `npm start`
   - Test project generation

3. **Deploy**
   - Update production `.env` with API key
   - Deploy backend changes
   - Deploy frontend changes

4. **Monitor**
   - Check API usage
   - Monitor error rates
   - Track user engagement

## Support & Customization

To customize:
- **AI Prompts:** Edit prompts in `aiService.js`
- **Task Structure:** Modify `Project.js` model
- **UI/UX:** Update React components
- **Evaluation Criteria:** Adjust `evaluateSubmission()` logic

---

**Last Updated:** April 20, 2026
**Version:** 1.0.0
**Status:** Production Ready
