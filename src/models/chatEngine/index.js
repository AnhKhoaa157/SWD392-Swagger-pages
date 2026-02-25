/**
 * ChatEngine Module - Index with Associations
 * Central export point for all Chat Engine models
 */

const Channel = require('./channel.model');
const ChannelMember = require('./channelMember.model');
const Message = require('./message.model');
const Attachment = require('./attachment.model');
const Reaction = require('./reaction.model');

// Import User from AcademicCore for associations
const { User, Class, Group } = require('../academicCore');

// ====================================
// Define Associations
// ====================================

// Channel Associations
Channel.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Channel.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Channel.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Channel.hasMany(Message, { foreignKey: 'channelId', as: 'messages' });
Channel.belongsToMany(User, { through: ChannelMember, foreignKey: 'channelId', as: 'members' });

// ChannelMember Associations
ChannelMember.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
ChannelMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Message Associations
Message.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Message, { foreignKey: 'parentMsgId', as: 'parent' });
Message.hasMany(Message, { foreignKey: 'parentMsgId', as: 'replies' });
Message.hasMany(Attachment, { foreignKey: 'messageId', as: 'attachments' });
Message.hasMany(Reaction, { foreignKey: 'messageId', as: 'reactions' });

// Attachment Associations
Attachment.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Reaction Associations
Reaction.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Cross-module Associations
User.hasMany(Channel, { foreignKey: 'createdBy', as: 'channelsCreated' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });
User.hasMany(Attachment, { foreignKey: 'uploadedBy', as: 'attachments' });
User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions' });
User.belongsToMany(Channel, { through: ChannelMember, foreignKey: 'userId', as: 'channels' });

Class.hasMany(Channel, { foreignKey: 'classId', as: 'channels' });
Group.hasOne(Channel, { foreignKey: 'groupId', as: 'privateChannel' });

// ====================================
// Export Models
// ====================================

module.exports = {
    Channel,
    ChannelMember,
    Message,
    Attachment,
    Reaction
};
