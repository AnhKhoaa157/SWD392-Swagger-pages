# 🚀 API Documentation - Swagger Integration Complete

## Access Swagger UI
- **Local Development**: `http://localhost:3000/api-docs`
- **Production (Render)**: `https://swd392-swagger-pages.onrender.com/api-docs`

## 📋 All Documented API Endpoints

### 🔓 Authentication (Public)
- `POST /api/auth/register` - Register new user (Student/Lecturer)
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/verify-otp` - Verify OTP after registration
- `POST /api/auth/refresh-token` - Get new access token

### 👤 User Management
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

### 👨‍💼 Admin Management (Manager only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### 📅 Semesters (Manager only)
- `GET /api/semesters` - Get all semesters
- `GET /api/semesters/active` - Get active semester
- `GET /api/semesters/{id}` - Get semester by ID
- `POST /api/semesters` - Create new semester
- `PUT /api/semesters/{id}` - Update semester
- `DELETE /api/semesters/{id}` - Delete semester

### 🏫 Classes (Manager creates, Lecturers teach)
- `GET /api/classes` - Get all classes (filtered by role)
- `GET /api/classes/{id}` - Get class by ID
- `POST /api/classes` - Create new class (Manager only)
- `PUT /api/classes/{id}` - Update class (Manager only)
- `DELETE /api/classes/{id}` - Delete class (Manager only)

### 📋 Topics (Lecturer proposes → Manager approves → Groups register)
- `GET /api/topics` - Get all topics (with filters)
- `GET /api/topics/{id}` - Get topic by ID
- `POST /api/topics` - Create new topic (Lecturer only)
- `PUT /api/topics/{id}` - Update topic (Lecturer creator only)
- `DELETE /api/topics/{id}` - Delete topic (Lecturer or Manager)
- `PUT /api/topics/{id}/approve` - Approve topic (Manager only)
- `PUT /api/topics/{id}/reject` - Reject topic (Manager only)
- `POST /api/topics/{id}/register` - Register topic for group (Student only)

### 👥 Groups (Student self-created groups)
- `GET /api/groups` - Get all groups (filtered by role)
- `GET /api/groups/{id}` - Get group by ID with members
- `POST /api/groups` - Create new group (Student only)
- `PUT /api/groups/{id}` - Update group (Leader or Manager)
- `DELETE /api/groups/{id}` - Delete group (Lecturer or Manager)
- `GET /api/groups/{id}/members` - Get group members
- `POST /api/groups/{id}/members` - Add member to group (Student only)
- `DELETE /api/groups/{id}/members/{memberId}` - Remove member from group

### ❓ Questions (Q&A Management)
- `GET /api/questions` - Get all questions (filtered by role/group)
- `GET /api/questions/{id}` - Get question by ID with answers
- `POST /api/questions` - Create new question (Student only)
- `POST /api/questions/{id}/ask-ai` - **NEW** Get AI draft answer (Lecturer/Manager)
- `PUT /api/questions/{id}/escalate` - Escalate to Manager (Lecturer only)
- `PUT /api/questions/{id}/resolve` - Mark as resolved (Lecturer/Manager)
- `DELETE /api/questions/{id}` - Delete question (Manager only)

### 💬 Answers (Q&A Responses)
- `GET /api/questions/{questionId}/answers` - Get all answers for question
- `POST /api/questions/{questionId}/answers` - Post answer (Lecturer/Manager)
- `PUT /api/answers/{id}` - Update answer
- `DELETE /api/answers/{id}` - Delete answer (Manager only)

### ✅ Tasks (Group task board - Student-owned)
- `GET /api/tasks` - Get all visible tasks (role-filtered)
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create new task (Student only)
- `PUT /api/tasks/{id}` - Update task (Student creator only)
- `DELETE /api/tasks/{id}` - Delete task (Student creator only)

### 📤 Submissions (Assignment management)
- `GET /api/submissions` - Get all submissions (filtered by role)
- `GET /api/submissions/{id}` - Get submission by ID
- `POST /api/submissions` - Submit assignment (Student only)
- `PUT /api/submissions/{id}` - Update submission (Student only)
- `DELETE /api/submissions/{id}` - Delete submission (Student only)
- `PUT /api/submissions/{id}/grade` - Grade submission (Lecturer/Manager)

---

## 🔐 Authentication in Swagger UI

### How to Authenticate:
1. Use **POST /api/auth/login** with your credentials
2. Copy the `accessToken` from response
3. Click **"Authorize"** button in top-right corner
4. Paste in format: `Bearer {your-token}`
5. Now all subsequent requests will include the token

### Default Admin Account:
- Email: `admin@gmail.com`
- Password: `admin123`

---

## 📊 Flow Summary

### FLOW 1: Topic Management
```
Lecturer creates topic (PENDING)
    ↓
