# Academic Collaboration Platform - Database Schema Documentation

## Overview
This database schema is designed for an **Academic Collaboration Platform** similar to Slack/Discord for educational purposes. The schema is divided into two main modules: **AcademicCore** and **ChatEngine**.

## Technology Stack
- **Database**: MySQL with Sequelize ORM
- **Node.js**: Express.js backend
- **Architecture**: Modular model structure (AcademicCore + ChatEngine)

---

## Module 1: AcademicCore

### Purpose
Manages the academic entities including users, classes, topics, groups, milestones, and submissions.

### Entities

#### 1. **User**
- Represents both Students and Lecturers
- Fields: `fullName`, `email`, `passwordHash`, `role`, `avatarURL`, `isOnline`, `status`
- Key Features:
  - Password hashing with bcrypt
  - Online status tracking
  - Role-based access control

#### 2. **Semester**
- Represents academic terms/semesters
- Fields: `name`, `startDate`, `endDate`, `status`
- Example: "Summer2024", "Fall2024"

#### 3. **Class**
- Represents a course section within a semester
- Fields: `semesterId`, `lecturerId`, `className`, `slackSpaceName`
- Relationships:
  - Belongs to `Semester`
  - Managed by `User` (Lecturer)
  - Has many `ClassMember` (Students)

#### 4. **ClassMember** (Junction Table)
- Links Students to Classes (Many-to-Many)
- Composite Key: `(classId, studentId)`
- Tracks enrollment date and status

#### 5. **Topic**
- Project ideas/topics proposed by lecturers
- Fields: `createdBy`, `title`, `descriptionFile`, `status`
- Can be assigned to multiple groups

#### 6. **Group**
- Project teams within a class
- Fields: `classId`, `topicId`, `groupName`, `maxMembers`
- Relationships:
  - Belongs to `Class`
  - Works on `Topic`
  - Has many `GroupMember` (Students)
  - Has one private `Channel`

#### 7. **GroupMember** (Junction Table)
- Links Students to Groups (Many-to-Many)
- Composite Key: `(groupId, studentId)`
- Supports roles: Leader, Member

#### 8. **Milestone**
- Project deadlines and deliverables
- Fields: `classId`, `name`, `deadline`, `weight`
- Used for tracking project progress

#### 9. **Submission**
- Project submissions by groups
- Fields: `groupId`, `milestoneId`, `linkRepo`, `grade`
- Unique per group per milestone
- Tracks grading and feedback

---

## Module 2: ChatEngine

### Purpose
Provides real-time messaging functionality similar to Slack/Discord.

### Entities

#### 1. **Channel**
- Chat rooms for communication
- Fields: `classId`, `groupId`, `name`, `type`
- Types:
  - **PUBLIC**: Class-wide channels (all class members)
  - **PRIVATE**: Group-specific channels (only group members)

#### 2. **ChannelMember** (Junction Table)
- Links Users to Channels (Many-to-Many)
- Composite Key: `(channelId, userId)`
- Tracks: `joinedAt`, `lastReadAt`, notification preferences

#### 3. **Message**
- Chat messages in channels
- Fields: `channelId`, `senderId`, `parentMsgId`, `content`
- Features:
  - Thread support via `parentMsgId`
  - Soft delete capability
  - Edit tracking
  - User mentions

#### 4. **Attachment**
- File attachments in messages
- Fields: `msgId`, `fileName`, `fileType`, `filePath`, `fileSize`
- Supports: images, documents, code files

#### 5. **Reaction**
- Emoji reactions to messages (like Slack reactions)
- Fields: `msgId`, `userId`, `emoji`
- Unique per user per emoji per message

---

## Key Relationships

### Academic Core Relationships

```
Semester (1) ----< (N) Class (1) ----< (N) ClassMember >---- (N) User (Student)
                         |
                         +----< (N) Group (1) ----< (N) GroupMember >---- (N) User (Student)
                                      |
                                      +---- (1) Topic (N) >----< (1) User (Lecturer)
                                      |
                                      +----< (N) Submission >---- (1) Milestone

User (Lecturer) (1) ----< (N) Topic
User (Lecturer) (1) ----< (N) Class
```

### Chat Engine Relationships

```
Class (1) ----< (N) Channel (PUBLIC)
Group (1) ----< (1) Channel (PRIVATE)
                    |
                    +----< (N) ChannelMember >---- (N) User
                    |
                    +----< (N) Message >---- (1) User (Sender)
                              |
                              +----< (N) Attachment
                              +----< (N) Reaction >---- (N) User
                              +----< (N) Message (Replies/Threads)
```

### Cross-Module Relationships

- `Channel.classId` → `Class._id`
- `Channel.groupId` → `Group._id`
- All entity creators/members reference `User._id`

---

## Usage Examples

### 1. Import Models

```javascript
// Import AcademicCore models
const {
  User,
  Semester,
  Class,
  ClassMember,
  Topic,
  Group,
  GroupMember,
  Milestone,
  Submission
} = require('./models/academicCore');

// Import ChatEngine models
const {
  Channel,
  ChannelMember,
  Message,
  Attachment,
  Reaction
} = require('./models/chatEngine');
```

### 2. Create a Class with Channel

