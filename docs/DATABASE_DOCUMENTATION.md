# Academic Collaboration Platform - Database Documentation

## Technology Stack

- **Database**: MySQL 8.0+
- **ORM**: Sequelize 6.x
- **Runtime**: Node.js 18+
- **Charset**: UTF-8 (utf8mb4_unicode_ci)
- **Storage Engine**: InnoDB

## Database Architecture

The database is split into two main modules:

### 1. **AcademicCore Module** (9 tables)
Handles academic management, user management, and project workflow.

**Tables:**
- `users` - Students and Lecturers
- `semesters` - Academic terms
- `classes` - Course sections
- `class_members` - Class enrollment (M:M junction)
- `topics` - Project topics
- `groups` - Student project teams
- `group_members` - Group membership (M:M junction)
- `milestones` - Project deadlines
- `submissions` - Group submissions with grading

### 2. **ChatEngine Module** (5 tables)
Handles real-time messaging and collaboration.

**Tables:**
- `channels` - Chat rooms (public/private)
- `channel_members` - Channel membership (M:M junction)
- `messages` - Chat messages with threading
- `attachments` - File attachments
- `reactions` - Emoji reactions

## Installation & Setup

### 1. Database Creation

```bash
# Connect to MySQL
mysql -u root -p

# Create database
source database-schema.sql
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=academic_collaboration_db
DB_USER=root
DB_PASSWORD=your_password
```

### 3. Install Dependencies

```bash
npm install sequelize mysql2 bcrypt dotenv
```

### 4. Initialize Sequelize

```javascript
const { sequelize, testConnection, syncDatabase } = require('./src/models');

// Test connection
await testConnection();

// Sync models (creates/updates tables)
await syncDatabase({ alter: true }); // Use in development only
```

## Usage Examples

### Connection Test

```javascript
const { testConnection } = require('./src/models');

async function init() {
  await testConnection();
  console.log('Database ready!');
}
```

### User Management

```javascript
const { User } = require('./src/models');

// Create user
const student = await User.create({
  fullName: 'Nguyen Van A',
  email: 'nguyenvana@gmail.com',
  passwordHash: 'plainPassword123', // Will be hashed via hook
  role: 'Student'
});

// Login (password verification)
const user = await User.findOne({ where: { email: 'nguyenvana@gmail.com' } });
const isValid = await user.comparePassword('plainPassword123');

// Update online status
await user.updateOnlineStatus(true);

// Get all lecturers
const lecturers = await User.findAll({
  where: { role: 'Lecturer' }
});
```

### Semester & Class Management

```javascript
const { Semester, Class, ClassMember } = require('./src/models');

// Create semester
const semester = await Semester.create({
  name: 'Spring 2024',
  startDate: '2024-01-15',
  endDate: '2024-05-30',
  status: 'Active'
});

// Check if semester is current
if (semester.isCurrent()) {
  console.log('This semester is active');
}

// Create class
const classObj = await Class.create({
  semesterId: semester.semesterId,
  lecturerId: lecturerId, // UUID of lecturer
  className: 'SWD392 - Software Architecture',
  slackSpaceName: 'swd392-spring2024'
});

// Enroll student
await ClassMember.create({
  classId: classObj.classId,
  studentId: studentId,
  status: 'Active'
});
```

### Group & Topic Management

```javascript
const { Topic, Group, GroupMember } = require('./src/models');

// Create topic
const topic = await Topic.create({
  createdBy: lecturerId,
  title: 'E-commerce Platform',
  description: 'Build a full-stack e-commerce application',
  status: 'Approved',
  maxGroups: 3
});

// Create group
const group = await Group.create({
  classId: classId,
  topicId: topic.topicId,
  groupName: 'Team Alpha',
  maxMembers: 5
});

// Add members
await GroupMember.create({
  groupId: group.groupId,
  studentId: studentId,
  role: 'Leader'
});
```

### Milestone & Submission Management