Manager approves/rejects
    ↓
Groups register for approved topic
```

### FLOW 2: Q&A System
```
Student asks question (WAITING_LECTURER)
    ↓
Lecturer answers OR escalates to Manager
    ↓
Manager can also get AI draft for assistance
    ↓
Answer marked as resolved
```

### FLOW 3: Task Board
```
Students create/manage tasks in their group
    ↓
Lecturers view tasks in their class groups
    ↓
Students update task status
```

### FLOW 4: Submissions
```
Students submit assignments
    ↓
Lecturers/Managers grade submissions
```

---

## 🎯 Key Features of New Documentation

✅ **Complete endpoint coverage** - All 50+ endpoints documented
✅ **Role-based descriptions** - Clear indication of who can access each endpoint
✅ **Request/Response schemas** - Full JSON structure examples
✅ **Query parameters** - Documented filters and options
✅ **Security info** - Bearer token authentication clearly marked
✅ **Error responses** - 401, 403, 404 documented for each endpoint
✅ **Tag organization** - Endpoints grouped by feature (Tasks, Questions, Groups, etc.)
✅ **Interactive testing** - Try out endpoints directly from Swagger UI
✅ **AI Integration** - New `/questions/{id}/ask-ai` endpoint documented
✅ **Task Management** - All task board endpoints fully documented
✅ **Submission Grading** - Assignment workflow fully documented

---

## 🧪 Testing Instructions

### Start Backend Server:
```bash
cd BE
npm start
```

### Open Swagger UI:
- Visit: `http://localhost:3000/api-docs`
- Or: `http://localhost:3000` to see API root with documentation link

### Test an Endpoint:
1. Click on any endpoint to expand it
2. Click "Try it out"
3. Fill in required parameters
4. Click "Execute"
5. View response in "Response" section

---

## 📝 File Changes Made

### Routes with New Swagger Documentation:
- ✅ `src/routes/task.routes.js` - Comprehensive task endpoint docs
- ✅ `src/routes/topic.routes.js` - Full topic management workflow docs
- ✅ `src/routes/group.routes.js` - Complete group CRUD docs
- ✅ `src/routes/submission.routes.js` - Full submission/grading docs
- ✅ `src/routes/class.routes.js` - Expanded class docs
- ✅ `src/routes/question.routes.js` - Added `/ask-ai` endpoint docs
- ✅ `src/routes/answer.routes.js` - Already documented (unchanged)
- ✅ `src/routes/user.routes.js` - Already documented (unchanged)
- ✅ `src/routes/auth.routes.js` - Already documented (unchanged)
- ✅ `src/routes/semester.routes.js` - Already documented (unchanged)

### Config Updates:
- ✅ `src/config/swagger.config.js` - Added 11 new tags for better UI organization

---

## 📌 Notes

- All endpoints are automatically documented using JSDoc comments in route files
- Swagger UI is regenerated on every server start
- The swagger spec follows OpenAPI 3.0.0 standard
- Bearer token authentication is required for all endpoints except `/auth/register` and `/auth/login`
- Role-based access control is enforced at middleware level

---

**Generated**: March 16, 2026
**Version**: 1.0.0
