# Admin API Specification

This document describes the REST API endpoints for the Admin area. All admin endpoints are protected and require a valid JWT token. The `protect` middleware verifies the token and `authorize('admin')` restricts routes to admin users.

Base path: `/api/admin`

Common behaviors
- All list endpoints support `page` and `limit` query parameters for pagination. Default `page=1`, `limit=20` unless stated otherwise.
- Responses follow `{ success: boolean, data: any, pagination?: { total, pages, currentPage } }` when listing resources.
- Errors return standard Express error JSON with status code and message.

Authentication
- Header: `Authorization: Bearer <token>`

---

## Categories

- GET /api/admin/categories
  - Description: List categories (paginated if many).
  - Query: `page`, `limit`, `search` (optional)
  - Auth: admin
  - Response: `{ success: true, data: [ { _id, name, description, duration, taskCount } ], pagination }`

- GET /api/admin/categories/:id
  - Description: Get single category detail
  - Response: `{ success: true, data: { _id, name, description, tasks: [taskIds], createdAt } }`

- POST /api/admin/categories
  - Description: Create category
  - Body: `{ name: string, description?: string, duration?: number }`
  - Response: `{ success: true, data: { _id, name, description, duration } }`

- PUT /api/admin/categories/:id
  - Description: Update category
  - Body: partial `{ name?, description?, duration? }`

- DELETE /api/admin/categories/:id
  - Description: Delete category (should check and reassign or reject if tasks exist)

---

## Tasks

- GET /api/admin/tasks
  - Query: `page`, `limit`, `category`, `student` (filter by assigned student), `search` (title/description)
  - Response: `{ success: true, data: [ { _id, title, description, category: { _id, name }, assignedTo: [userIds], createdAt } ], pagination }

- GET /api/admin/tasks/:id
  - Response: task detail including submissions array

- POST /api/admin/tasks
  - Body: `{ title, description, categoryId, dueDate?, assignedTo?: [userIds], meta?: {} }`

- PUT /api/admin/tasks/:id
  - Body: partial updates

- DELETE /api/admin/tasks/:id

---

## Submissions

- GET /api/admin/submissions
  - Query: `page`, `limit`, `status`, `task`, `student`, `dateFrom`, `dateTo`
  - Response: flattened list of submissions with student, task and category populated

- GET /api/admin/submissions/:submissionId
  - Response: detailed submission

- POST /api/admin/submissions/:submissionId/grade
  - Body: `{ status: 'graded-passed'|'graded-failed'|'grading'|'reviewed', score?: number, notes?: string }`
  - Description: admin can grade/approve/reject a submission

- POST /api/admin/submissions/:submissionId/comment
  - Body: `{ message }` append comment to submission

---

## Students

- GET /api/admin/students
  - Query: `page`, `limit`, `search`, `category`, `status` (active/completed), `sort`
  - Response: students with enrollments and aggregated counts

- GET /api/admin/students/:id
  - Response: student profile + enrollments + progress

- PUT /api/admin/students/:id
  - Body: `{ firstName?, lastName?, email?, role?, metadata?: {} }` (admin-only changes)

- POST /api/admin/students/:id/change-category
  - Body: `{ categoryId }` move student to a different category

- POST /api/admin/students/:id/suspend
  - Body: `{ reason?, until?: date }`

- DELETE /api/admin/students/:id

---

## Announcements

- GET /api/admin/announcements
  - List announcements

- POST /api/admin/announcements
  - Body: `{ title, body, target: 'all'|'category:<id>'|'students:[ids]', scheduledAt?: date }`

---

## Exports

- GET /api/admin/exports/users?format=csv
  - Triggers a CSV export of users; returns a pre-signed URL or stream

- GET /api/admin/exports/submissions?format=csv

---

## Analytics

- GET /api/admin/analytics
  - Query: `from`, `to`, `granularity=day|week|month`
  - Response: `{ totalStudents, totalTasks, totalCategories, totalSubmissions, series: { activeUsers: [{date, value}], submissions: [{date, value}] }, submissionsByStatus: [{ _id: status, count }] }`

---

## Settings

- GET /api/admin/settings
  - Response: feature flags and basic config

- PUT /api/admin/settings
  - Body: `{ maintenanceMode?: boolean, features?: { exports?: boolean, announcements?: boolean, dripScheduling?: boolean }, version?: string }

---

## Security & Notes
- All admin endpoints must use `protect` and `authorize('admin')` middleware.
- Validate input with a schema validator (Joi / express-validator) to avoid broken data.
- Pagination: include `total` and `pages` in responses where appropriate.
- For heavy/filterable lists prefer server-side search (accept `search` param) and indexes on commonly searched fields (`email`, `firstName`, `lastName`, `title`).

## Sample response (students list)

```json
{
  "success": true,
  "data": [
    {
      "_id": "64b...",
      "firstName": "Ali",
      "lastName": "Khan",
      "email": "ali@example.com",
      "enrollments": [ { "category": { "_id": "..", "name": "Web Dev" }, "status": "active" } ],
      "stats": { "completedTasks": 12 }
    }
  ],
  "pagination": { "total": 134, "pages": 7, "currentPage": 1 }
}
```

---

If you'd like, I can now:
- Implement the Categories CRUD backend (routes + controllers + validation) and wire the frontend (option B), or
- Implement server-side student search (option C), or
- Expand the spec with request/response examples for each endpoint (more exhaustive).