```javascript
const { Milestone, Submission } = require('./src/models');

// Create milestone
const milestone = await Milestone.create({
  classId: classId,
  name: 'Sprint 1 - Backend API',
  deadline: '2024-03-15 23:59:59',
  weight: 20.00
});

// Check if overdue
if (milestone.isOverdue()) {
  console.log('Milestone is overdue!');
}

// Submit work
const submission = await Submission.create({
  groupId: group.groupId,
  milestoneId: milestone.milestoneId,
  linkRepo: 'https://github.com/team-alpha/project',
  description: 'Completed all API endpoints'
});

// Grade submission
submission.grade = 85.50;
submission.feedback = 'Good work, but needs more error handling';
submission.gradedBy = lecturerId;
submission.gradedAt = new Date();
submission.status = 'Graded';
await submission.save();
```

### Chat Management

```javascript
const { Channel, ChannelMember, Message, Reaction } = require('./src/models');

// Create public channel for class
const channel = await Channel.create({
  classId: classId,
  name: 'General Discussion',
  type: 'PUBLIC',
  createdBy: lecturerId
});

// Join channel
const membership = await ChannelMember.create({
  channelId: channel.channelId,
  userId: studentId,
  role: 'Member'
});

// Mark as read
await membership.markAsRead();

// Send message
const message = await Message.create({
  channelId: channel.channelId,
  senderId: studentId,
  content: 'Hello everyone!',
  messageType: 'Text',
  mentions: JSON.stringify([lecturerId]) // JSON array
});

// Reply to message (thread)
const reply = await Message.create({
  channelId: channel.channelId,
  senderId: anotherStudentId,
  parentMsgId: message.messageId, // Creates thread
  content: 'Hi there!',
  messageType: 'Text'
});

// Check if message is thread
if (reply.isThread()) {
  console.log('This is a reply');
}

// Add reaction
await Reaction.toggleReaction({
  messageId: message.messageId,
  userId: studentId,
  emoji: '👍',
  emojiName: 'thumbs_up'
});

// Get reaction summary
const reactionSummary = await Reaction.getReactionSummary(message.messageId);
// Returns: [{ emoji: '👍', emojiName: 'thumbs_up', count: 5, users: [...] }]

// Soft delete message
await message.softDelete();
```

### Complex Queries with Associations

```javascript
// Get class with all members
const classWithMembers = await Class.findByPk(classId, {
  include: [
    {
      model: User,
      as: 'lecturer',
      attributes: ['userId', 'fullName', 'email']
    },
    {
      model: User,
      as: 'students',
      through: { attributes: ['enrolledAt', 'status'] }
    }
  ]
});

// Get group with members and topic
const groupWithDetails = await Group.findByPk(groupId, {
  include: [
    { model: Topic, as: 'topic' },
    {
      model: User,
      as: 'members',
      through: { attributes: ['role', 'joinedAt'] }
    }
  ]
});

// Get messages with sender and reactions
const messages = await Message.findAll({
  where: { channelId: channelId },
  include: [
    {
      model: User,
      as: 'sender',
      attributes: ['userId', 'fullName', 'avatarUrl']
    },
    {
      model: Reaction,
      as: 'reactions',
      include: [{ model: User, as: 'user' }]
    },
    {
      model: Attachment,
      as: 'attachments'
    }
  ],
  order: [['createdAt', 'ASC']]
});
```

### Transactions

```javascript
const { sequelize } = require('./src/models');

// Create group with members atomically
const transaction = await sequelize.transaction();

try {
  const group = await Group.create({
    classId: classId,
    topicId: topicId,
    groupName: 'Team Beta'
  }, { transaction });

  await GroupMember.bulkCreate([
    { groupId: group.groupId, studentId: student1Id, role: 'Leader' },
    { groupId: group.groupId, studentId: student2Id, role: 'Member' }
  ], { transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Search Queries

```javascript
const { Op } = require('sequelize');

