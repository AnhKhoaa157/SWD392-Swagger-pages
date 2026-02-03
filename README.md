# SWD392 Backend API

RESTful API with MongoDB, JWT Authentication, Role-based Authorization, and Swagger Documentation.

## Features

- 🚀 Express.js REST API
- 🗄️ MongoDB with Mongoose ODM
- 🔐 JWT Authentication (Access + Refresh Tokens)
- 👥 Role-based Authorization (User, Admin)
- 📚 Swagger UI Documentation
- 🔒 Password hashing with bcryptjs
- 📝 Centralized error messages
- ♻️ Auto-refresh token rotation
- 🔑 Password reset functionality
- ✅ Input validation
- 📁 Professional folder structure

## Project Structure

```
.
├── server.js                         # Server entry point
├── src/
│   ├── app.js                       # Express app + MongoDB connection
│   ├── config/
│   │   ├── app.config.js           # App configuration
│   │   ├── database.config.js      # MongoDB connection
│   │   ├── jwt.config.js           # JWT settings
│   │   └── swagger.config.js       # Swagger/OpenAPI setup
│   ├── controllers/
│   │   ├── auth.controller.js      # Authentication logic
│   │   └── user.controller.js      # User CRUD operations
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification & authorization
│   │   └── logger.middleware.js    # Request logging
│   ├── models/
│   │   ├── user.model.js           # User schema (Mongoose)
│   │   ├── semester.model.js       # Semester schema
│   │   ├── topic.model.js          # Topic schema
│   │   ├── group.model.js          # Group schema
│   │   ├── question.model.js       # Question schema
│   │   ├── answer.model.js         # Answer schema
│   │   └── aisuggestion.model.js   # AI Suggestion schema
│   ├── routes/
│   │   ├── auth.routes.js          # Auth endpoints
│   │   ├── user.routes.js          # User endpoints
│   │   └── api.routes.js           # Main router
│   ├── constants/
│   │   └── messages.js             # Centralized messages
│   └── utils/
│       └── helpers.js              # Utility functions
├── public/                          # Static files
├── tests/                           # Test files
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment template
├── SWD392_API.postman_collection.json      # Postman collection
├── SWD392.postman_environment.json         # Postman environment
├── POSTMAN_SETUP.md                 # Postman setup guide
├── API_QUICK_REFERENCE.md           # API quick reference
└── README.md                        # This file
```

## Architecture

This project follows the **3-Layer Architecture** pattern:

- **Controllers Layer**: Handles HTTP requests/responses
- **Services Layer**: Contains business logic
- **Models Layer**: Data structures and database access

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://admin:12345678ka@cluster0.zhtoy0v.mongodb.net/?appName=Cluster0

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_min_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Account (auto-created on startup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
```

3. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

4. Access the API:
- **Swagger UI**: http://localhost:3000/api-docs
- **API Base**: http://localhost:3000/api

## 🚀 Quick Start with Postman

### Import Collection (1 Click)

1. Open Postman
2. Click **Import** → Drag both files:
   - `SWD392_API.postman_collection.json`
   - `SWD392.postman_environment.json`
3. Select **SWD392 Environment** (top-right dropdown)

### Test Your First API Call

1. Open folder: **Authentication** → **Login**
2. Click **Send**
3. ✅ **Tokens auto-saved!** All protected endpoints now work
4. Try: **Users** → **Get My Profile**

### Why This is Professional

- 🔓 **Authentication folder** = No Auth (public endpoints)
- 🔐 **Users folder** = Inherit Bearer Token (automatic auth)
- 🎯 **Auto-save scripts** in Login & Refresh
- 📁 **Folder-level authorization** = No repetition
- 🔄 **Environment variables** = Easy dev/prod switching

[→ Full Postman Setup Guide](POSTMAN_SETUP.md)

## API Documentation

### Authentication Endpoints (🔓 Public)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new account | `{name, email, password}` |
| POST | `/api/auth/login` | Login & get tokens | `{email, password}` |
| POST | `/api/auth/refresh` | Refresh access token | `{refreshToken}` |
| POST | `/api/auth/forgot-password` | Reset password | `{email, newPassword}` |

### User Endpoints (🔐 Protected)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/me` | User | Get my profile |
| GET | `/api/users/:id` | User/Admin | Get user by ID |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | User/Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

**Authorization Rules:**
- 👤 **User role**: Can view/update own profile only
- 👑 **Admin role**: Full access to all endpoints

[→ View in Swagger UI](http://localhost:3000/api-docs)

## License

ISC