```javascript
// Create a class
const newClass = await Class.create({
  semesterId: semesterId,
  lecturerId: lecturerId,
  className: 'SWD392_SE1801',
  slackSpaceName: '#SE1801'
});

// Create public channel for the class
const classChannel = await Channel.create({
  classId: newClass._id,
  name: 'general',
  type: 'PUBLIC',
  createdBy: lecturerId
});

// Add all class members to the channel
const classMembers = await ClassMember.find({ classId: newClass._id });
for (const member of classMembers) {
  await ChannelMember.create({
    channelId: classChannel._id,
    userId: member.studentId
  });
}
```

### 3. Create a Group with Private Channel

```javascript
// Create a group
const group = await Group.create({
  classId: classId,
  topicId: topicId,
  groupName: 'Team Alpha',
  maxMembers: 5
});

// Create private channel for the group
const groupChannel = await Channel.create({
  groupId: group._id,
  name: 'Team Alpha Chat',
  type: 'PRIVATE',
  createdBy: leaderId
});

// Add group members to the private channel
const groupMembers = await GroupMember.find({ groupId: group._id });
for (const member of groupMembers) {
  await ChannelMember.create({
    channelId: groupChannel._id,
    userId: member.studentId
  });
}
```

### 4. Send Message with Reactions

```javascript
// Send a message
const message = await Message.create({
  channelId: channelId,
  senderId: userId,
  content: 'Hello team! Let\'s discuss our project.',
  messageType: 'Text'
});

// Add reactions
await Reaction.create({
  msgId: message._id,
  userId: user1Id,
  emoji: '👍',
  emojiName: 'thumbsup'
});

await Reaction.create({
  msgId: message._id,
  userId: user2Id,
  emoji: '🔥',
  emojiName: 'fire'
});

// Get reaction summary
const reactions = await Reaction.getReactionSummary(message._id);
```

### 5. Create Thread/Reply

```javascript
// Reply to a message (create thread)
const reply = await Message.create({
  channelId: channelId,
  senderId: replyUserId,
  parentMsgId: originalMessage._id, // Reference parent message
  content: 'Great idea! I agree.',
  messageType: 'Text'
});

// Get all replies for a message
const replies = await Message.find({ parentMsgId: originalMessage._id })
  .populate('senderId', 'fullName avatarURL')
  .sort({ createdAt: 1 });
```

### 6. Submit and Grade Assignment

```javascript
// Group submits assignment
const submission = await Submission.create({
  groupId: groupId,
  milestoneId: milestoneId,
  linkRepo: 'https://github.com/team-alpha/project',
  description: 'Completed Sprint 1 with all features',
  status: 'Submitted'
});

// Lecturer grades submission
submission.grade = 95.5;
submission.feedback = 'Excellent work! Well-structured code.';
submission.gradedBy = lecturerId;
submission.gradedAt = new Date();
submission.status = 'Graded';
await submission.save();
```

---

## Indexes and Performance

### AcademicCore Indexes
- User: `email`, `role`, `isOnline`
- Class: `semesterId`, `lecturerId`, `slackSpaceName`
- Group: `classId + groupName` (unique)
- Submission: `groupId + milestoneId` (unique)

### ChatEngine Indexes
- Channel: `classId`, `groupId`, `type`
- Message: `channelId + createdAt`, `parentMsgId`
- Reaction: `msgId + userId + emoji` (unique)

---

## Data Integrity Rules

1. **Role Validation**:
   - Only Lecturers can create Topics and Classes
   - Only Students can join Groups

2. **Unique Constraints**:
   - One submission per group per milestone
   - Unique group name within a class
   - One private channel per group
   - One reaction per user per emoji per message

3. **Cascade Behavior**:
   - Soft delete for Messages
   - Archive for Channels

4. **Status Management**:
   - User: Online/Away/Offline
   - Class: Active/Inactive/Completed
   - Group: Forming/Active/Completed/Disbanded
   - Submission: Draft/Submitted/Graded/Late

---

## Migration from Old Schema

If migrating from the old schema, use these mappings:

```javascript
// Old schema
const oldGroup = require('./models/group.model');
const oldTopic = require('./models/topic.model');
const oldSemester = require('./models/semester.model');

// New schema
const { Group, Topic, Semester } = require('./models/academicCore');
```

---

## Files Structure

```
BE/
├── src/
│   ├── models/
│   │   ├── academicCore/
│   │   │   ├── user.model.js
│   │   │   ├── semester.model.js
│   │   │   ├── class.model.js
│   │   │   ├── classMember.model.js
│   │   │   ├── topic.model.js
│   │   │   ├── group.model.js
│   │   │   ├── groupMember.model.js
│   │   │   ├── milestone.model.js
│   │   │   ├── submission.model.js
│   │   │   └── index.js
│   │   │
│   │   ├── chatEngine/
│   │   │   ├── channel.model.js
│   │   │   ├── channelMember.model.js
│   │   │   ├── message.model.js
│   │   │   ├── attachment.model.js
│   │   │   ├── reaction.model.js
│   │   │   └── index.js
│   │   │
│   │   └── [old models for backward compatibility]
│   │
├── database-schema.sql (SQL reference)
└── DATABASE_SCHEMA.md (this file)
```

---

## Next Steps

1. **Update Controllers**: Modify controllers to use new model structure
2. **Update Routes**: Ensure routes reference correct models
3. **WebSocket Integration**: Implement Socket.io for real-time messaging
4. **File Upload**: Configure storage (AWS S3/Azure Blob) for attachments
5. **Testing**: Write unit tests for all models and relationships
6. **Migration Script**: Create data migration script from old to new schema

---

## Contact

For questions or issues with the schema, contact the development team.
