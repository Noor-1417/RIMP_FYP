# AI System - Visual Integration Map

## System Components Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT JOURNEY                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. STUDENT ENROLLS                                                  │
│     └─> Sees AIProjectInitializer component                         │
│         ✓ "Generate My Project" button                              │
│         ✓ Loading states                                            │
│         ✓ Success/error handling                                    │
│                                                                       │
│  2. AI GENERATES PROJECT                                            │
│     └─> projectController.generateInternshipProject()              │
│         └─> aiService.generateInternshipProject()                  │
│             └─> OpenAI API Call                                     │
│                 ✓ Analyzes CV (skills, field, interest)            │
│                 ✓ Creates custom project                           │
│                 ✓ Designs 8-10 weekly tasks                        │
│                 └─> Returns structured JSON                         │
│         └─> Saves to MongoDB (Project collection)                  │
│                                                                       │
│  3. STUDENT SEES DASHBOARD                                          │
│     └─> AIProjectDashboard component loads                         │
│         ✓ Project title & description                              │
│         ✓ Progress bar (0% → 100%)                                 │
│         ✓ Task list (TaskCard components)                          │
│         ✓ Task statistics card                                     │
│         ✓ Regenerate button                                        │
│                                                                       │
│  4. STUDENT WORKS ON TASK                                           │
│     └─> Clicks "Submit" on TaskCard                                │
│         └─> TaskSubmissionModal opens                              │
│             ✓ Text input field                                     │
│             ✓ Character counter                                    │
│             ✓ Submit button                                        │
│             └─> Submits to /api/projects/:enrollmentId/submit-task │
│                                                                       │
│  5. AI EVALUATES SUBMISSION                                         │
│     └─> projectController.submitTask()                             │
│         └─> aiService.evaluateSubmission()                         │
│             └─> OpenAI API Call                                    │
│                 ✓ Checks quality (0-100)                          │
│                 ✓ Detects plagiarism                              │
│                 ✓ Validates requirements                          │
│                 └─> Returns evaluation object                      │
│         └─> Updates task status (completed/rejected)              │
│         └─> Updates project progress                              │
│         └─> Returns evaluation to student                          │
│                                                                       │
│  6. STUDENT SEES RESULTS                                            │
│     └─> TaskSubmissionModal shows:                                 │
│         ✓ Score: 87/100                                           │
│         ✓ Plagiarism: 8%                                          │
│         ✓ Feedback: "Great work!"                                 │
│         ✓ Pass/Fail badge                                         │
│         └─> Can resubmit if rejected                              │
│                                                                       │
│  7. PROGRESS UPDATES                                                │
│     └─> Dashboard refreshes                                        │
│         ✓ Progress bar moves (40% → 50%)                          │
│         ✓ Completed count updates                                 │
│         ✓ Task status changes                                     │
│                                                                       │
│  8. AT 100% COMPLETION                                              │
│     └─> System auto-generates certificate                          │
│         ✓ Certificate collection saved                             │
│         ✓ Student notified                                         │
│         ✓ Available for download                                   │
│                                                                       │
│  9. UPDATE CV & REGENERATE                                          │
│     └─> Student updates CV data                                    │
│         └─> Clicks "Regenerate Project"                           │
│             └─> projectController.regenerateProject()             │
│                 ✓ Archives old project                            │
│                 ✓ Creates new project with updated CV             │
│                 ✓ Reset progress to 0%                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## File Structure & Dependencies

```
Frontend Components
│
├─ AIProjectInitializer.jsx
│  └─ Used after enrollment
│     └─ Calls: /api/projects/generate-internship
│
├─ AIProjectDashboard.jsx (Main Component)
│  └─ Displays project & tasks
│  ├─ Uses: ProgressBar.jsx
│  ├─ Uses: TaskCard.jsx  
│  ├─ Uses: TaskSubmissionModal.jsx
│  └─ Calls APIs:
│     ├─ /api/projects/:enrollmentId
│     ├─ /api/projects/:enrollmentId/progress
│     └─ regenerate feature
│
├─ TaskCard.jsx
│  └─ Individual task display
│     └─ Triggers TaskSubmissionModal
│
├─ TaskSubmissionModal.jsx
│  └─ Submission interface
│     └─ Calls: /api/projects/:enrollmentId/submit-task
│        └─ Shows evaluation results
│
└─ ProgressBar.jsx
   └─ Visual progress display (circular + linear)

Backend Routes
│
├─ POST /api/projects/generate-internship
│  └─ projectController.generateInternshipProject()
│     └─ aiService.generateInternshipProject()
│        └─ Calls OpenAI API
│           └─ Saves to Project model
│
├─ GET /api/projects/:enrollmentId
│  └─ projectController.getProject()
│     └─ Returns full project object
│
├─ POST /api/projects/:enrollmentId/submit-task
│  └─ projectController.submitTask()
│     └─ aiService.evaluateSubmission()
│        └─ Calls OpenAI API
│           └─ Updates task with evaluation
│              └─ Auto-generates certificate if needed
│
├─ GET /api/projects/:enrollmentId/progress
│  └─ projectController.getProjectProgress()
│     └─ Returns progress stats & task list
│
├─ PUT /api/projects/:enrollmentId/tasks/:taskId/status
│  └─ projectController.updateTaskStatus()
│     └─ Updates task status
│
└─ POST /api/projects/:enrollmentId/regenerate
   └─ projectController.regenerateProject()
      └─ Archives old, creates new project

Database Models
│
├─ Project Model (NEW)
│  ├─ Fields:
│  │  ├─ userId, enrollmentId, categoryId
│  │  ├─ title, description
│  │  ├─ objectives[], tools[], skills[]
│  │  ├─ tasks[] (subdocument with evaluation data)
│  │  ├─ progress (0-100)
│  │  ├─ certificateGenerated, certificateId
│  │  └─ cvData (skills, field, interest)
│  │
│  └─ Indexes:
│     ├─ userId + status
│     └─ enrollmentId
│
└─ Tasks Subdocument Structure
   ├─ title, description, deadline
   ├─ status (pending/in-progress/submitted/completed/rejected)
   ├─ submission { text, submittedAt, fileUrl }
   └─ evaluation { score, passed, feedback, plagiarismScore }
```

