# Academic Collaboration Platform - Backend API

RESTful API for Academic Collaboration Platform with MySQL, Sequelize ORM, JWT Authentication, Role-based Authorization, and Real-time Messaging.

## Features

- 🚀 Express.js REST API
- 🗄️ MySQL 8.0+ with Sequelize ORM
- 🔐 JWT Authentication (Access + Refresh Tokens)
- 👥 Role-based Authorization (Student, Lecturer, Admin)
- 💬 Real-time Chat with Threading & Reactions
- 📚 Swagger UI Documentation
- 🔒 Password hashing with bcrypt
- 📝 Comprehensive Models (14 tables across 2 modules)
- ♻️ Auto-refresh token rotation
- 🔑 Slack workspace integration support
- ✅ Input validation & constraints
- 📁 Modular architecture (AcademicCore + ChatEngine)

## Technology Stack

- **Database**: MySQL 8.0+
- **ORM**: Sequelize 6.x
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## Database Modules

### 1. AcademicCore Module (9 tables)
- `users` - Students, Lecturers, and Admins with password hashing
- `semesters` - Academic term management
- `classes` - Course sections with Slack integration
- `class_members` - Class enrollment (M:M junction table)
- `topics` - Project topics with full-text search
- `groups` - Student project teams
- `group_members` - Group membership (M:M junction table)
- `milestones` - Project deadlines with weight
- `submissions` - Group submissions with grading

### 2. ChatEngine Module (5 tables)
- `channels` - Chat rooms (PUBLIC/PRIVATE)
- `channel_members` - Channel membership (M:M junction table)
- `messages` - Messages with threading support
- `attachments` - File attachments
- `reactions` - Emoji reactions

## Project Structure

```
.
├── server.js                         # Server entry point
├── init-database.js                  # Database initialization script
├── seed-database.js                  # Sample data seeder
├── database-schema.sql               # MySQL DDL
├── DATABASE_DOCUMENTATION.md         # Complete database guide
├── src/
│   ├── app.js                       # Express app setup
│   ├── config/
│   │   ├── app.config.js           # App configuration
│   │   ├── database.sequelize.js   # MySQL/Sequelize connection
│   │   ├── jwt.config.js           # JWT settings
│   │   └── swagger.config.js       # Swagger/OpenAPI setup
│   ├── controllers/
│   │   ├── auth.controller.js      # Authentication logic
│   │   └── user.controller.js      # User CRUD operations
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification & authorization
│   │   └── logger.middleware.js    # Request logging
│   ├── models/                      # Sequelize models
│   │   ├── index.js                # Main export point
│   │   ├── README.md               # Models documentation
│   │   ├── academicCore/           # Academic management module
│   │   │   ├── index.js           # Module exports & associations
│   │   │   ├── user.model.js      # User with bcrypt hooks
│   │   │   ├── semester.model.js
│   │   │   ├── class.model.js
│   │   │   ├── classMember.model.js
│   │   │   ├── topic.model.js
│   │   │   ├── group.model.js
│   │   │   ├── groupMember.model.js
│   │   │   ├── milestone.model.js
│   │   │   └── submission.model.js
│   │   └── chatEngine/             # Messaging module
│   │       ├── index.js           # Module exports & associations
│   │       ├── channel.model.js
│   │       ├── channelMember.model.js
│   │       ├── message.model.js   # With threading support
│   │       ├── attachment.model.js
│   │       └── reaction.model.js  # With toggle method
│   ├── routes/
│   │   ├── auth.routes.js          # Auth endpoints
│   │   ├── user.routes.js          # User endpoints
│   │   └── api.routes.js           # Main router
│   ├── services/
│   │   ├── auth.service.js         # Auth business logic
│   │   ├── email.service.js        # Email notifications
│   │   └── user.service.js         # User management
│   ├── constants/
│   │   └── messages.js             # Centralized messages
│   └── utils/
│       └── helpers.js              # Utility functions
├── public/                          # Static files
├── tests/                           # Test files (Jest)
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment template
└── README.md                        # This file
```

## Installation

### 1. Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- Git

### 2. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd BE

# Install dependencies
npm install
```

### 3. Database Setup

#### Option A: Using SQL Script (Recommended)

```bash
# Connect to MySQL
mysql -u root -p

# Create database and tables
source database-schema.sql
```

#### Option B: Using init script

```bash
# 1. Create database manually
mysql -u root -p -e "CREATE DATABASE academic_collaboration_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Run initialization script
node init-database.js
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=academic_collaboration_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server
NODE_ENV=development
PORT=5000

# CORS
# Comma-separated list for explicit allowlist (optional).
# Vercel preview/production domains are also accepted automatically.
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,https://your-production-frontend.vercel.app
```

### 5. Seed Sample Data (Optional)

```bash
node seed-database.js
```

This creates:
- 1 Admin, 2 Lecturers, 10 Students
- 2 Semesters, 2 Classes
- 3 Topics, 2 Groups
- Milestones, Submissions
- Chat channels with messages

**Test Credentials:**
- Admin: `admin@gmail.com` / `admin123`
- Lecturer: `nguyenvana@gmail.com` / `password123`
- Student: `student1@gmail.com` / `password123`

### 6. Start Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start

# Run tests
npm test
```

Server runs on: `http://localhost:5000`

## Deployment Notes

- Render backend now accepts localhost origins, any origins listed in `CORS_ALLOWED_ORIGINS`, and secure Vercel preview/production domains (`https://*.vercel.app`).
- If you use a custom frontend domain, add it to `CORS_ALLOWED_ORIGINS` in Render.
- After changing environment variables on Render, trigger a redeploy so preflight requests use the new CORS policy.

