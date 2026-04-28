# AI FUNCTIONALITY IMPLEMENTATION GUIDE

## Overview

This guide explains the new AI functionality added to the MERN project. The system automatically generates personalized internship projects with AI-powered task evaluation.

---

## ✅ WHAT'S NEW

### 1. **Automatic AI Project Generation**
- After a student completes payment and enrolls, an AI project is **automatically generated**
- No additional API call needed - happens instantly during enrollment
- Project includes personalized title, description, objectives, tools, and 8-10 weekly tasks

### 2. **New AI API Routes**
All routes require authentication and are under `/api/ai/` prefix:

```
POST   /api/ai/generate-project      - Manually generate/regenerate project
POST   /api/ai/submit-task           - Submit task for AI evaluation
GET    /api/ai/progress/:enrollmentId - Get project progress and statistics
POST   /api/ai/regenerate-project    - Regenerate project with new parameters
GET    /api/ai/task/:enrollmentId/:taskId - Get specific task details
```

### 3. **Enhanced Task Evaluation**
- AI automatically scores submissions (0-100)
- Provides constructive feedback
- Detects plagiarism indicators
- Tasks can be resubmitted if rejected

---

## 🔄 FLOW: From Enrollment to Project Completion

```
1. Student Pays for Internship
   ↓
2. Enrollment Created + Payment Confirmed
   ↓
3. [AUTOMATIC] AI Project Generated Based on Student's CV Data
   - Title, description, objectives
   - 8-10 personalized weekly tasks
   - Deadlines calculated (1 week per task)
   ↓
4. Student Logs In → Sees Auto-Generated Project
   ↓
5. Student Submits Task Solution
   ↓
6. [AUTOMATIC] AI Evaluates Submission
   - Score: 0-100
   - Passed/Rejected decision
   - Feedback provided
   ↓
7. Student Views Progress Dashboard
   - Overall completion %
   - Task statistics
   - Average score across all tasks
   ↓
8. Once All Tasks Complete → Certificate Generated
```

---

## 📋 API ENDPOINTS

### 1. Generate AI Project (Manual)

**Endpoint:**
```
POST /api/ai/generate-project
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "skills": ["React", "Node.js", "MongoDB"],
  "field": "Web Development",
  "educationLevel": "Bachelor's",
  "enrollmentId": "optional_enrollment_id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "AI project generated successfully",
  "project": {
    "_id": "project_id",
    "userId": "user_id",
    "enrollmentId": "enrollment_id",
    "title": "AI-Generated Project Title",
    "description": "Full description...",
    "objectives": ["obj1", "obj2"],
    "tools": ["tool1", "tool2"],
    "skills": ["skill1", "skill2"],
    "tasks": [
      {
        "_id": "task_id",
        "title": "Week 1 Task",
        "description": "Task description",
        "deadline": "2026-04-28T...",
        "status": "pending",
        "order": 0
      }
    ],
    "totalTasks": 8,
    "completedTasks": 0,
    "progress": 0,
    "status": "active"
  },
  "isNew": true
}
```

**Duplicate Check:**
If project already exists:
```json
{
  "success": true,
  "message": "Project already exists for this enrollment",
  "project": {...},
  "isNew": false
}
```

---

### 2. Submit Task for Evaluation

**Endpoint:**
```
POST /api/ai/submit-task
```

**Request Body:**
```json
{
  "enrollmentId": "enrollment_id",
  "taskId": "task_id",
  "submissionText": "Student's solution/answer text..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Task submitted and evaluated successfully",
  "evaluation": {
    "score": 85,
    "passed": true,
    "feedback": "Excellent work! Your solution demonstrates...",
    "plagiarismScore": 5
  },
  "task": {
    "_id": "task_id",
    "title": "Week 1 Task",
    "status": "completed",
    "evaluation": {
      "score": 85,
      "passed": true,
      "feedback": "Excellent work!...",
      "plagiarismScore": 5,
      "evaluatedAt": "2026-04-21T..."
    }
  },
  "projectProgress": {
    "completedTasks": 1,
    "totalTasks": 8,
    "progress": 12.5
  }
}
```

---

### 3. Get Project Progress

