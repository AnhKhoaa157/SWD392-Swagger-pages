# Models Directory Structure

This directory contains all Sequelize models organized into two main modules:

## Directory Structure

```
models/
├── index.js                    # Main export point
├── academicCore/                # Academic management module
│   ├── index.js                # Module exports & associations
│   ├── user.model.js           # Students & Lecturers
│   ├── semester.model.js       # Academic terms
│   ├── class.model.js          # Course sections
│   ├── classMember.model.js    # Class enrollment (M:M)
│   ├── topic.model.js          # Project topics
│   ├── group.model.js          # Student teams
│   ├── groupMember.model.js    # Group membership (M:M)
│   ├── milestone.model.js      # Project deadlines
│   └── submission.model.js     # Submissions with grading
└── chatEngine/                  # Messaging module
    ├── index.js                # Module exports & associations
    ├── channel.model.js        # Chat rooms
    ├── channelMember.model.js  # Channel membership (M:M)
    ├── message.model.js        # Messages with threading
    ├── attachment.model.js     # File attachments
    └── reaction.model.js       # Emoji reactions
```

## Usage

### Import All Models

```javascript
const {
  sequelize,
  testConnection,
  syncDatabase,
  // AcademicCore models
  User,
  Semester,
  Class,
  ClassMember,
  Topic,
  Group,
  GroupMember,
  Milestone,
  Submission,
  // ChatEngine models
  Channel,
  ChannelMember,
  Message,
  Attachment,
  Reaction
} = require('./models');
```

### Import Specific Module

```javascript
// Only AcademicCore models
const AcademicCore = require('./models/academicCore');
const { User, Class, Group } = AcademicCore;

// Only ChatEngine models
const ChatEngine = require('./models/chatEngine');
const { Channel, Message, Reaction } = ChatEngine;
```

## Model Features

### User Model
- **Password Hashing**: Automatic bcrypt hashing via hooks
- **Instance Methods**: 
  - `comparePassword(plainPassword)` - Verify password
  - `updateOnlineStatus(isOnline)` - Update online status
  - `toJSON()` - Exclude sensitive fields
- **Associations**: 
  - Classes (as lecturer)
  - Groups (as member)
  - Channels (as member)
  - Messages (as sender)

### Semester Model
- **Validation**: End date must be after start date
- **Instance Methods**: `isCurrent()` - Check if semester is active
- **Associations**: Classes, Milestones

### Class Model
- **Fields**: slackSpaceName (unique)
- **Associations**: 
  - Semester (belongsTo)
  - Lecturer (belongsTo User)
  - Students (belongsToMany through ClassMember)

### Topic Model
- **Full-Text Search**: Enabled on title and description
- **Associations**: Groups, Creator (User)

### Group Model
- **Unique Constraint**: (classId, groupName)
- **Associations**: 
  - Class, Topic
  - Students (belongsToMany through GroupMember)
  - Submissions

### Milestone Model
- **Instance Methods**: `isOverdue()` - Check if past deadline
- **Associations**: Class, Submissions

### Submission Model
- **Unique Constraint**: (groupId, milestoneId) - One submission per milestone
- **Associations**: Group, Milestone, Grader (User)

### Channel Model
- **Logic**: PUBLIC requires classId, PRIVATE requires groupId
- **Associations**: 
  - Class (nullable)
  - Group (nullable)
  - Members (belongsToMany through ChannelMember)
  - Messages

### ChannelMember Model
- **Instance Methods**: `markAsRead()` - Update last read timestamp
- **Associations**: Channel, User

### Message Model
- **Threading**: Self-referencing via parentMsgId
- **Mentions**: JSON array of user IDs
- **Instance Methods**: 
  - `isThread()` - Check if reply
  - `softDelete()` - Mark as deleted
- **Associations**: 
  - Channel
  - Sender (User)
  - Parent Message (self-reference)
  - Replies (self-reference)
  - Attachments
  - Reactions

### Attachment Model
- **Instance Methods**: 
  - `isImage()` - Check if image file
  - `isDocument()` - Check if document
  - `getFormattedSize()` - Human-readable file size
- **Associations**: Message, Uploader (User)

### Reaction Model
- **Unique Constraint**: (messageId, userId, emoji)
- **Static Methods**: 
  - `toggleReaction({ messageId, userId, emoji, emojiName })` - Add/remove
  - `getReactionSummary(messageId)` - Aggregate counts
- **Associations**: Message, User

## Common Patterns

### Creating with Associations

```javascript
// Create user
const user = await User.create({
  fullName: 'John Doe',
  email: 'john@example.com',
  passwordHash: 'password123', // Auto-hashed
  role: 'Student'
});

// Create class with students
const classObj = await Class.create({
  semesterId: semester.semesterId,
  lecturerId: lecturer.userId,
  className: 'Advanced Web Development'
});

await classObj.addStudent(student.userId, {
  through: { status: 'Active' }
});
```

### Querying with Includes

```javascript
// Get class with all details
const classData = await Class.findByPk(classId, {
  include: [
    { model: Semester },
    { model: User, as: 'lecturer' },
    { model: User, as: 'students' }
  ]
});

// Get messages with sender and reactions
const messages = await Message.findAll({
  where: { channelId },
  include: [
    { model: User, as: 'sender' },
    { model: Reaction, include: [{ model: User }] },
    { model: Attachment }
  ]
});
```

### Transactions

```javascript
const t = await sequelize.transaction();

try {
  const group = await Group.create({ ... }, { transaction: t });
  await GroupMember.create({ ... }, { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

## Validation Rules

All models include comprehensive validation:
- **Email**: Valid format, unique
- **Dates**: Proper format, logical constraints
- **Enums**: Restricted to defined values
- **Lengths**: Min/max character limits
- **Foreign Keys**: Referential integrity

## Hooks

### User Model
- `beforeCreate`: Hash password if changed
- `beforeUpdate`: Hash password if changed

### All Models
- `timestamps: true`: Auto-manage createdAt/updatedAt

## Indexes

All models have strategic indexes:
- **Primary Keys**: UUID with DEFAULT (UUID())
- **Foreign Keys**: All indexed
- **Unique Constraints**: Composite where needed
- **Search Fields**: Full-text indexes on text content
- **Query Optimization**: Composite indexes for common queries

## Testing Models

```javascript
const { testConnection, syncDatabase } = require('./models');

async function init() {
  // Test connection
  await testConnection();
  
  // Sync tables (development only)
  await syncDatabase({ alter: true });
  
  console.log('Models ready!');
}
```

## Migration Notes

For production, use Sequelize migrations instead of sync:

```bash
npx sequelize-cli migration:generate --name create-tables
npx sequelize-cli db:migrate
```

## Related Files

- `../config/database.sequelize.js` - Database connection configuration
- `../../database-schema.sql` - Raw MySQL DDL
- `../../DATABASE_DOCUMENTATION.md` - Complete usage guide

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Include associations** to avoid N+1 queries
3. **Validate input** before creating/updating
4. **Use instance methods** for domain logic
5. **Index frequently queried fields**
6. **Never expose passwordHash** (use toJSON override)
7. **Use eager loading** with `include` for related data
8. **Paginate large result sets** with `limit` and `offset`

## Support

For questions or issues:
1. Check `DATABASE_DOCUMENTATION.md` for examples
2. Review Sequelize docs: https://sequelize.org/docs/v6/
3. Check model-specific comments in source files
