# AI Project System - Quick Start Guide

## Files Created/Modified

### Backend Files Created

1. **`src/models/Project.js`** - Project and Task schemas
   - Contains Project model with task subdocuments
   - Indexes for fast queries
   - Auto-calculation of progress

2. **`src/services/aiService.js`** - Extended with new functions
   - `generateInternshipProject()` - AI project generation
   - `evaluateSubmission()` - Task evaluation
   - `calculateTextSimilarity()` - Plagiarism detection

3. **`src/controllers/projectController.js`** - All route handlers
   - `generateInternshipProject()` - POST generator
   - `getProject()` - GET project
   - `submitTask()` - POST submission
   - `updateTaskStatus()` - PUT status
   - `getProjectProgress()` - GET progress
   - `regenerateProject()` - POST regenerate

4. **`src/routes/projectRoutes.js`** - Route definitions
   - All project endpoints
   - Authentication required

5. **`src/server.js`** - Modified
   - Added project routes import
   - Added project routes registration

### Frontend Files Created

1. **`src/components/ai/AIProjectDashboard.jsx`** - Main dashboard
   - Displays full project
   - Shows tasks
   - Manages submissions
   - Shows progress

2. **`src/components/ai/AIProjectInitializer.jsx`** - Post-enrollment
   - Generate button
   - Loading states
   - Success/error handling

3. **`src/components/ai/TaskCard.jsx`** - Task display
   - Task info
   - Status badge
   - Submit button
   - Evaluation results

4. **`src/components/ai/TaskSubmissionModal.jsx`** - Submission UI
   - Text input
   - Evaluation results
   - Plagiarism score
   - Feedback display

5. **`src/components/ai/ProgressBar.jsx`** - Visual progress
   - Circular progress
   - Linear progress bar
   - Percentage display

6. **`src/components/ai/INTEGRATION_GUIDE.jsx`** - Usage examples
   - Copy-paste ready examples
   - Integration patterns
   - Service helper code

## Quick Setup

### 1. Backend Setup (5 minutes)

**Files are already created. Just verify:**

- ✓ `src/models/Project.js` exists
- ✓ `src/controllers/projectController.js` exists
- ✓ `src/routes/projectRoutes.js` exists
- ✓ `src/services/aiService.js` updated
- ✓ `src/server.js` updated with project routes

**Required dependency (check package.json):**
```json
{
  "dependencies": {
    "openai": "^4.0.0"
  }
}
```

If missing, run:
```bash
npm install openai
```

**Environment Variables (.env):**
```
OPENAI_API_KEY=sk-...
# or use without API key for mock responses
```

**Database:** No migrations needed - MongoDB/Mongoose auto-creates collections

### 2. Frontend Setup (5 minutes)

**Files already created in `src/components/ai/`:**
- ✓ AIProjectDashboard.jsx
- ✓ AIProjectInitializer.jsx
- ✓ TaskCard.jsx
- ✓ TaskSubmissionModal.jsx
- ✓ ProgressBar.jsx
- ✓ INTEGRATION_GUIDE.jsx

**No additional packages needed** (uses existing axios/react)

### 3. Integration Examples

#### After Enrollment - Show Project Generator

```jsx
// In your EnrollmentSuccessPage or similar
import AIProjectInitializer from './components/ai/AIProjectInitializer';

function EnrollmentSuccess({ enrollmentId, categoryName }) {
  return (
    <AIProjectInitializer
      enrollmentId={enrollmentId}
      categoryName={categoryName}
      onProjectGenerated={() => navigate('/dashboard')}
    />
  );
}
```

#### On Dashboard - Show Project & Tasks

```jsx
// In your DashboardPage
import AIProjectDashboard from './components/ai/AIProjectDashboard';

function Dashboard() {
  const enrollmentId = getActiveEnrollment();
  return (
    <AIProjectDashboard
      enrollmentId={enrollmentId}
      categoryName="Web Development"
    />
  );
}
```

#### In CV Builder - Add Update & Regenerate Option