## Data Flow Diagram

```
┌──────────────────┐
│  Student CV      │ (skills, field, interest)
│  - JavaScript    │
│  - React         │
│  - Web Dev       │
└────────┬─────────┘
         │
         v
┌──────────────────────────────────────────┐
│  OpenAI API                              │
│  (Analyze skills, generate project)      │
│  Model: gpt-4o-mini                      │
└────────┬─────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│  AI Generated Project                │
│  {                                   │
│    title: "Build E-Commerce App"    │
│    description: "...",              │
│    tasks: [                          │
│      { title: "Setup", ... },       │
│      { title: "Auth", ... },        │
│      ...                            │
│    ]                                │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│  MongoDB: Project Collection         │
│  (Store generated project)           │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│  Frontend: AIProjectDashboard        │
│  (Display project + tasks)           │
└────────┬─────────────────────────────┘
         │
    ┌────┴──────┐
    │            │
    v            v
┌─────────┐  ┌────────────────────────┐
│ Student │  │ TaskSubmissionModal    │
│ Works   │  │ (Student submits work) │
└────┬────┘  └────────┬───────────────┘
     │                │
     │                v
     │        ┌──────────────────────┐
     │        │  OpenAI API         │
     │        │  (Evaluate work)    │
     │        └──────────┬──────────┘
     │                   │
     │                   v
     │        ┌──────────────────────┐
     │        │  Evaluation Results  │
     │        │  - Score: 87/100     │
     │        │  - Feedback: "..."   │
     │        │  - Plagiarism: 8%    │
     │        └──────────┬──────────┘
     │                   │
     │                   v
     │        ┌──────────────────────┐
     │        │  MongoDB Update      │
     │        │  Task Status Changed │
     │        │  Progress Updated    │
     │        └──────────┬──────────┘
     │                   │
     └───────────────────┘
             │
             v
    ┌─────────────────────┐
    │  Frontend Refresh   │
    │  - Progress: 50%    │
    │  - Task status OK   │
    │  - Show feedback    │
    └────────┬────────────┘
             │
             v
    ┌─────────────────────┐
    │  At 100% Complete   │
    │  Auto-generate      │
    │  Certificate        │
    └─────────────────────┘
```

## Component Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your App Layout                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard Page                                                  │
│  ├─ Header                                                       │
│  ├─ Navigation                                                   │
│  └─ Content                                                      │
│     ├─ Existing Widgets                                          │
│     │  ├─ User Stats                                            │
│     │  ├─ Recent Enrollments                                    │
│     │  └─ Certificates                                          │
│     │                                                            │
│     └─ NEW: AIProjectDashboard                                  │
│        ├─ Project Header                                        │
│        ├─ ProgressBar (circular visual)                         │
│        ├─ Task Statistics Grid                                  │
│        └─ Task List                                             │
│           └─ Map over tasks with TaskCard                       │
│              └─ TaskCard has Submit button                      │
│                 └─ Opens TaskSubmissionModal                    │
│                    └─ Shows evaluation results                  │
│                                                                  │
│  After Enrollment Page                                          │
│  ├─ Success Message                                             │
│  └─ NEW: AIProjectInitializer                                   │
│     ├─ Project Description                                      │
│     └─ "Generate My Project" Button                             │
│                                                                  │
│  CV Builder Page                                                │
│  ├─ Existing CV Form                                            │
│  └─ NEW: "Save & Update Project" Button                         │
│     └─ Optional: Regenerate Project                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Example