// Full-text search on topics
const topics = await Topic.findAll({
  where: {
    [Op.or]: [
      sequelize.literal(`MATCH(title, description) AGAINST('${searchTerm}' IN NATURAL LANGUAGE MODE)`)
    ]
  }
});

// Search users by name or email
const users = await User.findAll({
  where: {
    [Op.or]: [
      { fullName: { [Op.like]: `%${query}%` } },
      { email: { [Op.like]: `%${query}%` } }
    ]
  }
});

// Get online users
const onlineUsers = await User.findAll({
  where: { isOnline: true }
});
```

## Key Features

### 1. Password Security
- Passwords automatically hashed using bcrypt (10 rounds)
- Implemented via Sequelize hooks (beforeCreate, beforeUpdate)
- Password comparison via instance method `comparePassword()`

### 2. Online Status Tracking
- `isOnline` boolean field
- `lastSeenAt` timestamp
- Instance method `updateOnlineStatus(status)`

### 3. Message Threading
- Self-referencing foreign key `parentMsgId`
- Instance method `isThread()`
- Supports nested conversations

### 4. Soft Deletes
- Messages have `isDeleted` flag
- Instance method `softDelete()`
- Preserves data integrity

### 5. Emoji Reactions
- Static method `toggleReaction()` - add/remove reaction
- Static method `getReactionSummary()` - aggregate counts
- Unique constraint prevents duplicate reactions

### 6. File Attachments
- Instance methods: `isImage()`, `isDocument()`, `getFormattedSize()`
- Supports multiple file types
- Thumbnail generation support

## Data Validation

### Built-in Constraints
- **UNIQUE**: email, class+groupName, group+milestone, etc.
- **NOT NULL**: Required fields enforced
- **CHECK**: endDate > startDate for semesters
- **ENUM**: Status fields, role fields
- **DEFAULT**: UUID generation, timestamps, default values

### Sequelize Validators
See individual model files for comprehensive validation rules.

## Indexing Strategy

### Single-Column Indexes
- Primary keys (UUID)
- Foreign keys
- Status fields (frequent filtering)
- Email (login queries)

### Composite Indexes
- `(class_id, group_name)` - Unique group names per class
- `(channel_id, created_at)` - Message pagination
- `(semester_id, lecturer_id)` - Class filtering

### Full-Text Indexes
- `topics.title, topics.description` - Topic search
- `messages.content` - Message search

## Performance Tips

1. **Use indexes wisely**: All foreign keys indexed
2. **Eager loading**: Use `include` to avoid N+1 queries
3. **Pagination**: Use `limit` and `offset` for large datasets
4. **Raw queries**: Use for complex aggregations
5. **Connection pooling**: Configured in database.sequelize.js

## Migration Strategy

### Development
```javascript
await syncDatabase({ alter: true }); // Auto-update tables
```

### Production
```bash
# Use Sequelize migrations
npx sequelize-cli migration:generate --name initial-schema
npx sequelize-cli db:migrate
```

## Backup & Restore

### Backup
```bash
mysqldump -u root -p academic_collaboration_db > backup.sql
```

### Restore
```bash
mysql -u root -p academic_collaboration_db < backup.sql
```

## Security Considerations

1. **Passwords**: Never store plain text, always use bcrypt
2. **SQL Injection**: Use parameterized queries (Sequelize handles this)
3. **Connection**: Use environment variables for credentials
4. **Permissions**: Grant minimal required database privileges
5. **Validation**: Always validate input before database operations

## Troubleshooting

### Connection Issues
```javascript
// Test connection
const { testConnection } = require('./src/models');
await testConnection();
```

### Sync Issues
```javascript
// Force sync (drops tables - use carefully!)
await syncDatabase({ force: true });
```

### Query Debugging
```javascript
// Enable SQL logging
const sequelize = new Sequelize({
  logging: console.log // or false to disable
});
```

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

## License

MIT License - Academic Collaboration Platform