## Quick Start
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

## API Architecture

This project follows the **Layered Architecture** pattern:

1. **Routes Layer**: HTTP endpoint definitions
2. **Controllers Layer**: Request/response handling
3. **Services Layer**: Business logic
4. **Models Layer**: Data access with Sequelize ORM

## Database Usage Examples

### Basic Operations

```javascript
const { User, Class, Group, Message } = require('./src/models');

// Create user
const student = await User.create({
  fullName: 'John Doe',
  email: 'john@gmail.com',
  passwordHash: 'password123', // Auto-hashed via hook
  role: 'Student'
});

// Login verification
const user = await User.findOne({ where: { email: 'john@gmail.com' } });
const isValid = await user.comparePassword('password123');

// Update online status
await user.updateOnlineStatus(true);
```

### Querying with Associations

```javascript
// Get class with all members
const classData = await Class.findByPk(classId, {
  include: [
    { model: User, as: 'lecturer' },
    { model: User, as: 'students', through: { attributes: ['enrolledAt'] } },
    { model: Group, include: [{ model: Topic }] }
  ]
});

// Get messages with sender and reactions
const messages = await Message.findAll({
  where: { channelId },
  include: [
    { model: User, as: 'sender', attributes: ['userId', 'fullName', 'avatarUrl'] },
    { model: Reaction, include: [{ model: User, as: 'user' }] }
  ],
  order: [['createdAt', 'DESC']],
  limit: 50
});
```

### Transactions

```javascript
const { sequelize } = require('./src/models');

const t = await sequelize.transaction();
try {
  const group = await Group.create({ ... }, { transaction: t });
  await GroupMember.bulkCreate([...], { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

## API Endpoints

### Authentication (🔓 Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Reset password |

### Users (🔐 Protected)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Lecturer | List all users |
| GET | `/api/users/me` | Any | Get own profile |
| GET | `/api/users/:id` | Any | Get user by ID |
| PUT | `/api/users/:id` | Own/Lecturer | Update user |
| DELETE | `/api/users/:id` | Lecturer | Delete user |

### Semesters

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/semesters` | Any | List semesters |
| POST | `/api/semesters` | Lecturer | Create semester |
| GET | `/api/semesters/:id` | Any | Get semester |
| PUT | `/api/semesters/:id` | Lecturer | Update semester |

### Classes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/classes` | Any | List classes |
| POST | `/api/classes` | Lecturer | Create class |
| GET | `/api/classes/:id` | Any | Get class details |
| POST | `/api/classes/:id/enroll` | Student | Enroll in class |
| GET | `/api/classes/:id/members` | Any | List class members |

### Groups & Topics

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/topics` | Any | List topics |
| POST | `/api/topics` | Lecturer | Create topic |
| POST | `/api/groups` | Student | Create group |
| POST | `/api/groups/:id/join` | Student | Join group |
| GET | `/api/groups/:id/members` | Any | List group members |

### Chat & Messages

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/channels` | Any | List channels |
| POST | `/api/channels` | Any | Create channel |
| POST | `/api/channels/:id/join` | Any | Join channel |
| GET | `/api/channels/:id/messages` | Member | Get messages |
| POST | `/api/messages` | Member | Send message |
| POST | `/api/messages/:id/react` | Member | Add reaction |

**Swagger Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## Model Features

### Password Security
- Auto-hashing with bcrypt (10 rounds)
- `comparePassword()` instance method
- Never exposes `passwordHash` in JSON

### Online Status
- `isOnline` boolean + `lastSeenAt` timestamp
- `updateOnlineStatus()` method

### Message Threading
- Self-referencing `parentMsgId`
- `isThread()` method

### Emoji Reactions
- `Reaction.toggleReaction()` - Add/remove
- `Reaction.getReactionSummary()` - Aggregate counts

### Soft Deletes
- Messages: `isDeleted` flag + `softDelete()` method

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test

# Watch mode
npm run test:watch
```

## Deployment

### Environment Variables

Set these in production:

```env
NODE_ENV=production
DB_HOST=your-mysql-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-very-long-secret-key
```

### Database Migration

```bash
# Create migration
npx sequelize-cli migration:generate --name initial-schema

# Run migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo
```

## Documentation

- [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md) - Complete database guide
- [src/models/README.md](src/models/README.md) - Models documentation
- [Swagger UI](http://localhost:5000/api-docs) - Interactive API docs

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
node -e "require('./src/models').testConnection()"
```

### Reset Database

```bash
# Drop and recreate all tables
mysql -u root -p academic_collaboration_db < database-schema.sql

# Re-seed data
node seed-database.js
```

### Debug Mode

Enable SQL logging in [src/config/database.sequelize.js](src/config/database.sequelize.js):

```javascript
const sequelize = new Sequelize({
  ...config,
  logging: console.log // Enable SQL logging
});
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## Project Status

✅ **Completed:**
- Database schema design (14 models)
- MySQL + Sequelize implementation
- User authentication with JWT
- Password hashing with bcrypt
- Model associations (1:M, M:M)
- Database documentation

🚧 **In Progress:**
- API controllers implementation
- WebSocket for real-time chat
- File upload for attachments

📋 **Planned:**
- Notification system
- Email service integration
- Analytics dashboard
- Mobile API optimization

## License

MIT License

## Support

For issues or questions:
- Check [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md)
- Review [src/models/README.md](src/models/README.md)
- Open an issue on GitHub

---

**Built with ❤️ for Academic Collaboration**