**Endpoint:**
```
GET /api/ai/progress/:enrollmentId
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "overall": 37.5,
    "completed": 3,
    "total": 8
  },
  "statistics": {
    "total": 8,
    "completed": 3,
    "pending": 4,
    "inProgress": 1,
    "rejected": 0,
    "submitted": 0,
    "averageScore": 78.33
  },
  "project": {
    "_id": "project_id",
    "title": "Project Title",
    "description": "...",
    "status": "active",
    "startDate": "2026-04-15T...",
    "estimatedEndDate": "2026-06-15T..."
  },
  "tasks": [
    {
      "_id": "task_1",
      "title": "Week 1 Task",
      "deadline": "2026-04-22T...",
      "status": "completed",
      "evaluation": {
        "score": 80,
        "passed": true,
        "feedback": "Good work!",
        "evaluatedAt": "2026-04-21T..."
      }
    },
    {
      "_id": "task_2",
      "title": "Week 2 Task",
      "deadline": "2026-04-29T...",
      "status": "pending",
      "evaluation": null
    }
  ]
}
```

---

### 4. Regenerate Project

**Endpoint:**
```
POST /api/ai/regenerate-project
```

**Request Body:**
```json
{
  "enrollmentId": "enrollment_id",
  "skills": ["new", "skills"],
  "field": "New Field"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project regenerated successfully",
  "project": {
    "_id": "project_id",
    "title": "New AI-Generated Project",
    "description": "...",
    "tasks": [...]
  }
}
```

**Note:** This will reset all task progress!

---

### 5. Get Specific Task Details

**Endpoint:**
```
GET /api/ai/task/:enrollmentId/:taskId
```

**Response:**
```json
{
  "success": true,
  "task": {
    "_id": "task_id",
    "title": "Week 2 Task",
    "description": "Complete a feature...",
    "deadline": "2026-04-29T...",
    "status": "pending",
    "order": 1,
    "submission": null,
    "evaluation": null
  }
}
```

---

## 🚀 FRONTEND INTEGRATION EXAMPLES

### Example 1: Trigger Manual Project Generation

```javascript
// In React component
const generateProject = async () => {
  try {
    const response = await fetch('/api/ai/generate-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        enrollmentId: enrollmentId,
        skills: ['React', 'Node.js'],
        field: 'Web Development'
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Project generated:', data.project);
      // Update UI with new project
    }
  } catch (error) {
    console.error('Error generating project:', error);
  }
};
```

### Example 2: Submit a Task

```javascript
const submitTask = async (taskId, submissionText) => {
  const response = await fetch('/api/ai/submit-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      enrollmentId: enrollmentId,
      taskId: taskId,
      submissionText: submissionText
    })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('Evaluation:', data.evaluation);
    console.log('New Progress:', data.projectProgress);
  }
};
```

### Example 3: Display Progress Dashboard