```javascript
// AIProjectDashboard state flow

const [project, setProject] = useState(null);     // Full project
const [progress, setProgress] = useState(null);   // Progress data
const [loading, setLoading] = useState(true);     // Loading state
const [error, setError] = useState('');           // Error state
const [selectedTask, setSelectedTask] = useState(null);  // Selected for submission
const [showSubmitModal, setShowSubmitModal] = useState(false); // Modal visibility

// Effects
useEffect(() => {
  fetchProject();        // On mount, fetch project
}, [enrollmentId]);

useEffect(() => {
  refreshProgress();     // After submission, refresh progress
}, [taskSubmitted]);

// Callbacks
const handleTaskSelect = (task) => {
  setSelectedTask(task);
  setShowSubmitModal(true);
};

const handleTaskSubmitted = async () => {
  await fetchProject();   // Refresh entire project
  await fetchProgress();  // Refresh progress
  setShowSubmitModal(false);
  setSelectedTask(null);
};
```

## API Request/Response Examples

### 1. Generate Project
```javascript
// REQUEST
POST /api/projects/generate-internship
Authorization: Bearer <token>
{
  "enrollmentId": "507f1f77bcf86cd799439013"
}

// RESPONSE (200)
{
  "success": true,
  "message": "Internship project generated successfully",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Build a Full-Stack E-Commerce Platform",
    "description": "Create a complete e-commerce application...",
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Week 1: Project Setup",
        "deadline": "2024-05-01T00:00:00Z",
        "status": "pending",
        "evaluation": null
      }
    ],
    "progress": 0,
    "completedTasks": 0,
    "totalTasks": 8
  }
}
```

### 2. Submit Task
```javascript
// REQUEST
POST /api/projects/507f1f77bcf86cd799439013/submit-task
Authorization: Bearer <token>
{
  "taskId": "507f1f77bcf86cd799439014",
  "submissionText": "Here is my implementation of the project setup..."
}

// RESPONSE (200)
{
  "success": true,
  "message": "Task submitted and evaluated",
  "evaluation": {
    "score": 87,
    "passed": true,
    "feedback": "Excellent work! Your setup is clean and well-organized.",
    "plagiarismScore": 8
  },
  "progress": 12
}
```

### 3. Get Progress
```javascript
// REQUEST
GET /api/projects/507f1f77bcf86cd799439013/progress
Authorization: Bearer <token>

// RESPONSE (200)
{
  "success": true,
  "progress": 25,
  "taskStats": {
    "total": 8,
    "completed": 2,
    "pending": 4,
    "inProgress": 1,
    "submitted": 1,
    "rejected": 0
  },
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Week 1: Setup",
      "status": "completed",
      "evaluation": {
        "score": 87,
        "feedback": "Great work!"
      }
    }
    // ... more tasks
  ],
  "certificateGenerated": false
}
```

## Error Handling Flow

```
┌─────────────────────────┐
│  API Call              │
└────────┬────────────────┘
         │
    ┌────v────┐
    │ Success │
    │ (200)   │
    └────┬────┘
         │
         v
    ┌──────────────┐
    │ Update State │
    │ - setProject │
    │ - setData    │
    └──────────────┘
         │
         └─> Render UI

    ┌────────────┐
    │   Error    │
    │ (4xx/5xx)  │
    └────┬───────┘
         │
         v
    ┌──────────────────┐
    │ Catch Error      │
    │ - Check status   │
    │ - Extract message│
    └────┬─────────────┘
         │
         v
    ┌──────────────────┐
    │ setError(msg)    │
    │ setLoading(false)│
    └────┬─────────────┘
         │
         v
    ┌──────────────────────┐
    │ Render Error Message │
    │ - Show in UI        │
    │ - Allow retry       │
    └──────────────────────┘
```

## Deployment Checklist

```
Backend Setup
□ Update package.json (openai added)
□ Set OPENAI_API_KEY in .env
□ Verify MongoDB connection
□ Test routes with Postman
□ Check authentication middleware
□ Verify error handling
□ Test with mock API key (optional)

Frontend Setup
□ Copy AI components to src/components/ai/
□ Import components in pages
□ Test component rendering
□ Verify API calls work
□ Test loading states
□ Test error handling
□ Responsive mobile design

Database
□ Verify Project indexes created
□ No migrations needed
□ MongoDB auto-creates collection

Testing
□ End-to-end project generation
□ Task submission + evaluation
□ Progress calculation
□ Certificate generation
□ Error scenarios
□ Performance under load

Deployment
□ Deploy backend changes
□ Deploy frontend changes
□ Verify all routes accessible
□ Monitor error logs
□ Test in production
□ Gather user feedback
```

---

**This visual guide helps understand:**
- ✅ How components relate to each other
- ✅ Data flows through the system
- ✅ Where state updates happen
- ✅ API request/response patterns
- ✅ Error handling sequences
- ✅ Integration points in your app

Refer to this when implementing or debugging!
