/**
 * Channel Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllChannels,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel,
    addChannelMember,
    removeChannelMember,
    getChannelMembers
} = require('../controllers/channel.controller');
const { getChannelMessages } = require('../controllers/message.controller');

router.route('/').get(getAllChannels).post(createChannel);
router.route('/:id').get(getChannelById).put(updateChannel).delete(deleteChannel);
router.route('/:id/members').get(getChannelMembers).post(addChannelMember);
router.delete('/:id/members/:memberId', removeChannelMember);
router.get('/:channelId/messages', getChannelMessages);

module.exports = router;