```javascript
const displayProgress = async () => {
  const response = await fetch(`/api/ai/progress/${enrollmentId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  const data = await response.json();
  
  // Display in UI
  console.log(`Progress: ${data.progress.overall}%`);
  console.log(`Tasks Completed: ${data.progress.completed}/${data.progress.total}`);
  console.log(`Average Score: ${data.statistics.averageScore}`);
  
  // Display task list
  data.tasks.forEach(task => {
    console.log(`${task.title}: ${task.status}`);
    if (task.evaluation) {
      console.log(`  Score: ${task.evaluation.score}`);
    }
  });
};
```

---

## 🔧 HOW IT WORKS BEHIND THE SCENES

### Project Generation Flow

1. **User Data Collection**
   - Skills from CV
   - Field/specialization
   - Education level
   - Interests

2. **AI Prompt**
   ```
   "Create a personalized [field] internship project for a student with:
   - Technical Skills: [skills]
   - Field: [field]
   - Interests: [interests]
   
   Generate 8-10 weekly tasks with realistic deadlines and descriptions."
   ```

3. **OpenAI API Call**
   - Model: GPT-4o-mini (cost-effective)
   - Temperature: 0.7 (creative but consistent)
   - Max tokens: 2000

4. **Response Parsing**
   - Extracts JSON from response
   - Converts week numbers to actual deadlines
   - Saves to MongoDB

### Task Evaluation Flow

1. **Submission Received**
   - Save student's text submission
   - Mark task as "submitted"

2. **AI Evaluation Prompt**
   ```
   "Evaluate this submission for the task: [task description]
   
   Check for:
   1. Quality and completeness (0-100)
   2. Plagiarism indicators (0-100%)
   3. Requirement fulfillment
   
   Return JSON: {score, passed, feedback, plagiarismScore}"
   ```

3. **OpenAI Response**
   - Score calculated
   - Pass/fail decision (score >= 60)
   - Constructive feedback generated
   - Plagiarism score estimated

4. **Update Task**
   - Save evaluation results
   - Update task status
   - Recalculate project progress

---

## 🎯 KEY FEATURES

✅ **Automatic Generation**
- Happens automatically after enrollment
- No extra user action required
- Falls back to mock project if API key missing

✅ **Modularity**
- Separate `/api/ai/` routes
- Dedicated aiController
- Reusable aiService functions
- Doesn't break existing project routes

✅ **Smart Evaluation**
- Plagiarism detection
- Quality scoring
- Constructive feedback
- Pass/fail determination

✅ **Progress Tracking**
- Real-time progress percentage
- Task statistics
- Average scores
- Detailed task breakdown

✅ **Error Handling**
- Graceful fallbacks
- Duplicate project prevention
- Proper error messages
- API key optional (uses mock data)

---

## 📊 DATABASE SCHEMA UPDATES

The Project model already supports AI functionality:

```javascript
{
  userId: ObjectId,
  enrollmentId: ObjectId,
  categoryId: ObjectId,
  title: String,
  description: String,
  objectives: [String],
  tools: [String],
  skills: [String],
  
  tasks: [{
    title: String,
    description: String,
    deadline: Date,
    status: enum['pending', 'in-progress', 'submitted', 'completed', 'rejected'],
    order: Number,
    
    submission: {
      text: String,
      submittedAt: Date
    },
    
    evaluation: {
      score: Number (0-100),
      passed: Boolean,
      feedback: String,
      plagiarismScore: Number (0-100),
      evaluatedAt: Date
    }
  }],
  
  progress: Number (0-100),
  completedTasks: Number,
  totalTasks: Number,
  status: enum['draft', 'active', 'completed'],
  startDate: Date,
  estimatedEndDate: Date
}
```

---

## 🔐 SECURITY CONSIDERATIONS

1. **Authentication Required**
   - All `/api/ai/` routes require valid JWT token
   - User ID verified from token
   - No cross-user access possible

2. **Input Validation**
   - Required fields checked
   - Task ID verified before submission
   - Enrollment ownership verified

3. **Error Messages**
   - Generic messages for security
   - Detailed logs for debugging
   - No database info exposed

4. **API Key Security**
   - OpenAI key in .env (not committed)
   - Fallback mock data if key missing
   - No key exposed in responses

---

## 🚫 WHAT WASN'T CHANGED

✅ All existing routes still work
✅ All existing controllers unchanged
✅ Project model extended, not replaced
✅ No breaking changes
✅ Backward compatible

Existing routes remain:
- `POST /api/projects/generate-internship` (original)
- `GET /api/projects/:enrollmentId` (original)
- `POST /api/projects/:enrollmentId/submit-task` (original)
- `GET /api/projects/:enrollmentId/progress` (original)

---

## ⚙️ ENVIRONMENT VARIABLES

Ensure `.env` has:

```
OPENAI_API_KEY=sk_your_key_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret
```

---

## 🧪 TESTING THE SYSTEM

### Test 1: Automatic Generation After Payment
1. Create a new user with CV data
2. Enroll in an internship (payment)
3. Check database: Project should be auto-created

### Test 2: Manual Project Generation
```bash
curl -X POST http://localhost:5000/api/ai/generate-project \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "your_id",
    "skills": ["React", "Node.js"],
    "field": "Web Development"
  }'
```

### Test 3: Submit Task
```bash
curl -X POST http://localhost:5000/api/ai/submit-task \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "your_id",
    "taskId": "task_id",
    "submissionText": "Here is my solution..."
  }'
```

### Test 4: Check Progress
```bash
curl -X GET http://localhost:5000/api/ai/progress/enrollment_id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 SUMMARY

The new AI functionality:
1. ✅ Generates personalized projects automatically
2. ✅ Evaluates task submissions with AI
3. ✅ Tracks progress in real-time
4. ✅ Provides structured feedback
5. ✅ Maintains backward compatibility
6. ✅ Handles errors gracefully
7. ✅ Requires no frontend changes (but can be integrated)

All files are ready to use immediately after starting the backend server!