```jsx
// After saving CV, offer to regenerate project
const confirmRegenerate = window.confirm(
  'Update your internship project based on new CV?'
);

if (confirmRegenerate) {
  await axios.post(
    `/api/projects/${enrollmentId}/regenerate`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
```

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/projects/generate-internship` | Generate new project |
| GET | `/api/projects/:enrollmentId` | Get project details |
| POST | `/api/projects/:enrollmentId/submit-task` | Submit task |
| PUT | `/api/projects/:enrollmentId/tasks/:taskId/status` | Update task status |
| GET | `/api/projects/:enrollmentId/progress` | Get progress stats |
| POST | `/api/projects/:enrollmentId/regenerate` | Regenerate project |

## Testing (No Breaking Changes)

✅ **All existing features work:**
- User authentication - unchanged
- Enrollment system - unchanged
- Payment processing - unchanged
- Certificates - extended (auto-generate)
- Dashboard - can be enhanced with AI widgets

✅ **New AI project features are optional:**
- Only created after enrollment
- Doesn't affect non-enrolled users
- Fallback to mock data if no API key

## Checklist for Go-Live

### Before Deployment

- [ ] OpenAI API key obtained
- [ ] `.env` file configured with API key
- [ ] `npm install openai` run
- [ ] Frontend components tested locally
- [ ] Backend routes tested with Postman/Insomnia
- [ ] Database indexes created (automatic)
- [ ] Error handling verified

### Testing Scenarios

```bash
# 1. Test project generation (should return mock if no API key)
POST /api/projects/generate-internship
Authorization: Bearer <token>
{
  "enrollmentId": "<enrollment_id>"
}

# 2. Test fetch project
GET /api/projects/<enrollment_id>
Authorization: Bearer <token>

# 3. Test task submission
POST /api/projects/<enrollment_id>/submit-task
Authorization: Bearer <token>
{
  "taskId": "<task_id>",
  "submissionText": "This is my submission..."
}

# 4. Test progress
GET /api/projects/<enrollment_id>/progress
Authorization: Bearer <token>
```

## Customization Points

### Change AI Behavior

**Edit `aiService.js`:**
```javascript
// Modify system prompt
const system = `You are an expert...`

// Change model
model: 'gpt-4o-mini' // can change to 'gpt-4' etc

// Adjust temperature (0-2)
temperature: 0.7 // higher = more creative, lower = more focused
```

### Change Task Count

**Edit prompt in `generateInternshipProject()`:**
```javascript
// Current: 8-10 tasks
// Change to: "Create 6-8 weekly tasks" in the prompt
```

### Adjust Evaluation Criteria

**Edit `evaluateSubmission()` system prompt:**
```javascript
// Add custom criteria, weights, requirements
```

### Customize UI

**Edit React components:**
```jsx
// Change colors: 'bg-blue-500' → 'bg-green-500'
// Change layout: grid-cols-4 → grid-cols-3
// Add/remove fields
```

## Common Issues & Solutions

### ❌ "Project not found"
**Check:** Enrollment ID is valid, user is logged in, project was generated

### ❌ "OpenAI API error"
**Check:** API key is valid, has credits, not rate-limited

### ❌ "Task evaluation failed"
**Check:** Submission text is long enough, contains meaningful content

### ❌ "Progress not updating"
**Check:** Tasks are marked as completed, database saved changes

### ❌ "Certificate not generating"
**Check:** All tasks are 100% completed, certificateGenerated flag updates

## Database Migration (if needed)

MongoDB doesn't require migrations - collections auto-create. But if you want to clear old data:

```bash
# In MongoDB compass or CLI:
db.projects.deleteMany({})
```

## Monitoring

**Track in production:**
- API response times
- Deployment errors
- OpenAI API usage/costs
- User progress funnel

**Key metrics:**
- Projects generated
- Tasks completed
- Average evaluation scores
- Plagiarism detection accuracy

## Performance Notes

- Projects are cached in MongoDB
- AI generation is one-time per enrollment
- Task evaluation happens on submission
- Progress calculated on-the-fly
- No re-generation unless explicit

## What's NOT Affected

✓ User authentication
✓ Enrollment system
✓ Payment processing
✓ Certificate system (just extended)
✓ Quiz system
✓ Task system
✓ Dashboard
✓ Admin panel
✓ Email notifications
✓ Storage system

## What's NEW

✨ AI project generation
✨ AI task evaluation
✨ Plagiarism detection
✨ Progress tracking (AI-specific)
✨ Auto certificate generation
✨ Project dashboard
✨ Task submission workflow
✨ Real-time feedback

---

**You're ready to go!** 

Start with:
1. Set OPENAI_API_KEY in .env
2. Import components in your pages
3. Test project generation
4. Deploy!

Questions? Check `AI_PROJECT_IMPLEMENTATION_GUIDE.md` for detailed docs.
